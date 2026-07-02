/* ============================================================
   effects.js — フラッシュ / 紙吹雪 / 花火 / 星空
   ============================================================ */

const Effects = (() => {
  const flashEl = () => document.getElementById('flash');
  const blackoutEl = () => document.getElementById('blackout');

  let fireworksInstance = null;
  let confettiLoopTimer = null;

  const GOLD_COLORS = ['#f9e9a8', '#f0d47c', '#cfa14a', '#fff3c4', '#e8c25e'];
  const RAINBOW_COLORS = ['#ff6b6b', '#ffb84d', '#ffe66d', '#7bd88f', '#5ec8e5', '#9b8cff', '#ff8ac4'];

  /* ---- フラッシュ / 暗転 ---- */
  function flash(peak = 0.9, fadeSec = 0.7) {
    const el = flashEl();
    gsap.killTweensOf(el);
    gsap.fromTo(el, { opacity: peak }, { opacity: 0, duration: fadeSec, ease: 'power2.out' });
  }

  function blackout(show, sec = 0.4) {
    gsap.to(blackoutEl(), { opacity: show ? 1 : 0, duration: sec, ease: 'power1.inOut' });
  }

  /* ---- 紙吹雪 ---- */
  function confettiSides(particleCount = 90, colors = GOLD_COLORS) {
    if (typeof confetti !== 'function') return;
    const base = { particleCount, spread: 70, ticks: 260, colors, disableForReducedMotion: true };
    confetti({ ...base, angle: 60, origin: { x: 0, y: 0.65 } });
    confetti({ ...base, angle: 120, origin: { x: 1, y: 0.65 } });
  }

  function confettiCenter(particleCount = 160, colors = GOLD_COLORS) {
    if (typeof confetti !== 'function') return;
    confetti({
      particleCount,
      spread: 130,
      startVelocity: 42,
      ticks: 300,
      colors,
      origin: { x: 0.5, y: 0.55 },
      disableForReducedMotion: true,
    });
  }

  function goldShimmer() {
    if (typeof confetti !== 'function') return;
    confetti({
      particleCount: 46,
      spread: 100,
      startVelocity: 18,
      gravity: 0.45,
      scalar: 0.7,
      ticks: 220,
      shapes: ['circle'],
      colors: GOLD_COLORS,
      origin: { x: 0.5, y: 0.5 },
      disableForReducedMotion: true,
    });
  }

  function confettiLoopStart(intervalMs = 2400, colors = GOLD_COLORS) {
    confettiLoopStop();
    confettiLoopTimer = setInterval(() => confettiSides(55, colors), intervalMs);
  }

  function confettiLoopStop() {
    if (confettiLoopTimer) {
      clearInterval(confettiLoopTimer);
      confettiLoopTimer = null;
    }
  }

  /* ---- 花火 ---- */
  function resolveFireworksCtor() {
    const g = window.Fireworks;
    if (!g) return null;
    if (typeof g === 'function') return g;
    if (typeof g.Fireworks === 'function') return g.Fireworks;
    if (typeof g.default === 'function') return g.default;
    return null;
  }

  function fireworksStart(intensity = 1) {
    try {
      const Ctor = resolveFireworksCtor();
      if (!Ctor) return;
      const box = document.getElementById('fireworksBox');
      if (!fireworksInstance) {
        fireworksInstance = new Ctor(box, {
          autoresize: true,
          acceleration: 1.02,
          particles: Math.round(46 * intensity),
          intensity: 18 * intensity,
          traceSpeed: 9,
          explosion: 5,
          hue: { min: 28, max: 55 },
          delay: { min: 25, max: 55 },
          brightness: { min: 55, max: 85 },
          sound: { enabled: false },
        });
      }
      fireworksInstance.start();
    } catch (err) {
      console.error('fireworks failed:', err);
    }
  }

  function fireworksStop() {
    try {
      if (fireworksInstance) {
        fireworksInstance.stop(true);
        fireworksInstance = null;
      }
    } catch (err) {
      console.error('fireworks stop failed:', err);
    }
  }

  /* ---- 夜空（落選・両落選フィナーレ） ---- */
  function buildStars(container, count = 60) {
    container.querySelectorAll('.star, .shooting-star').forEach((el) => el.remove());
    for (let i = 0; i < count; i += 1) {
      const star = document.createElement('span');
      star.className = 'star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 3.2}s`;
      star.style.opacity = String(0.2 + Math.random() * 0.6);
      container.appendChild(star);
    }
  }

  function shootingStar(container) {
    const s = document.createElement('span');
    s.className = 'shooting-star';
    s.style.left = `${10 + Math.random() * 50}%`;
    s.style.top = `${5 + Math.random() * 30}%`;
    container.appendChild(s);
    gsap.fromTo(
      s,
      { x: 0, y: 0, opacity: 0 },
      {
        x: 190, y: 110, opacity: 1, duration: 0.9, ease: 'power1.in',
        onComplete: () => gsap.to(s, { opacity: 0, duration: 0.3, onComplete: () => s.remove() }),
      }
    );
  }

  return {
    flash,
    blackout,
    confettiSides,
    confettiCenter,
    goldShimmer,
    confettiLoopStart,
    confettiLoopStop,
    fireworksStart,
    fireworksStop,
    buildStars,
    shootingStar,
    GOLD_COLORS,
    RAINBOW_COLORS,
  };
})();
