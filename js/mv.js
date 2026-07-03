/* ============================================================
   mv.js — 公式YouTube音源の自動再生（IFrame API）
   - 音源ファイルは同梱しない（公開URLでの音源配布は著作権侵害のため）
   - フィナーレ入りのタップ（ユーザージェスチャ）内で同期的に playVideo()
     を呼ぶことで、追加タップなしの音声つき自動再生を成立させる
   ============================================================ */

const MvPlayer = (() => {
  let apiRequested = false;
  const players = {};
  const ready = {};

  function loadApi() {
    if (apiRequested) return;
    apiRequested = true;
    window.onYouTubeIframeAPIReady = createPlayers;
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(s);
  }

  function createPlayers() {
    ['win', 'lose'].forEach((kind) => {
      const conf = CONFIG.MV && CONFIG.MV[kind];
      if (!conf || !conf.id) return;
      try {
        players[kind] = new YT.Player(`mv-${kind}`, {
          videoId: conf.id,
          playerVars: { rel: 0, playsinline: 1, controls: 1 },
          events: {
            onReady: () => { ready[kind] = true; },
          },
        });
      } catch (err) {
        console.error('YT player create failed:', kind, err);
      }
    });
  }

  function showOnly(kind) {
    ['win', 'lose'].forEach((k) => {
      const p = players[k];
      if (p && p.getIframe) {
        p.getIframe().style.display = k === kind ? 'block' : 'none';
      }
    });
  }

  // フィナーレへ入るタップハンドラの中から「同期的に」呼ぶこと（音声再生の許可条件）
  function autoplay(kind) {
    const p = players[kind];
    if (!p || !ready[kind]) return false;
    try {
      showOnly(kind);
      p.seekTo(0, true);
      p.unMute();
      p.setVolume(85);
      p.playVideo();
    } catch (err) {
      console.error('MV autoplay failed:', err);
      return false;
    }
    AudioMan.stopAll();
    document.getElementById('mvDock').classList.add('is-on');
    document.getElementById('scene-finale').classList.add('has-mv');

    // 自動再生がブロックされた場合の保険（タップで再生ボタン）
    setTimeout(() => {
      let state = -1;
      try { state = p.getPlayerState(); } catch (err) { /* noop */ }
      if (state !== 1 && state !== 3) { // 1=再生中 3=バッファ中
        const ov = document.getElementById('mvOverlay');
        ov.classList.remove('is-hidden');
        ov.onclick = () => {
          try { p.unMute(); p.playVideo(); } catch (err) { /* noop */ }
          ov.classList.add('is-hidden');
        };
      }
    }, 2000);
    return true;
  }

  function stop() {
    Object.values(players).forEach((p) => {
      try { p.pauseVideo(); } catch (err) { /* noop */ }
    });
  }

  return { loadApi, autoplay, stop };
})();
