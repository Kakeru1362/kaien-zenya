/* ============================================================
   main.js — ステートマシン / 画面遷移 / 開封順序の決定
   ============================================================ */

(() => {
  const $ = (id) => document.getElementById(id);

  const state = {
    results: null,   // { me: {result,...}, her: {result,...} }
    order: [],       // 開封順に並んだ [{ownerKey, name, result, eventName}, ...]
    index: 0,        // いま開けている封筒 (0 or 1)
  };

  /* ---------- シーン切替 ---------- */
  function showScene(id) {
    document.querySelectorAll('.scene').forEach((s) => s.classList.remove('is-active'));
    $(id).classList.add('is-active');
  }

  /* ---------- 開封順序 ----------
     鉄則「必ず上げて終わる」:
     片方だけ当選なら、落選を1通目・当選を2通目にする。
     それ以外は本人分が1通目。 */
  function orderResults(results) {
    const me = { ownerKey: 'me', name: CONFIG.NAMES.me, ...results.me };
    const her = { ownerKey: 'her', name: CONFIG.NAMES.her, ...results.her };
    if (me.result === 'win' && her.result === 'lose') return [her, me];
    if (me.result === 'lose' && her.result === 'win') return [me, her];
    return [me, her];
  }

  function finalePattern() {
    const w = (r) => (r === 'win' ? 'w' : 'l');
    return w(state.results.me.result) + w(state.results.her.result);
  }

  function bothWin() {
    return state.results.me.result === 'win' && state.results.her.result === 'win';
  }

  /* ---------- フロー ---------- */
  function onStart() {
    AudioMan.unlock();
    MvPlayer.loadApi();
    showScene('scene-waiting');
    $('waitingTitle').textContent = '照明を落としています…';
    $('waitingText').textContent = '';
    $('btnRetry').classList.add('is-hidden');

    Api.resolveResults()
      .then((data) => {
        state.results = data;
        const meR = data.me.result;
        const herR = data.her.result;

        if (meR === 'pending' || herR === 'pending') {
          showWaiting(
            '抽選発表まで、お待ちください。',
            '当落メールはまだ届いていません。\n発表（7/8 水 15:00ごろ）のあとに\nもう一度開くと、開演します。'
          );
          return;
        }
        if (meR === 'unknown' || herR === 'unknown') {
          showWaiting(
            '結果の確認に、少し時間がかかっています。',
            'しばらくしてから、もう一度お試しください。'
          );
          return;
        }
        state.order = orderResults(data);
        state.index = 0;
        runOpening();
      })
      .catch((err) => {
        console.error('resolveResults failed:', err);
        showWaiting(
          '接続できませんでした。',
          '電波の良いところで、もう一度お試しください。'
        );
      });
  }

  function showWaiting(title, text) {
    showScene('scene-waiting');
    $('waitingTitle').textContent = title;
    $('waitingText').innerText = text;
    $('btnRetry').classList.remove('is-hidden');
  }

  function runOpening() {
    showScene('scene-opening');
    Timeline.playOpening(
      [state.order[0].name, state.order[1].name],
      () => runEnvelope()
    );
  }

  function runEnvelope() {
    const entry = state.order[state.index];
    Timeline.resetEnvelope({ index: state.index, name: entry.name });
    showScene('scene-envelope');

    const btn = $('btnCut');
    btn.onclick = () => {
      btn.classList.remove('btn-pulse');
      gsap.to(btn, { opacity: 0, duration: 0.4, onComplete: () => btn.classList.add('is-hidden') });
      Timeline.playTease({
        result: entry.result,
        index: state.index,
        rainbow: state.index === 1 && entry.result === 'win' && bothWin(),
        onReveal: () => runResult(entry),
      });
    };
  }

  function runResult(entry) {
    const isLast = state.index === 1;
    if (entry.result === 'win') {
      showScene('scene-win');
      Timeline.playWinResult({
        name: entry.name,
        eventName: entry.eventName,
        isLast,
        onNext: () => afterResult(),
      });
    } else {
      showScene('scene-lose');
      Timeline.playLoseResult({
        name: entry.name,
        isFirst: !isLast,
        onNext: () => afterResult(),
      });
    }
  }

  function afterResult() {
    AudioMan.stopAll();
    if (state.index === 0) {
      state.index = 1;
      runInterlude();
    } else {
      runFinale();
    }
  }

  function runInterlude() {
    const first = state.order[0];
    const second = state.order[1];
    const text = first.result === 'win'
      ? 'この勢いのまま——2通目。'
      : 'まだ、終わってない。——2通目。';
    showScene('scene-interlude');
    Timeline.playInterlude({
      text,
      name: second.name,
      onDone: () => runEnvelope(),
    });
  }

  function runFinale() {
    const pattern = finalePattern();
    showScene('scene-finale');
    // フィナーレ入りのタップと同じコールスタック内で呼ぶ（音声つき自動再生の許可条件）
    const autoMv = MvPlayer.autoplay(pattern === 'll' ? 'lose' : 'win');
    Timeline.playFinale(pattern, {
      names: CONFIG.NAMES,
      eventName: state.results.me.eventName || state.results.her.eventName,
    }, autoMv);
  }

  /* ---------- 初期化 ---------- */
  function init() {
    $('btnStart').addEventListener('click', onStart);
    $('btnRetry').addEventListener('click', onStart);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
