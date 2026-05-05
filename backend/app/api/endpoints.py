from fastapi import APIRouter
from app.models.schemas import SpeechInput, ProcessedResponse
from app.services.llm_response import generate_llm_response

router = APIRouter()

@router.post("/process-speech", response_model=ProcessedResponse)
async def process_speech(input_data: SpeechInput):
    # The LLM orchestrator now handles language detection, objections, and scoring
    response_data = await generate_llm_response(input_data)
    return response_data
