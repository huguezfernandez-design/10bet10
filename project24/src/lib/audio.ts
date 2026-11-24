// Tiny synthesised sound kit (Web Audio). No files, no autoplay: it only starts after the player turns sound on.

type Sfx = "tap" | "arrive" | "success" | "fail" | "step" | "reveal" | "whoosh";

class SoundKit {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  enabled = false;

  private ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (on) {
      this.ensure();
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  private tone(freq: number, at: number, dur: number, type: OscillatorType = "sine", vol = 0.18) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 2400;
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(f).connect(g).connect(this.master!);
    o.start(at);
    o.stop(at + dur + 0.05);
  }

  play(s: Sfx) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    const t = ctx.currentTime;
    const N = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
    switch (s) {
      case "tap":
        this.tone(N(84), t, 0.08, "triangle", 0.08);
        break;
      case "step":
        this.tone(N(60), t, 0.06, "triangle", 0.04);
        break;
      case "arrive":
        [72, 76, 79, 84].forEach((n, i) => this.tone(N(n), t + i * 0.09, 0.6, "triangle", 0.12));
        break;
      case "success":
        [67, 72, 76, 79, 84, 88].forEach((n, i) => this.tone(N(n), t + i * 0.07, 0.7, "sine", 0.14));
        break;
      case "fail":
        [64, 60].forEach((n, i) => this.tone(N(n), t + i * 0.14, 0.35, "triangle", 0.12));
        break;
      case "whoosh": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(180, t);
        o.frequency.exponentialRampToValueAtTime(720, t + 0.5);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.08, t + 0.2);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        o.connect(g).connect(this.master!);
        o.start(t);
        o.stop(t + 0.7);
        break;
      }
      case "reveal":
        [60, 64, 67, 72, 76, 79, 84, 91].forEach((n, i) => this.tone(N(n), t + i * 0.11, 1.4, "sine", 0.12));
        [48, 55].forEach((n) => this.tone(N(n), t, 2.4, "triangle", 0.1));
        break;
    }
  }

  private startMusic() {
    if (this.musicTimer) return;
    // gentle pentatonic loop
    const scale = [62, 64, 67, 69, 71, 74, 76];
    let step = 0;
    const tick = () => {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const N = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
      if (step % 8 === 0) this.tone(N([50, 47, 43, 45][(step / 8) % 4]), t, 2.6, "sine", 0.05);
      if (step % 2 === 0 || Math.random() > 0.6) {
        this.tone(N(scale[(step * 3 + Math.floor(Math.random() * 3)) % scale.length]), t, 0.9, "triangle", 0.035);
      }
      step++;
    };
    this.musicTimer = setInterval(tick, 380);
  }

  private stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}

export const sound = typeof window !== "undefined" ? new SoundKit() : (null as unknown as SoundKit);
