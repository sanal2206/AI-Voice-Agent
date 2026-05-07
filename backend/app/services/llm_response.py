import json
from openai import AsyncOpenAI
from app.models.schemas import SpeechInput, ProcessedResponse
from app.core.config import OPENROUTER_API_KEY, OPENROUTER_MODEL

client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
) if OPENROUTER_API_KEY else None


SYSTEM_PROMPT = """
You are a high-performing AI Voice Sales Agent for Rupeezy. Your goal is to run a structured sales call following this script:

1. HOOK: Open with a concise, engaging hook.
2. PITCH: Pitch key benefits:
   - Zero joining fee
   - 100% brokerage share
   - Daily payouts
3. OBJECTIONS: Handle these 5 core objections naturally:
   - "Already with another broker": Rebuttal: Highlight 100% brokerage and better tech.
   - "Don't have enough contacts": Rebuttal: You can start small, we provide training and leads.
   - "Support issues / who handles support?": Rebuttal: Dedicated RM (Relationship Manager) + 24/7 backend support.
   - "Is Rupeezy trustworthy?": Rebuttal: SEBI registered, thousands of happy partners, transparent daily payouts.
   - "I'll think about it / call me later": Rebuttal: Ask for a specific time or offer to send details on WhatsApp immediately.
4. QUALIFY: Qualify based on interest level, readiness, and network size.
5. CLOSE: Clear call to action (CTA).
   - If HOT: Push for immediate RM handoff or signup.
   - If WARM/COLD: WhatsApp follow-up.
   - End the conversation if:
     a) The lead is qualified and handed off.
     b) The lead is explicitly not interested (Cold).
     c) A follow-up/callback is scheduled.
     d) The user says goodbye or hangs up.

TONE & LANGUAGE:
- Speak like a real human, not robotic.
- Multilingual: Fluently switch between Hindi, English, and Hinglish. Support regional languages (Tamil, Telugu, Marathi, Gujarati, Bengali) if the user speaks them.
- Adapt contextually to what the lead says.

OUTPUT FORMAT:
Return a JSON object matching this schema:
{
  "response_text": "Your spoken response to the user",
  "detected_language": "The language you detected",
  "objections_handled": ["List of objections you identified and addressed"],
  "lead_classification": "Hot" | "Warm" | "Cold",
  "interest_level": "High" | "Medium" | "Low",
  "network_size": "Large" | "Medium" | "Small" | "None",
  "requires_handoff": true | false,
  "recommended_next_action": "RM Call" | "WhatsApp Follow-up" | "None",
  "conversation_ended": true | false,
  "post_call_summary": "Summary of conversation: Duration (estimate), Topics, Objections, Score, Next Action"
}
"""


RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "response_text": {"type": "string"},
        "detected_language": {"type": "string"},
        "objections_handled": {"type": "array", "items": {"type": "string"}},
        "lead_classification": {"type": "string", "enum": ["Hot", "Warm", "Cold"]},
        "interest_level": {"type": "string", "enum": ["High", "Medium", "Low"]},
        "network_size": {"type": "string", "enum": ["Large", "Medium", "Small", "None"]},
        "requires_handoff": {"type": "boolean"},
        "recommended_next_action": {"type": "string"},
        "conversation_ended": {"type": "boolean"},
        "post_call_summary": {"type": "string"},
    },
    "required": [
        "response_text", "detected_language", "objections_handled",
        "lead_classification", "interest_level", "network_size",
        "requires_handoff", "recommended_next_action", "conversation_ended",
    ],
}


def detect_language(text: str) -> str:
    text = text.lower()
    # Basic heuristic for language detection if not provided
    if any(word in text for word in ["hai", "kya", "haan", "nahi", "kaise", "bhai"]):
        return "hinglish"
    return "en"


async def generate_llm_response(input_data: SpeechInput) -> ProcessedResponse:
    if not client:
        raise ValueError("OPENROUTER_API_KEY not set")

    try:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Add history to context
        for msg in input_data.history:
            # Map "model" role to "assistant" for OpenAI-compatible API
            role = "assistant" if msg.role == "model" else msg.role
            messages.append({"role": role, "content": msg.content})

        # Add current user input
        messages.append({"role": "user", "content": input_data.text})

        response = await client.chat.completions.create(
            model=OPENROUTER_MODEL,
            messages=messages,
            temperature=0.3,
            response_format={"type": "json_object"},
            extra_headers={
                "HTTP-Referer": "https://rupeezy.in",
                "X-Title": "Rupeezy Voice Agent",
            },
        )

        result_text = response.choices[0].message.content

        # Ensure we have valid JSON
        try:
            result = json.loads(result_text)
        except json.JSONDecodeError:
            # Fallback if JSON is wrapped in code blocks
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0]
            result = json.loads(result_text)

        # Ensure all fields from ProcessedResponse are present
        if "detected_language" not in result:
            result["detected_language"] = input_data.detected_language or detect_language(input_data.text)

        return ProcessedResponse(**result)

    except Exception as e:
        print(f"LLM Error: {e}")
        return ProcessedResponse(
            response_text="I'm sorry, I'm having a bit of trouble. Could you repeat that?",
            detected_language="en",
            objections_handled=[],
            lead_classification="Cold",
            interest_level="Low",
            network_size="None",
            requires_handoff=False,
            recommended_next_action="Retry",
            conversation_ended=False,
            post_call_summary=f"Error occurred: {str(e)}"
        )