使い方
1. このZIPを解凍
2. index.html があるフォルダに mobile-audio-ui-fix.js と mobile-ui-fix.css を入れる
3. index.html の </head> の直前にこれを追加
   <link rel="stylesheet" href="mobile-ui-fix.css">
4. index.html の </body> の直前にこれを追加
   <script src="mobile-audio-ui-fix.js"></script>

Windowsなら patch-index.ps1 を index.html と同じ場所に対して実行してもOK。
例:
powershell -ExecutionPolicy Bypass -File .\patch-index.ps1 -IndexPath .\index.html

修正内容
- iPhone Safari向けに音声ロック解除処理を追加
- HTML audio が失敗した場合、WebAudioの通知音へフォールバック
- 音量スライダーを通知音にも反映
- スマホ時のメニュー、デバッグ、倉庫、ログの横見切れ対策
- 縦書きっぽく潰れるボタンを横書きに固定
