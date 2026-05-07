import os
import subprocess
import tempfile

import torch
import whisper


FFMPEG_BIN = r"C:\ffmpeg\ffmpeg-2026-04-30-git-cc3ca17127-full_build\bin"
if FFMPEG_BIN not in os.environ.get("PATH", ""):
    os.environ["PATH"] += os.pathsep + FFMPEG_BIN


class WhisperService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)

            device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"Loading Whisper model on {device}...")
            cls._model = whisper.load_model("base", device=device)

        return cls._instance

    def preprocess_audio(self, input_path: str) -> str:
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        output_path = temp_file.name
        temp_file.close()

        command = [
            "ffmpeg",
            "-y",
            "-i",
            input_path,
            "-ac",
            "1",
            "-ar",
            "16000",
            "-loglevel",
            "error",
            output_path,
        ]

        subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        return output_path

    def detect_language(self, audio_path: str):
        audio = whisper.load_audio(audio_path)
        chunk_size = 480000
        chunks = [audio[i : i + chunk_size] for i in range(0, len(audio), chunk_size)]

        votes = {}
        confidences = []
        for chunk in chunks[:3]:
            chunk = whisper.pad_or_trim(chunk)
            mel = whisper.log_mel_spectrogram(chunk).to(self._model.device)
            _, probs = self._model.detect_language(mel)
            lang = max(probs, key=probs.get)
            conf = probs[lang]
            votes[lang] = votes.get(lang, 0) + conf
            confidences.append(conf)

        detected_lang = max(votes, key=votes.get) if votes else "unknown"
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        return detected_lang, avg_confidence

    def transcribe(self, audio_path: str):
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found at {audio_path}")

        processed_path = self.preprocess_audio(audio_path)

        try:
            language, confidence = self.detect_language(processed_path)
            transcribe_language = language

            if confidence < 0.65:
                print(f"[WARN] Low confidence ({confidence:.2f}) -> using Whisper auto language")
                transcribe_language = None

            result = self._model.transcribe(
                processed_path,
                language=transcribe_language,
                task="transcribe",
                initial_prompt=(
                    "Rupeezy Partner Program sales call. Hindi, Hinglish, or English. "
                    "Common words: zero joining fee, 100 percent brokerage share, daily payout, "
                    "RM support, WhatsApp, broker, clients, contacts, bharosa, samasya, baad mein."
                ),
                temperature=0.0,
                beam_size=5,
                best_of=5,
                condition_on_previous_text=False,
            )

            return {
                "text": result.get("text", "").strip(),
                "language": result.get("language") or transcribe_language or language,
                "confidence": round(confidence, 3),
            }
        finally:
            if os.path.exists(processed_path):
                os.remove(processed_path)


whisper_service = WhisperService()
