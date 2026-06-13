# ミニブラウザヒーロー v42 reset-url-fix

- ユーザーデータリセット時に `?reset=...` へURLが変わらないよう修正
- リセット後はページ遷移なしで、その場で装備/倉庫/レベル/EXP/デバッグ状態を初期化
- Cloudflare Web Analytics 維持
