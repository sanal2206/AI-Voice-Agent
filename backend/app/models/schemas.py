from pydantic import BaseModel
from typing import List, Optional

class Message(BaseModel):
    role: str # "user" or "model"
    content: str

class SpeechInput(BaseModel):
    text: str
    history: List[Message] = []

class ProcessedResponse(BaseModel):
    response_text: str
    detected_language: str
    objections_handled: List[str]
    lead_classification: str # Cold, Warm, Hot
    interest_level: str
    network_size: str
    requires_handoff: bool
    recommended_next_action: str
    post_call_summary: Optional[str] = None
