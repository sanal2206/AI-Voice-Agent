import { useCallback, useRef, useState } from 'react';

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const speak = useCallback((text, options = {}) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate   = options.rate   ?? 1.0;
    utterance.pitch  = options.pitch  ?? 1.0;
    utterance.volume = options.volume ?? 1.0;
    utterance.lang   = options.lang   ?? 'en-IN';

    // Pick a natural-sounding voice based on language
    const voices = window.speechSynthesis.getVoices();
    
    // We want specifically Indian Female voices if available
    const scoreVoice = (v) => {
      // Must match the requested language (e.g., 'hi-IN' or 'en-IN')
      if (!v.lang.replace('_', '-').toLowerCase().startsWith(utterance.lang.toLowerCase())) return -1;
      
      let score = 0;
      const name = v.name.toLowerCase();
      
      // Heavily prefer female voices
      if (name.includes('female') || name.includes('woman') || name.includes('girl')) score += 50;
      
      // Known Indian female voices
      if (name.includes('neerja') || name.includes('swara') || name.includes('zira') || name.includes('kalpana')) score += 40;
      if (name.includes('google')) score += 10;
      if (name.includes('natural') || name.includes('online')) score += 5;
      
      // Strictly penalize male voices
      const isMale = (name.includes('male') && !name.includes('female')) ||
                     name.includes('david') || name.includes('ravi') || 
                     name.includes('madhur') || name.includes('hemant') ||
                     name.includes('mark') || name.includes('paul') ||
                     name.includes('george') || name.includes('brian');
      
      if (isMale) score -= 1000;

      return score;
    };

    const scoredVoices = voices
      .map(v => ({ voice: v, score: scoreVoice(v) }))
      .filter(v => v.score >= 0)
      .sort((a, b) => b.score - a.score);

    // If no perfect match found for specific lang, try just matching 'hi' or 'en'
    if (scoredVoices.length === 0) {
      const langPrefix = utterance.lang.split('-')[0].toLowerCase();
      const fallbackScores = voices
        .map(v => ({ voice: v, score: scoreVoice({ ...v, lang: langPrefix }) }))
        .filter(v => v.score >= 0) // discard strictly male voices
        .sort((a, b) => b.score - a.score);
      
      if (fallbackScores.length > 0) {
        utterance.voice = fallbackScores[0].voice;
      } else {
        // Fallback to any female voice if no language match is female
        const anyFemale = voices.find(v => {
          const n = v.name.toLowerCase();
          return n.includes('female') || n.includes('woman') || n.includes('girl') || n.includes('zira') || n.includes('swara');
        });
        utterance.voice = anyFemale || voices.find(v => v.lang.startsWith(langPrefix)) || voices[0];
      }
    } else {
      utterance.voice = scoredVoices[0].voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend   = () => {
      setIsSpeaking(false);
      if (options.onEnd) options.onEnd();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (options.onEnd) options.onEnd();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return { speak, stop, isSpeaking, isSupported };
}
