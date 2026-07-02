/* ============================================================
   synth.js — WebAudio 合成音フォールバック
   audio/ のmp3が無い・読めない場合でも音演出が成立するようにする
   ============================================================ */

const Synth = (() => {
  let ctx = null;
  const active = new Set();

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = AC ? new AC() : null;
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function master(gainValue) {
    const g = ctx.createGain();
    g.gain.value = gainValue;
    g.connect(ctx.destination);
    return g;
  }

  function noiseBuffer(seconds) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function tone(freq, { type = 'sine', dur = 0.4, gain = 0.25, when = 0, glideTo = null } = {}) {
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = master(0);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    return osc;
  }

  function noiseHit({ dur = 0.25, gain = 0.3, when = 0, filterType = 'highpass', freq = 1500 } = {}) {
    const t0 = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(dur + 0.1);
    const f = ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = freq;
    const g = master(0);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    src.start(t0);
    src.stop(t0 + dur + 0.1);
    return src;
  }

  /* ---- 各効果音 ---- */

  const sounds = {
    heartbeat(loopHandle) {
      // ドクン（低音2連） — loopHandle.stop() が呼ばれるまで繰り返す
      const beat = () => {
        if (loopHandle.stopped) return;
        tone(58, { type: 'sine', dur: 0.16, gain: 0.5 });
        tone(50, { type: 'sine', dur: 0.2, gain: 0.42, when: 0.18 });
        loopHandle.timer = setTimeout(beat, loopHandle.intervalMs || 1050);
      };
      beat();
    },

    drumroll(loopHandle) {
      // 細かいノイズ連打（クレッシェンドは audio.js 側の音量で表現）
      const hit = () => {
        if (loopHandle.stopped) return;
        noiseHit({ dur: 0.05, gain: 0.16, filterType: 'bandpass', freq: 2400 });
        loopHandle.timer = setTimeout(hit, 42);
      };
      hit();
    },

    rise1() {
      tone(660, { type: 'triangle', dur: 0.5, gain: 0.2, glideTo: 1320 });
    },
    rise2() {
      tone(440, { type: 'sawtooth', dur: 0.7, gain: 0.16, glideTo: 1760 });
      tone(1760, { type: 'sine', dur: 0.4, gain: 0.18, when: 0.35 });
    },
    rise3_gold() {
      tone(330, { type: 'sawtooth', dur: 0.9, gain: 0.18, glideTo: 2640 });
      [1046, 1318, 1568].forEach((f, i) => tone(f, { type: 'sine', dur: 0.6, gain: 0.16, when: 0.5 + i * 0.09 }));
    },
    rise4_rainbow() {
      tone(262, { type: 'sawtooth', dur: 1.1, gain: 0.18, glideTo: 3520 });
      [1046, 1318, 1568, 2093, 2637].forEach((f, i) => tone(f, { type: 'sine', dur: 0.7, gain: 0.15, when: 0.55 + i * 0.08 }));
    },

    seal_crack() {
      noiseHit({ dur: 0.12, gain: 0.5, filterType: 'highpass', freq: 900 });
      noiseHit({ dur: 0.2, gain: 0.3, when: 0.05, filterType: 'bandpass', freq: 500 });
    },

    fanfare() {
      // パパパ・パーン！（C-E-G-C の brass 風）
      const seq = [
        [523, 0, 0.16], [523, 0.19, 0.16], [523, 0.38, 0.16],
        [659, 0.6, 0.22], [784, 0.86, 0.5], [1046, 1.2, 1.1],
      ];
      seq.forEach(([f, when, dur]) => {
        tone(f, { type: 'sawtooth', dur, gain: 0.22, when });
        tone(f / 2, { type: 'square', dur, gain: 0.08, when });
      });
      [2093, 2637, 3136].forEach((f, i) => tone(f, { type: 'sine', dur: 0.9, gain: 0.1, when: 1.25 + i * 0.06 }));
    },

    stamp() {
      tone(120, { type: 'sine', dur: 0.18, gain: 0.6, glideTo: 55 });
      noiseHit({ dur: 0.1, gain: 0.28, filterType: 'lowpass', freq: 800 });
    },

    chime_soft() {
      [880, 660, 550].forEach((f, i) => tone(f, { type: 'sine', dur: 1.6, gain: 0.14, when: i * 0.5 }));
    },

    piano_calm(loopHandle) {
      const chord = [[262, 330, 392], [220, 262, 330], [175, 262, 349], [196, 294, 392]];
      let bar = 0;
      const play = () => {
        if (loopHandle.stopped) return;
        chord[bar % chord.length].forEach((f, i) => {
          tone(f, { type: 'triangle', dur: 2.4, gain: 0.09, when: i * 0.07 });
          tone(f * 2, { type: 'sine', dur: 2.0, gain: 0.04, when: 0.4 + i * 0.07 });
        });
        bar += 1;
        loopHandle.timer = setTimeout(play, 2600);
      };
      play();
    },

    firework_pop() {
      noiseHit({ dur: 0.3, gain: 0.4, filterType: 'lowpass', freq: 1200 });
      tone(180, { type: 'sine', dur: 0.25, gain: 0.3, glideTo: 60 });
    },

    low_hit() {
      tone(80, { type: 'sine', dur: 0.7, gain: 0.55, glideTo: 42 });
      noiseHit({ dur: 0.3, gain: 0.16, filterType: 'lowpass', freq: 300 });
    },

    paper() {
      noiseHit({ dur: 0.3, gain: 0.1, filterType: 'highpass', freq: 2500 });
    },
  };

  function play(name, opts = {}) {
    if (!ensureCtx()) return null;
    const fn = sounds[name];
    if (!fn) return null;
    // ループ系（heartbeat / drumroll / piano_calm）はハンドルを返す
    if (name === 'heartbeat' || name === 'drumroll' || name === 'piano_calm') {
      const handle = {
        stopped: false,
        timer: null,
        intervalMs: opts.intervalMs,
        stop() {
          this.stopped = true;
          if (this.timer) clearTimeout(this.timer);
          active.delete(this);
        },
      };
      active.add(handle);
      fn(handle);
      return handle;
    }
    fn();
    return null;
  }

  function stopAll() {
    active.forEach((h) => h.stop());
  }

  return { play, stopAll, ensureCtx };
})();
