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
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=your_llm_model
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


<img width="1920" height="997" alt="screencapture-aivoiceagentforbharat-vercel-app-voice-2026-05-07-19_56_05" src="https://github.com/user-attachments/assets/85aa5c49-6c1c-422b-9a92-2c0dc4f41196" />

<img width="1920" height="1215" alt="screencapture-aivoiceagentforbharat-vercel-app-session-3e672cc1-4839-4b8a-bb30-3e6f90563f33-2026-05-07-19_55_44" src="https://github.com/user-attachments/assets/8dcdab72-2604-43ad-9b29-81b3a65374a6" />

<img width="1920" height="1489" alt="screencapture-aivoiceagentforbharat-vercel-app-session-674e173a-7200-45df-bf17-c459722ec209-2026-05-07-19_55_18" src="https://github.com/user-attachments/assets/bb72b163-c09a-4db1-8d3b-3b1f77da0f8d" />

<img width="1920" height="1215" alt="screencapture-aivoiceagentforbharat-vercel-app-session-3e672cc1-4839-4b8a-bb30-3e6f90563f33-2026-05-07-19_55_44" src="https://github.com/user-attachments/assets/1b8f842c-0bbf-4c48-8fb2-b9dfaac31f95" />

<img width="847" height="440" alt="Screenshot 2026-05-07 203958" src="https://github.com/user-attachments/assets/447dfb73-b1c1-4f5c-ab1e-897597adcf0b" /><img width="845" height="443" alt="Screenshot 2026-05-07 203910" src="https://github.com/user-attachments/assets/bf16319e-8935-4948-8ebc-78d40295c79b" />

<img width="848" height="443" alt="Screenshot 2026-05-07 204012" src="https://github.com/user-attachments/assets/2b18be3d-aa8e-46cc-bd55-30c0b2051a4d" />

<img width="847" height="440" alt="Screenshot 2026-05-07 203958" src="https://github.com/user-attachments/assets/4f1d6819-75e6-43bf-85e6-c6e0087b99e7" />


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
