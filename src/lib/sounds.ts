let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (audioCtx) return audioCtx;
  if (typeof window === 'undefined') return null;
  try {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return audioCtx;
  } catch {
    return null;
  }
}

export function playNotificationSound(frequency = 880, duration = 150) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {
        // Audio context resume failed - user interaction may be required
      });
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
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
