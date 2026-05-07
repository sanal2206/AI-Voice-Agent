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
    const langPrefix = utterance.lang.split('-')[0];
    
    const preferred = voices.find(v => 
      v.lang.startsWith(langPrefix) && (
        v.name.includes('Female') || 
        v.name.includes('Samantha') || 
        v.name.includes('Victoria') || 
        v.name.includes('Google') ||
        v.name.includes('Natural')
      )
    ) || voices.find(v => v.lang.startsWith(langPrefix)) || voices[0];

    if (preferred) utterance.voice = preferred;

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
