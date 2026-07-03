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

  // 封筒の宛名
  NAMES: Object.freeze({
    me: 'かける',
    her: 'わかな',
  }),

  // 公演情報
  EVENT: Object.freeze({
    name: 'マカロックツアー vol.22\n〜いま、きみがすき！篇〜',
    dateLabel: '2026.7.9',
  }),

  // フィナーレで流す公式MV（YouTube公式埋め込み。idが空ならカード非表示）
  // 候補: ヤングアダルト=b5qDEwUMIQg / NOW LOADING=rNeIk27_zs4 / 星が泳ぐ=ZlIdbht29kc
  //       なんでもないよ、=2k21MgVKg4o / 悲しみはバスに乗って=Hv_VH6YBT8Q
  MV: Object.freeze({
    win: Object.freeze({ id: 'b5qDEwUMIQg', title: 'マカロニえんぴつ「ヤングアダルト」MV' }),
    lose: Object.freeze({ id: '2k21MgVKg4o', title: 'マカロニえんぴつ「なんでもないよ、」MV' }),
  }),

  // APIリトライ
  FETCH_RETRY: 3,
  FETCH_RETRY_WAIT_MS: 1500,
});
