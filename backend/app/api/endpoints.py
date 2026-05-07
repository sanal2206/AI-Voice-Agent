from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from app.services.whisper_service import whisper_service
from app.services.llm_response import generate_llm_response
from app.models.schemas import (
    SpeechInput, 
    ProcessedResponse, 
    VoiceAgentResponse, 
    TranscriptionResult,
    Message
)
import os
import shutil
import json
from typing import Optional, List

router = APIRouter()

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    # Save temp file
    temp_dir = "temp_audio"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        result = whisper_service.transcribe(file_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@router.post("/process", response_model=ProcessedResponse)
async def process_speech(input_data: SpeechInput):
    try:
        response = await generate_llm_response(input_data)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/voice", response_model=VoiceAgentResponse)
async def voice_agent_endpoint(
    file: UploadFile = File(...), 
    history: Optional[str] = Form(None)
):
    """
    Unified endpoint: 
    1. Upload Audio -> 2. Whisper STT + Lang Detect -> 3. LLM Response -> 4. Result
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    # Save temp file
    temp_dir = "temp_audio"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, f"voice_{file.filename}")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 1. Transcribe & Detect Language
        transcription = whisper_service.transcribe(file_path)
        
        # 2. Parse History if provided
        history_list = []
        if history:
            try:
                history_data = json.loads(history)
                history_list = [Message(**msg) for msg in history_data]
            except Exception as e:
                print(f"Error parsing history: {e}")

        # 3. Generate LLM Response
        speech_input = SpeechInput(
            text=transcription["text"],
            detected_language=transcription["language"],
            history=history_list
        )
        
        agent_response = await generate_llm_response(speech_input)
        
        return VoiceAgentResponse(
            transcription=TranscriptionResult(**transcription),
            agent_response=agent_response
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)