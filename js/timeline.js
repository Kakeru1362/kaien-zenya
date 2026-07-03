/* ============================================================
   timeline.js — GSAP タイムライン（じらし / 結果 / フィナーレ）
   演出ルール:
   - 落選する封筒のオーラは「青」止まり（赤以上は当選時のみ）
   - 虹は「両当選が確定する2通目」のみ
   - 逆フェイント（当たりに見せて落とす）は構造的に発生しない
   ============================================================ */

const Timeline = (() => {
  const $ = (id) => document.getElementById(id);

  function setAura(stage) {
    const aura = $('aura');
    aura.className = 'aura';
    if (stage) aura.classList.add(`aura--${stage}`);
  }

  function setCaption(text) {
    const cap = $('envCaption');
    gsap.killTweensOf(cap);
    gsap.fromTo(cap, { opacity: 0 }, { opacity: 1, duration: 0.6 });
    cap.textContent = text;
  }

  /* ================= S1: オープニング ================= */
  function playOpening(names, onDone) {
    $('opDate').textContent = CONFIG.EVENT.dateLabel;
    const envs = [$('opEnv1'), $('opEnv2')];
    envs[0].querySelector('.op-env-name').textContent = `${names[0]} 様`;
    envs[1].querySelector('.op-env-name').textContent = `${names[1]} 様`;

    const tl = gsap.timeline();
    tl.call(() => AudioMan.heartbeat(55), [], 0);
    tl.to('.op-spot', { scale: 1, duration: 2.2, ease: 'power2.out' }, 0.5);
    tl.to('#opDate', { opacity: 1, duration: 1.0 }, 1.5);
    tl.to('.op-line-1', { opacity: 1, duration: 0.9 }, 3.0);
    tl.fromTo('.op-line-2', { opacity: 0, scale: 1.7 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'power4.in' }, 4.5);
    tl.call(() => { AudioMan.play('low_hit'); Effects.flash(0.35, 0.5); }, [], 5.0);
    tl.fromTo(envs, { opacity: 0, y: -60, rotation: -4 },
      { opacity: 1, y: 0, rotation: 0, duration: 1.1, ease: 'power2.out', stagger: 0.25 }, 6.0);
    tl.call(() => AudioMan.play('paper'), [], 6.0);
    tl.to('#opLead', { opacity: 1, duration: 0.8 }, 7.5);
    tl.call(onDone, [], 8.8);
    return tl;
  }

  /* ================= 封筒シーンのリセット ================= */
  function resetEnvelope({ index, name }) {
    $('envCount').textContent = index === 0 ? 'FIRST ENVELOPE' : 'SECOND ENVELOPE';
    $('envOwner').textContent = `${name} の申込分`;
    $('envAddr').textContent = `${name} 様`;
    setAura('white');
    $('envCaption').textContent = '封蝋に、指をかけて。';
    gsap.set('#envelope', { rotation: 0, scale: 1 });
    gsap.set('#envelopeWrap', { scale: 1, y: 0 });
    gsap.set('#envFlap', { rotationX: 0 });
    gsap.set('#waxSeal', { opacity: 1, scale: 1 });
    gsap.set('#ticketInEnv', { yPercent: 0 });
    const btn = $('btnCut');
    btn.classList.remove('is-hidden');
    btn.classList.add('btn-pulse');
    gsap.set(btn, { opacity: 1 });
  }

  /* ================= S2/S5: じらし → 開封 ================= */
  function playTease({ result, index, rainbow, onReveal }) {
    const isWin = result === 'win';
    const isSecond = index === 1;
    const extra = isSecond ? 1.6 : 0; // 2通目は暗転ぶん後ろへずれる
    const tl = gsap.timeline();

    // 0.0s 封筒が震える
    tl.call(() => { AudioMan.heartbeat(75); AudioMan.play('paper'); }, [], 0);
    tl.to('#envelope', {
      rotation: 2, duration: 0.09, repeat: 12, yoyo: true, ease: 'none',
    }, 0);
    tl.set('#envelope', { rotation: 0 }, 1.2);

    // 2.0s 封蝋クローズアップ / 白→青
    tl.to('#envelopeWrap', { scale: 1.06, y: 8, duration: 0.9, ease: 'power2.inOut' }, 2.0);
    tl.call(() => { setAura('blue'); AudioMan.play('rise1'); Effects.flash(0.18, 0.45); }, [], 2.1);

    // 4.0s ドラムロール開始（クレッシェンド）
    tl.call(() => {
      AudioMan.play('drumroll', { volume: 0.12 });
      AudioMan.fade('drumroll', 0.6, 6000);
      setCaption('……。');
    }, [], 4.0);
    tl.to('#envelopeWrap', { scale: 1.03, duration: 2.2, ease: 'power1.inOut' }, 4.0);

    if (isWin) {
      // 6.5s 青→赤（当選時のみ）
      tl.call(() => {
        setAura('red');
        AudioMan.play('rise2');
        Effects.flash(0.4, 0.5);
        AudioMan.heartbeat(95);
      }, [], 6.5);
      // 8.5s 赤→金
      tl.call(() => {
        setAura('gold');
        AudioMan.play('rise3_gold');
        Effects.flash(0.65, 0.6);
        Effects.goldShimmer();
      }, [], 8.5);
      tl.to('#envelopeWrap', { scale: 1.1, duration: 0.5, ease: 'back.out(2)' }, 8.5);
      if (rainbow) {
        // 9.8s 金→虹（両当選が確定する2通目のみ）
        tl.call(() => {
          setAura('rainbow');
          AudioMan.play('rise4_rainbow');
          Effects.flash(0.7, 0.7);
          Effects.confettiCenter(40, Effects.RAINBOW_COLORS);
        }, [], 9.8);
      }
    } else {
      // 落選時は青のまま脈動を続ける（希望は最後まで残す）
      tl.call(() => AudioMan.heartbeat(88), [], 6.5);
      tl.to('#envelopeWrap', { scale: 1.05, duration: 1.6, ease: 'power1.inOut' }, 6.5);
    }

    // 10.5s 台詞
    tl.call(() => setCaption(isSecond ? '最後の1通です——' : '運命の瞬間——'), [], 10.5);

    if (isSecond) {
      // 11.5s 追いじらし: 1.2秒の暗転
      tl.call(() => { Effects.blackout(true, 0.35); AudioMan.stop('drumroll'); }, [], 11.5);
      tl.call(() => { Effects.blackout(false, 0.4); setCaption('最後の結果。'); AudioMan.play('drumroll', { volume: 0.55 }); }, [], 12.7);
    }

    // 12.0s(+extra) 全音停止 → 0.8秒の完全な静寂
    tl.call(() => {
      AudioMan.stopAll();
      gsap.to('#envCaption', { opacity: 0, duration: 0.3 });
    }, [], 12.0 + extra);

    // 12.8s(+extra) 封蝋が割れ、フラップが開く
    tl.call(() => { AudioMan.play('seal_crack'); Effects.flash(0.3, 0.4); }, [], 12.8 + extra);
    tl.to('#waxSeal', { scale: 1.25, opacity: 0, duration: 0.4, ease: 'power3.in' }, 12.8 + extra);
    tl.to('#envFlap', { rotationX: -165, duration: 0.8, ease: 'power2.inOut' }, 12.95 + extra);

    // 13.5s(+extra) チケットがゆっくりせり上がる
    tl.call(() => AudioMan.play('paper'), [], 13.6 + extra);
    tl.to('#ticketInEnv', { yPercent: -95, duration: 2.5, ease: 'power1.inOut' }, 13.5 + extra);
    tl.to('#envelopeWrap', { y: 30, duration: 2.5, ease: 'power1.inOut' }, 13.5 + extra);

    // 16.0s(+extra) 結果バーン
    tl.call(() => onReveal(), [], 16.1 + extra);
    return tl;
  }

  /* ================= S3/S6: 当選 ================= */
  function playWinResult({ name, eventName, isLast, onNext }) {
    const btn = $('btnWinNext');
    btn.textContent = isLast ? 'フィナーレへ' : '次へ';
    btn.classList.add('is-hidden');
    $('winOwner').textContent = `${name} 様`;
    $('winEvent').textContent = eventName || CONFIG.EVENT.name.replace('\n', ' ');
    gsap.killTweensOf('#goldenTicket');
    gsap.set('#goldenTicket', { opacity: 0, scale: 0.4, rotation: -8, rotationY: -35, y: 0 });
    gsap.set('#gtStamp', { opacity: 0, scale: 3, rotation: 12 });
    gsap.set('#gtShock', { opacity: 0, scale: 0.4 });
    $('gtRays').classList.remove('is-on');

    const tl = gsap.timeline();
    // 0.0s バーン！（フラッシュ3連＋紙吹雪3連発）
    tl.call(() => {
      Effects.flash(1, 0.5);
      AudioMan.play('fanfare');
      Effects.confettiSides(170);
    }, [], 0);
    tl.to('#goldenTicket', { opacity: 1, scale: 1, rotation: 0, rotationY: 0, duration: 0.6, ease: 'back.out(1.7)' }, 0.08);
    tl.fromTo('.win-stage', { x: -10 }, { x: 10, duration: 0.05, repeat: 11, yoyo: true, clearProps: 'x' }, 0.08);
    tl.call(() => Effects.flash(0.5, 0.4), [], 0.45);
    tl.call(() => { Effects.confettiCenter(130); Effects.flash(0.3, 0.4); }, [], 0.8);
    tl.call(() => { $('gtRays').classList.add('is-on'); }, [], 0.9);

    // 1.5s スタンプ「ご用意できました」＋衝撃波
    tl.to('#gtStamp', { opacity: 1, scale: 1, duration: 0.3, ease: 'power4.in' }, 1.5);
    tl.call(() => {
      AudioMan.play('stamp');
      gsap.fromTo('#goldenTicket', { y: -8 }, { y: 0, duration: 0.35, ease: 'bounce.out' });
      gsap.fromTo('#gtShock', { opacity: 0.9, scale: 0.4 }, { opacity: 0, scale: 2.6, duration: 0.7, ease: 'power2.out' });
    }, [], 1.8);
    tl.call(() => { Effects.confettiSides(90); Effects.goldShimmer(); Effects.pencilBurst(14); }, [], 2.2);

    // 2.8s チケットがふわふわ浮遊（結果画面の間ずっと）
    tl.call(() => {
      gsap.to('#goldenTicket', { y: -8, duration: 1.9, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    }, [], 2.8);

    // 3.0s 背景で花火
    tl.call(() => { Effects.fireworksStart(0.8); AudioMan.play('firework_pop'); }, [], 3.0);

    // 5.0s ボタン / 6.0s 追い焚き
    tl.call(() => btn.classList.remove('is-hidden'), [], 5.0);
    tl.fromTo(btn, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 5.0);
    tl.call(() => Effects.confettiSides(70), [], 6.0);

    btn.onclick = () => {
      gsap.killTweensOf('#goldenTicket');
      $('gtRays').classList.remove('is-on');
      Effects.fireworksStop();
      onNext();
    };
    return tl;
  }

  /* ================= S3/S6: 落選 ================= */
  function playLoseResult({ name, isFirst, onNext }) {
    const btn = $('btnLoseNext');
    btn.textContent = isFirst ? '2通目へ' : 'フィナーレへ';
    btn.classList.add('is-hidden');
    $('loseOwner').textContent = `${name} 様`;
    $('loseLine2').classList.add('is-hidden');
    gsap.set('.lose-ticket', { opacity: 0, y: 26 });
    gsap.set('#loseLine', { opacity: 0 });
    gsap.set('#loseLine2', { opacity: 0 });
    Effects.buildStars($('nightSky'), 70);

    const tl = gsap.timeline();
    tl.call(() => AudioMan.play('chime_soft'), [], 0.1);
    tl.to('.lose-ticket', { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out' }, 0.2);
    tl.to('#loseLine', { opacity: 1, duration: 0.9 }, 1.6);

    if (isFirst) {
      tl.call(() => {
        $('loseLine2').classList.remove('is-hidden');
        AudioMan.heartbeat(58);
      }, [], 3.5);
      tl.to('#loseLine2', { opacity: 1, duration: 0.9 }, 3.6);
    }

    tl.call(() => btn.classList.remove('is-hidden'), [], 5.0);
    tl.fromTo(btn, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 5.0);

    btn.onclick = () => onNext();
    return tl;
  }

  /* ================= S4: 幕間 ================= */
  function playInterlude({ text, name, onDone }) {
    $('interludeLine').textContent = text;
    $('interludeEnvName').textContent = `${name} 様`;
    gsap.set('#interludeLine', { opacity: 0 });
    gsap.set('#interludeEnv', { opacity: 0, y: -40 });

    const tl = gsap.timeline();
    tl.call(() => AudioMan.heartbeat(70), [], 0);
    tl.to('#interludeLine', { opacity: 1, duration: 0.9 }, 0.3);
    tl.to('#interludeEnv', { opacity: 1, y: 0, duration: 1.0, ease: 'power2.out' }, 1.6);
    tl.call(onDone, [], 4.6);
    return tl;
  }

  /* ---- フィナーレの写真（photos/finale.jpg があれば表示） ---- */
  function setupPhoto() {
    const probe = new Image();
    probe.onload = () => {
      $('finPhotoImg').src = probe.src;
      $('finPhoto').classList.remove('is-hidden');
      gsap.to('#finPhoto', { opacity: 1, duration: 1.0, delay: 0.6 });
    };
    probe.src = 'photos/finale.jpg';
  }

  /* ================= S7: フィナーレ ================= */
  function playFinale(pattern, { names, eventName }, autoMv = false) {
    const scene = $('scene-finale');
    const ev = (eventName || CONFIG.EVENT.name).replace('\n', ' ');
    const set = (id, text) => { $(id).textContent = text; };
    const btn = $('btnFinale');
    btn.classList.add('is-hidden');
    $('finPhoto').classList.add('is-hidden');
    ['finEn', 'finTitle', 'finLine1', 'finLine2', 'finEvent', 'finNote', 'finPhoto'].forEach((id) => gsap.set(`#${id}`, { opacity: 0 }));
    gsap.set(btn, { opacity: 0 });
    setupPhoto();

    const tl = gsap.timeline();

    if (pattern === 'ww') {
      scene.classList.add('finale--gold');
      $('finaleSky').classList.add('is-hidden');
      set('finEn', 'CURTAIN UP — SEE YOU AT THE VENUE');
      set('finTitle', '2人とも、\nご用意できました。');
      set('finLine1', 'LIVE、決定。——「いま、きみがすき！」を、生で。');
      set('finLine2', '2口とも当選（計4席）。\nどちらの2席で行くか、嬉しい相談をしよう。');
      set('finEvent', ev);
      set('finNote', '※ 当選メールの入金期限（発表から数日）を今日中に確認！');
      btn.textContent = '演出を止める';

      tl.call(() => {
        if (!autoMv) AudioMan.play('fanfare');
        Effects.flash(1, 0.8);
        Effects.fireworksStart(1.3);
        Effects.confettiCenter(200, Effects.RAINBOW_COLORS);
        Effects.pencilBurst(12);
        Effects.confettiLoopStart(2600, Effects.GOLD_COLORS);
      }, [], 0);
      tl.to('#finEn', { opacity: 1, duration: 0.8 }, 0.6);
      tl.fromTo('#finTitle', { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }, 1.0);
      tl.to('#finLine1', { opacity: 1, duration: 0.8 }, 2.2);
      tl.to('#finLine2', { opacity: 1, duration: 0.8 }, 3.2);
      tl.to('#finEvent', { opacity: 1, duration: 0.8 }, 4.0);
      tl.to(btn, { opacity: 1, duration: 0.6, onStart: () => btn.classList.remove('is-hidden') }, 5.2);
      tl.to('#finNote', { opacity: 1, duration: 0.8 }, 5.6);

      let stopped = false;
      btn.onclick = () => {
        if (!stopped) {
          stopped = true;
          Effects.confettiLoopStop();
          Effects.fireworksStop();
          btn.textContent = '演出を動かす';
        } else {
          stopped = false;
          Effects.fireworksStart(1.3);
          Effects.confettiLoopStart(2600, Effects.GOLD_COLORS);
          btn.textContent = '演出を止める';
        }
      };
    } else if (pattern === 'wl' || pattern === 'lw') {
      const winnerName = pattern === 'wl' ? names.me : names.her;
      scene.classList.add('finale--gold');
      $('finaleSky').classList.add('is-hidden');
      set('finEn', 'TWO SEATS SECURED');
      set('finTitle', '2席、確保。\n2人で、行ける。');
      set('finLine1', `${winnerName} の申込分が、当選。`);
      set('finLine2', '1口2席。ふたり並んで、同じ景色を見られる。');
      set('finEvent', ev);
      set('finNote', '※ 当選メールの入金期限（発表から数日）を今日中に確認！');
      btn.textContent = 'もう一度 祝う';

      tl.call(() => {
        if (!autoMv) AudioMan.play('fanfare');
        Effects.flash(0.8, 0.7);
        Effects.fireworksStart(0.6);
        Effects.confettiSides(110);
      }, [], 0);
      tl.to('#finEn', { opacity: 1, duration: 0.8 }, 0.6);
      tl.fromTo('#finTitle', { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }, 1.0);
      tl.to('#finLine1', { opacity: 1, duration: 0.8 }, 2.4);
      tl.to('#finLine2', { opacity: 1, duration: 0.8 }, 3.6);
      tl.to('#finEvent', { opacity: 1, duration: 0.8 }, 4.4);
      tl.to(btn, { opacity: 1, duration: 0.6, onStart: () => btn.classList.remove('is-hidden') }, 5.4);
      tl.to('#finNote', { opacity: 1, duration: 0.8 }, 5.8);
      btn.onclick = () => { Effects.confettiSides(80); };
    } else {
      // ll: 両落選 — 夜空と流れ星、静かなピアノ
      scene.classList.add('finale--night');
      const sky = $('finaleSky');
      sky.classList.remove('is-hidden');
      Effects.buildStars(sky, 90);
      set('finEn', 'THE NIGHT IS STILL YOUNG');
      set('finTitle', '今回は、2通とも\n届きませんでした。');
      set('finLine1', 'でも、2人で今日まで待ったこの時間は、本物。');
      set('finLine2', '一般発売も、二次先行も、まだある。');
      set('finEvent', ev);
      set('finNote', '');
      btn.textContent = 'リベンジを誓う';

      const starTimer = setInterval(() => Effects.shootingStar(sky), 3400);
      tl.call(() => { if (!autoMv) AudioMan.play('piano_calm'); }, [], 0.4);
      tl.to('#finEn', { opacity: 1, duration: 1.2 }, 0.8);
      tl.to('#finTitle', { opacity: 1, duration: 1.4 }, 2.0);
      tl.to('#finLine1', { opacity: 1, duration: 1.2 }, 5.0);
      tl.to('#finLine2', { opacity: 1, duration: 1.2 }, 8.0);
      tl.to('#finEvent', { opacity: 1, duration: 1.0 }, 9.6);
      tl.to(btn, { opacity: 1, duration: 0.8, onStart: () => btn.classList.remove('is-hidden') }, 11.0);

      btn.onclick = () => {
        Effects.confettiCenter(90, ['#a9c3e8', '#dbe4f5', '#7e90b4', '#cfe0ff']);
        set('finNote', 'ハッピーエンドへの期待は、捨てない。');
        gsap.to('#finNote', { opacity: 1, duration: 0.8 });
        clearInterval(starTimer);
      };
    }
    return tl;
  }

  return {
    playOpening,
    resetEnvelope,
    playTease,
    playWinResult,
    playLoseResult,
    playInterlude,
    playFinale,
  };
})();
