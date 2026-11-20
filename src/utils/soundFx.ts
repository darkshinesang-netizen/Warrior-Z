class SoundFxEngine {
  private ctx: AudioContext | null = null;
  private musicTimer: number | null = null;
  private musicNoteIdx = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType, gainPeak: number, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playClick(enabled: boolean) {
    if (!enabled) return;
    this.playTone(620, 0.07, 'triangle', 0.06);
  }

  playTabSwitch(enabled: boolean) {
    if (!enabled) return;
    this.playTone(520, 0.06, 'sine', 0.05);
    this.playTone(760, 0.08, 'triangle', 0.04, 0.04);
  }

  playClaim(enabled: boolean) {
    if (!enabled) return;
    this.playTone(587.33, 0.1, 'triangle', 0.07, 0);
    this.playTone(783.99, 0.12, 'triangle', 0.07, 0.06);
    this.playTone(1046.5, 0.18, 'sine', 0.08, 0.12);
  }

  playSummon(enabled: boolean) {
    if (!enabled) return;
    const notes = [440, 554.37, 659.25, 880, 1174.66];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.16, 'triangle', 0.065, idx * 0.055);
    });
  }

  playHit(enabled: boolean, isCrit = false) {
    if (!enabled) return;
    this.playTone(isCrit ? 220 : 175, 0.09, 'sawtooth', isCrit ? 0.07 : 0.045);
    if (isCrit) {
      this.playTone(540, 0.11, 'triangle', 0.05, 0.02);
    }
  }

  playUltimate(enabled: boolean) {
    if (!enabled) return;
    this.playTone(330, 0.12, 'sawtooth', 0.06, 0);
    this.playTone(494, 0.14, 'triangle', 0.07, 0.05);
    this.playTone(784, 0.22, 'sawtooth', 0.06, 0.11);
  }

  playVictory(enabled: boolean) {
    if (!enabled) return;
    const fanfare = [523.25, 659.25, 783.99, 1046.5];
    fanfare.forEach((n, idx) => {
      this.playTone(n, 0.22, 'triangle', 0.08, idx * 0.08);
    });
  }

  playDefeat(enabled: boolean) {
    if (!enabled) return;
    this.playTone(329.63, 0.18, 'sawtooth', 0.05, 0);
    this.playTone(246.94, 0.28, 'triangle', 0.055, 0.12);
  }

  setAmbientMusic(enabled: boolean) {
    if (typeof window === 'undefined') return;
    if (!enabled) {
      if (this.musicTimer !== null) {
        window.clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
      return;
    }
    if (this.musicTimer !== null) return;

    const pentatonic = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const freq = pentatonic[this.musicNoteIdx % pentatonic.length];
      this.musicNoteIdx = (this.musicNoteIdx + 2) % pentatonic.length;
      this.playTone(freq, 0.55, 'sine', 0.014);
    }, 1800);
  }
}

export const soundFx = new SoundFxEngine();
