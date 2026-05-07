import json
from google import genai
from google.genai import types
from app.models.schemas import SpeechInput, ProcessedResponse
from app.core.config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


SYSTEM_PROMPT = """
You are a high-performing AI Voice Sales Agent for Rupeezy.

Speak like a real human sales agent. Keep responses short (1–3 sentences).

FLOW:
1. Hook
2. Discovery
3. Pitch (only relevant benefits)
4. Handle objections naturally
5. Qualify lead
6. Close → push to RM if interested

Benefits:
- Zero joining fee
- 100% brokerage
- Daily payouts

Objections:
- Already broker → ask about 100% brokerage
- No contacts → say can start small
- Support → RM + backend
- Trust → SEBI registered
- Call later → ask time or WhatsApp

CLASSIFICATION:
Hot → ready + interested
Warm → interested but unsure
Cold → not interested

If HOT → say RM will call → requires_handoff = true

Return JSON only.
"""


def detect_language(text: str) -> str:
    text = text.lower()
    if any(word in text for word in ["hai", "kya", "haan", "nahi"]):
        return "hinglish"
    return "en"


def heuristic_scoring(text: str):
    text = text.lower()

    if any(word in text for word in ["interested", "join", "start", "yes"]):
        return "High", "Medium", "Ready"

    if any(word in text for word in ["maybe", "later", "thinking"]):
        return "Medium", "Small", "Exploring"

    return "Low", "None", "Not Interested"


async def generate_llm_response(input_data: SpeechInput) -> ProcessedResponse:
    if not client:
        raise ValueError("GEMINI_API_KEY not set")

    try:
        contents = []

        for msg in input_data.history:
            contents.append(
                types.Content(
                    role=msg.role,
                    parts=[types.Part.from_text(text=msg.content)]
                )
            )

        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=input_data.text)]
            )
        )

        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=ProcessedResponse,
                temperature=0.3
            )
        )

        result = json.loads(response.text)

        # 🔥 Enhance with deterministic scoring
        interest, network, readiness = heuristic_scoring(input_data.text)

        if interest == "High" and readiness == "Ready":
            result["lead_classification"] = "Hot"
            result["requires_handoff"] = True
            result["recommended_next_action"] = "RM Callback"

        elif interest == "Medium":
            result["lead_classification"] = "Warm"
            result["recommended_next_action"] = "WhatsApp Follow-up"

        else:
            result["lead_classification"] = "Cold"

        result["interest_level"] = interest
        result["network_size"] = network
        
        # Use Whisper's detected language if provided
        if input_data.detected_language:
            result["detected_language"] = input_data.detected_language

        return ProcessedResponse(**result)

    except Exception as e:
        return ProcessedResponse(
            response_text=f"Error: {str(e)}",
            detected_language="en",
            objections_handled=[],
            lead_classification="Cold",
            interest_level="Low",
            network_size="None",
            requires_handoff=False,
            recommended_next_action="Retry",
            post_call_summary=None
        )