/* ============================================================
   audio.js — howler ラッパー
   - html5:true（iOSマナーモード対策: HTML5 Audio 経路は消音スイッチでも鳴る）
   - ファイルが無い/読めない音は synth.js の合成音へ自動フォールバック
   ============================================================ */

const AudioMan = (() => {
  const FILES = {
    heartbeat:    { src: 'audio/heartbeat.mp3',    loop: true,  volume: 0.55 },
    drumroll:     { src: 'audio/drumroll.mp3',     loop: true,  volume: 0.5 },
    rise1:        { src: 'audio/rise1.mp3',        loop: false, volume: 0.7 },
    rise2:        { src: 'audio/rise2.mp3',        loop: false, volume: 0.75 },
    rise3_gold:   { src: 'audio/rise3_gold.mp3',   loop: false, volume: 0.8 },
    rise4_rainbow:{ src: 'audio/rise4_rainbow.mp3',loop: false, volume: 0.85 },
    seal_crack:   { src: 'audio/seal_crack.mp3',   loop: false, volume: 0.85 },
    fanfare:      { src: 'audio/fanfare.mp3',      loop: false, volume: 0.9 },
    stamp:        { src: 'audio/stamp.mp3',        loop: false, volume: 0.85 },
    chime_soft:   { src: 'audio/chime_soft.mp3',   loop: false, volume: 0.6 },
    piano_calm:   { src: 'audio/piano_calm.mp3',   loop: true,  volume: 0.5 },
    firework_pop: { src: 'audio/firework_pop.mp3', loop: false, volume: 0.5 },
  };
  // 注: low_hit / paper はファイルを持たず常に synth.js の合成音で鳴る

  const howls = {};
  const ready = new Set();
  const failed = new Set();
  const synthHandles = {};
  let unlocked = false;

  function preload() {
    Object.entries(FILES).forEach(([name, def]) => {
      howls[name] = new Howl({
        src: [def.src],
        loop: def.loop,
        volume: def.volume,
        html5: true,
        preload: true,
        onload: () => ready.add(name),
        onloaderror: () => failed.add(name),
        onplayerror: () => failed.add(name),
      });
    });
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    // ユーザージェスチャ内で AudioContext を解錠
    if (Howler.ctx && Howler.ctx.state === 'suspended') Howler.ctx.resume();
    Synth.ensureCtx();
    preload();
    // 画面復帰時の再解錠（iOSはロックで suspend される）
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (Howler.ctx && Howler.ctx.state === 'suspended') Howler.ctx.resume();
        Synth.ensureCtx();
      }
    });
  }

  function useFile(name) {
    return ready.has(name) && !failed.has(name);
  }

  function play(name, opts = {}) {
    try {
      if (useFile(name)) {
        const h = howls[name];
        h.stop();
        if (opts.volume != null) h.volume(opts.volume);
        if (opts.rate != null && h.rate) h.rate(opts.rate);
        h.play();
        return;
      }
      stopSynth(name);
      const handle = Synth.play(name, opts);
      if (handle) synthHandles[name] = handle;
    } catch (err) {
      console.error('audio play failed:', name, err);
    }
  }

  function stopSynth(name) {
    if (synthHandles[name]) {
      synthHandles[name].stop();
      delete synthHandles[name];
    }
  }

  function stop(name) {
    try {
      if (howls[name]) howls[name].stop();
      stopSynth(name);
    } catch (err) {
      console.error('audio stop failed:', name, err);
    }
  }

  function stopAll() {
    Object.keys(FILES).forEach(stop);
    Synth.stopAll();
  }

  function fade(name, to, durMs) {
    try {
      if (useFile(name)) {
        const h = howls[name];
        h.fade(h.volume(), to, durMs);
      }
    } catch (err) {
      console.error('audio fade failed:', name, err);
    }
  }

  // 心拍テンポ（bpm）— ファイル再生時は rate、合成時は間隔で表現
  function heartbeat(bpm) {
    try {
      if (useFile('heartbeat')) {
        const h = howls.heartbeat;
        h.rate(Math.max(0.5, Math.min(2, bpm / 60)));
        if (!h.playing()) h.play();
        return;
      }
      stopSynth('heartbeat');
      const handle = Synth.play('heartbeat', { intervalMs: Math.round(60000 / bpm) });
      if (handle) synthHandles.heartbeat = handle;
    } catch (err) {
      console.error('heartbeat failed:', err);
    }
  }

  return { unlock, play, stop, stopAll, fade, heartbeat };
})();
