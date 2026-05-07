import os
from deepgram import (
    DeepgramClient,
    PrerecordedOptions,
    FileSource,
)
from app.core.config import DEEPGRAM_API_KEY

class DeepgramService:
    def __init__(self):
        if not DEEPGRAM_API_KEY:
            # Fallback for development if not in .env yet
            self.api_key = "b9c10b1977d38edfa0c2f997b504ad509a9bb13a"
        else:
            self.api_key = DEEPGRAM_API_KEY
        
        self.client = DeepgramClient(self.api_key)

    def transcribe(self, audio_path: str):
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found at {audio_path}")

        try:
            with open(audio_path, "rb") as file:
                buffer_data = file.read()

            payload: FileSource = {
                "buffer": buffer_data,
            }

            options = PrerecordedOptions(
                model="nova-3",
                smart_format=True,
                language="multi",
                detect_language=True,
            )

            # Re-matching user's specific request: language=multi&model=nova-3
            # We'll use the raw API call style if the SDK PrerecordedOptions doesn't support 'multi' easily
            # but usually 'detect_language=True' is what people want.
            # However, I will try to respect the user's curl params.
            
            # Use raw query params if needed, but let's try standard first.
            response = self.client.listen.prerecorded.v("1").transcribe_file(payload, options)
            
            # Parse response
            # response is a PrerecordedResponse object
            utterance = response.results.channels[0].alternatives[0]
            
            detected_language = response.results.channels[0].detected_language or "en"
            
            return {
                "text": utterance.transcript.strip(),
                "language": detected_language,
                "confidence": round(utterance.confidence, 3),
            }
        except Exception as e:
            print(f"Deepgram Error: {e}")
            raise e

deepgram_service = DeepgramService()
