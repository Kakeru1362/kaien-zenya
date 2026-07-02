/* ============================================================
   config.js — 設定（デプロイ前にここだけ編集すればよい）
   ============================================================ */

const CONFIG = Object.freeze({
  // GAS WebアプリのURL（空ならモック/pending動作）
  API_URL: 'https://script.google.com/macros/s/AKfycbwKo7PvHLuixtYIcJ1kN7DS1Mtp1-Yf89owvZi_M7YaNuYl-U0BEy8eIGoEu_9QR4_5aw/exec',
  // GASに渡す合言葉はURLの ?k= で渡す（公開リポジトリに秘密を置かない）
  API_KEY: '',

  // テストモードの合言葉（?test=ww&tk=この値 で演出プレビュー）
  TEST_KEY: 'kaien2026',

  // 封筒の宛名（本人たちの名前に変更する）
  NAMES: Object.freeze({
    me: 'わたし',
    her: 'きみ',
  }),

  // 公演情報
  EVENT: Object.freeze({
    name: 'マカロックツアー vol.22\n〜いま、きみがすき！篇〜',
    dateLabel: '2026.7.9',
  }),

  // APIリトライ
  FETCH_RETRY: 3,
  FETCH_RETRY_WAIT_MS: 1500,
});
