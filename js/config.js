/* ============================================================
   config.js — 設定（デプロイ前にここだけ編集すればよい）
   ============================================================ */

const CONFIG = Object.freeze({
  // GAS WebアプリのURL（Phase 3 で設定。空ならモック/pending動作）
  API_URL: '',
  // GASに渡す合言葉（GAS側 SECRET_KEY と一致させる）
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
