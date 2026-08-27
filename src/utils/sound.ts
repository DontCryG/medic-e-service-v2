
// Use a singleton to keep the context alive and bypass some autoplay restrictions
let audioCtx: AudioContext | null = null;

export async function playNotificationSound() {
  try {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      audioCtx = new AudioContext();
    }
    
    // Wake up the audio context if the browser suspended it
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    
    // Clear pleasant chime (High pitch bell)
    osc.frequency.setValueAtTime(880.00, audioCtx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1760.00, audioCtx.currentTime + 0.1); // A6
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05); 
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5); 
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.warn("Notification sound blocked or not supported", e);
  }
}
