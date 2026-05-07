# AI Voice Agent for Partner Lead Conversion

A real-time, multilingual AI Voice Agent designed to automate partner lead conversion for financial services platforms in Bharat. The system acts as a high-performing digital sales agent, engaging leads through natural voice conversations, handling objections, and intelligently qualifying them for Relationship Manager (RM) handoff.

---

## 🎯 Problem Statement

In the financial services industry, delayed lead response times and language barriers significantly reduce conversion rates. Manual outbound calling operations are difficult to scale, especially during peak hours. Furthermore, human agents often face challenges with consistent objection handling and maintaining context across different regional languages in Bharat. 

There is a critical need for an automated, zero-latency solution that can instantly engage leads, speak their native language (Hindi, English, Hinglish), and seamlessly route high-intent prospects to human closers.

---

## 🏗 Architecture

The project utilizes a client-server architecture designed for real-time audio processing:

1. **Audio Capture**: The frontend continuously listens and captures user audio, automatically managing silence detection.
2. **Transcription Pipeline**: Audio data is processed through Deepgram's STT engine for ultra-fast, language-agnostic transcription.
3. **Intelligence Engine**: Google Gemini (LLM) evaluates the transcript, referencing a custom sales playbook to handle objections (e.g., "I already have a broker", "I don't have contacts").
4. **Scoring & Routing**: A deterministic heuristic engine analyzes intent ("Join", "Maybe", "Later") to classify leads into Hot, Warm, or Cold, flagging Hot leads for immediate RM handoff.
5. **Speech Synthesis**: The dynamic TTS engine responds naturally in the user's detected language.

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- API Keys: Deepgram API Key, Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/sanalsabu22/AI-Voice-Agent.git
cd AI-Voice-Agent
```

### 2. Setup the Backend (FastAPI)
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```
Create a `.env` file in the `backend` folder:
```env
DEEPGRAM_API_KEY=your_deepgram_key
GOOGLE_API_KEY=your_gemini_key
```
Start the backend server:
```bash
uvicorn main:app --reload
# Server runs on http://127.0.0.1:8000
```

### 3. Setup the Frontend (React + Vite)
Open a new terminal window:
```bash
cd AI-Voice-Agent/frontend
npm install
npm run dev
# Access the application at http://localhost:5173
```

---

## 📸 Screenshots

*(Replace the placeholder URLs below with your actual image paths once uploaded to the repo)*

| Voice Call Interface | Lead Status Dashboard |
|:---:|:---:|
| ![Voice Call](docs/placeholders/voice-call.png) | ![Dashboard](docs/placeholders/dashboard.png) |

| Live Hindi Conversation | RM/Lead Routing Flow |
|:---:|:---:|
| ![Hindi Chat](docs/placeholders/hindi-chat.png) | ![Routing Flow](docs/placeholders/routing-flow.png) |

---

## 🎥 Demo Video

[![Watch the Demo](https://img.youtube.com/vi/YOUR_VIDEO_ID/maxresdefault.jpg)](https://youtube.com/YOUR_VIDEO_LINK)

*(Click the image above to watch the AI Voice Agent in action, or [view it here](https://youtube.com/YOUR_VIDEO_LINK))*

---

## 🔄 API Flow

1. **Client Interaction:** User speaks into the microphone; frontend detects speech.
2. **`POST /api/process-speech`:** The client sends the structured audio data / transcription alongside the conversation history.
3. **Language Detection:** Backend dynamically detects if the user is speaking English, Hindi, or Hinglish.
4. **LLM Generation:** `generate_llm_response()` creates a concise, sales-focused response and handles any detected objections.
5. **Lead Classification Engine:** 
   - Analyzes intent and network size.
   - Classifies as `Hot`, `Warm`, or `Cold`.
   - Determines `requires_handoff` status.
6. **Response Delivery:** JSON containing the text response, lead status, and TTS instructions is returned to the frontend.
7. **Synthesis:** The frontend triggers the appropriate TTS voice (e.g., Hindi female voice) and updates the dashboard UI instantly.

---

## 💻 Tech Stack

**Frontend:**
- React 19
- Vite
- Tailwind CSS
- React Router DOM

**Backend:**
- Python 3
- FastAPI
- Uvicorn
- Pydantic

**AI & Speech Pipeline:**
- Google Gemini (gemini-2.5-flash) for LLM Intelligence
- Deepgram for low-latency Speech-to-Text (STT)
- Dynamic Text-to-Speech (TTS) Engine

---

## 🚀 Deployment

- **Frontend:** Hosted on [Vercel](https://vercel.com) for edge-optimized static delivery.
- **Backend:** Hosted on [Railway](https://railway.app) for scalable API serving.
