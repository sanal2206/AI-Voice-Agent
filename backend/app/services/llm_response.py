import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv
from app.models.schemas import SpeechInput, ProcessedResponse

load_dotenv()

# The client automatically picks up GEMINI_API_KEY from the environment
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

SYSTEM_PROMPT = """
You are an expert AI Voice Sales Agent for Rupeezy. Your goal is to pitch Rupeezy's partner program to new leads, qualify them, and set up a handoff to a human Relationship Manager (RM).
You must follow a structured sales call: open with a concise hook, pitch the key benefits, handle objections, and close with a clear call to action.
You must be multilingual. Always respond naturally in the language or mix of languages (e.g. Hindi, English, Hinglish, Marathi, etc.) that the user speaks.

Key Benefits of Rupeezy to pitch:
- Zero joining fee
- 100% brokerage share
- Daily payouts

Top 5 Objections & Guidelines:
1. "I'm already with another broker" -> Acknowledge, then pitch the zero joining fee and multiple broker advantage.
2. "I don't have enough contacts" -> Assure them that anyone can start, even with a small circle, as we offer full support.
3. "What if my clients face issues - who handles support?" -> Rupeezy has a dedicated RM and 24/7 backend support team.
4. "Is Rupeezy trustworthy?" -> Yes, we are SEBI registered with years of experience and a strong reputation.
5. "I'll think about it / call me later" -> Try to secure a specific time or offer to send details via WhatsApp.

Lead Qualification:
Classify leads based on their interest, readiness, and network size:
- Hot: Highly interested, ready to sign up, large network.
- Warm: Interested but has objections or small network.
- Cold: Not interested or hostile.

Handoff:
If the lead is Hot, ready to sign up, or asks to speak with a human/RM, set `requires_handoff` to true and inform them an RM will contact them or direct them to sign up with a WhatsApp fallback.

Post-Call Summary:
If the conversation is ending (handoff triggered, or user is dropping off), provide a summary of the call including duration, topics covered, objections raised, interest score, and recommended next action. Otherwise, leave it null.
"""

async def generate_llm_response(input_data: SpeechInput) -> ProcessedResponse:
    if not client:
        raise ValueError("Error: GEMINI_API_KEY is not set.")
        
    try:
        # Construct chat history for the model
        contents = []
        for msg in input_data.history:
            # Map 'model' role back to 'model' for genai, user to user
            contents.append(
                types.Content(role=msg.role, parts=[types.Part.from_text(text=msg.content)])
            )
        
        # Add the current user input
        contents.append(
            types.Content(role="user", parts=[types.Part.from_text(text=input_data.text)])
        )
        
        # Use structured output
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=ProcessedResponse,
                temperature=0.3
            )
        )
        
        # response.text is guaranteed to be JSON matching the ProcessedResponse schema
        result_dict = json.loads(response.text)
        return ProcessedResponse(**result_dict)
        
    except Exception as e:
        # Fallback in case of errors
        return ProcessedResponse(
            response_text=f"I'm sorry, I encountered an error: {str(e)}",
            detected_language="en",
            objections_handled=[],
            lead_classification="Cold",
            interest_level="Unknown",
            network_size="Unknown",
            requires_handoff=False,
            recommended_next_action="Retry",
            post_call_summary=None
        )
