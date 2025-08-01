// tts.js
export function processQueue(ttsQueue, isSpeaking, ttsEnabled) {
  if (!ttsQueue || !isSpeaking) return; // Prevent undefined errors
  if (isSpeaking.current || ttsQueue.current.length === 0 || !ttsEnabled) return;
  const nextText = ttsQueue.current.shift();
  if (nextText) {
    const utterance = new window.SpeechSynthesisUtterance(nextText);
    isSpeaking.current = true;
    utterance.onend = () => {
      isSpeaking.current = false;
      processQueue(ttsQueue, isSpeaking, ttsEnabled);
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
}

export const speakTTS = (text) => {
  if ('speechSynthesis' in window) {
    const utterance = new window.SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
};