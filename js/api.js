/* ============================================================
   api.js — 結果の取得
   優先順: テストモード（tk必須） > GAS API > pending
   レスポンス形式: { me: {result, eventName}, her: {result, eventName} }
   result: 'win' | 'lose' | 'unknown' | 'pending'
   ============================================================ */

const Api = (() => {
  const MOCK_DELAY_MS = 1500;

  function parseParams() {
    const p = new URLSearchParams(window.location.search);
    return { test: p.get('test'), tk: p.get('tk') };
  }

  function mockFromPattern(pattern) {
    const map = { w: 'win', l: 'lose' };
    const me = map[pattern[0]];
    const her = map[pattern[1]];
    if (!me || !her) return null;
    const eventName = CONFIG.EVENT.name.replace('\n', ' ');
    return {
      status: 'ok',
      me: { result: me, eventName, source: 'mock' },
      her: { result: her, eventName, source: 'mock' },
    };
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function fetchGas() {
    const url = `${CONFIG.API_URL}?key=${encodeURIComponent(CONFIG.API_KEY)}`;
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    if (!res.ok) throw new Error(`GAS HTTP ${res.status}`);
    const data = await res.json();
    if (!data || data.status !== 'ok' || !data.me || !data.her) {
      throw new Error('GAS response malformed');
    }
    return data;
  }

  function fetchJsonp() {
    return new Promise((resolve, reject) => {
      const cbName = `gasCb_${Date.now()}`;
      const script = document.createElement('script');
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('JSONP timeout'));
      }, 12000);
      function cleanup() {
        clearTimeout(timer);
        delete window[cbName];
        script.remove();
      }
      window[cbName] = (data) => {
        cleanup();
        resolve(data);
      };
      script.onerror = () => {
        cleanup();
        reject(new Error('JSONP load error'));
      };
      script.src = `${CONFIG.API_URL}?key=${encodeURIComponent(CONFIG.API_KEY)}&callback=${cbName}`;
      document.body.appendChild(script);
    });
  }

  async function resolveResults() {
    const { test, tk } = parseParams();

    // テストモード（tk が一致するときだけ有効 = ネタバレ防壁）
    if (test && tk === CONFIG.TEST_KEY) {
      const mock = mockFromPattern(test);
      if (mock) {
        await wait(MOCK_DELAY_MS);
        return mock;
      }
    }

    // API未設定（Phase 1 開発中）は pending 扱い
    if (!CONFIG.API_URL) {
      await wait(600);
      return {
        status: 'ok',
        me: { result: 'pending' },
        her: { result: 'pending' },
      };
    }

    let lastErr = null;
    for (let attempt = 0; attempt < CONFIG.FETCH_RETRY; attempt += 1) {
      try {
        return await fetchGas();
      } catch (err) {
        lastErr = err;
        console.error(`GAS fetch attempt ${attempt + 1} failed:`, err);
        await wait(CONFIG.FETCH_RETRY_WAIT_MS);
      }
    }
    // fetchが全滅したらJSONPで最後の試行
    try {
      return await fetchJsonp();
    } catch (err) {
      console.error('JSONP fallback failed:', err);
      throw lastErr || err;
    }
  }

  return { resolveResults };
})();
