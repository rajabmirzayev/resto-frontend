const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)() : null;

export function playNotificationSound(frequency = 880, duration = 150) {
  if (!audioCtx) return;

  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration / 1000);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  } catch {
    // Silently fail if audio context is not available
  }
}

export function playNewOrderSound() {
  playNotificationSound(880, 100);
  setTimeout(() => playNotificationSound(1100, 150), 120);
}

export function playOrderReadySound() {
  playNotificationSound(660, 100);
  setTimeout(() => playNotificationSound(880, 100), 100);
  setTimeout(() => playNotificationSound(1100, 200), 200);
}

export function playSuccessSound() {
  playNotificationSound(523, 100);
  setTimeout(() => playNotificationSound(659, 100), 100);
  setTimeout(() => playNotificationSound(784, 150), 200);
}
