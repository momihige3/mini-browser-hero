/* mini-browser-hero mobile audio + UI fix */
(() => {
  'use strict';

  const STORE_KEY = 'mbh_audio_unlocked_v1';
  const VOLUME_KEY = 'mbh_volume_v1';
  let audioCtx = null;
  let unlocked = false;

  function getVolume() {
    const range = document.querySelector('input[type="range"]');
    const saved = Number(localStorage.getItem(VOLUME_KEY));
    if (range && Number.isFinite(Number(range.value))) {
      const max = Number(range.max || 100);
      return Math.max(0, Math.min(1, Number(range.value) / max));
    }
    if (Number.isFinite(saved)) return Math.max(0, Math.min(1, saved));
    return 1;
  }

  function ensureAudioContext() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    return audioCtx;
  }

  async function resumeAudioContext() {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    if (ctx.state !== 'running') {
      try { await ctx.resume(); } catch (_) {}
    }
  }

  async function primeHtmlAudio() {
    const audios = Array.from(document.querySelectorAll('audio'));
    await Promise.all(audios.map(async (a) => {
      try {
        a.muted = false;
        a.volume = getVolume();
        const p = a.play();
        if (p && typeof p.then === 'function') await p;
        a.pause();
        a.currentTime = 0;
      } catch (_) {}
    }));
  }

  function beep(freq = 880, duration = 0.11, gainValue = 0.20) {
    const ctx = ensureAudioContext();
    if (!ctx || ctx.state !== 'running') return false;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainValue * getVolume()), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
    return true;
  }

  function playNotifyFallback() {
    beep(1046.5, 0.10, 0.20);
    setTimeout(() => beep(1318.5, 0.12, 0.18), 115);
  }

  async function unlockAudio(showTestSound = true) {
    await resumeAudioContext();
    await primeHtmlAudio();
    unlocked = true;
    localStorage.setItem(STORE_KEY, '1');
    hideUnlockButton();
    if (showTestSound) playNotifyFallback();
  }

  function createUnlockButton() {
    let btn = document.getElementById('audioUnlockBtn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'audioUnlockBtn';
      btn.type = 'button';
      btn.textContent = 'クリックで音声ON';
      btn.className = 'audio-unlock-floating';
      document.body.appendChild(btn);
    }
    btn.addEventListener('click', () => unlockAudio(true), { passive: true });
    btn.addEventListener('touchend', () => unlockAudio(true), { passive: true });
    return btn;
  }

  function hideUnlockButton() {
    const btn = document.getElementById('audioUnlockBtn');
    if (btn) btn.style.display = 'none';
  }

  function showUnlockButtonIfNeeded() {
    if (localStorage.getItem(STORE_KEY) === '1') {
      createUnlockButton().style.display = 'none';
      // 次のユーザー操作で再開。Safari対策。
      const once = () => unlockAudio(false);
      document.addEventListener('touchend', once, { once: true, passive: true });
      document.addEventListener('click', once, { once: true, passive: true });
      return;
    }
    createUnlockButton().style.display = 'inline-flex';
  }

  // 既存の playSound / playRunReadySound があれば包む。HTML audioが失敗したらWebAudioで鳴らす。
  function wrapSoundFunction(name, fallback) {
    const old = window[name];
    window[name] = function patchedSoundFunction(...args) {
      let ok = false;
      try {
        const result = typeof old === 'function' ? old.apply(this, args) : undefined;
        ok = true;
        if (result && typeof result.catch === 'function') result.catch(() => fallback());
        return result;
      } catch (_) {
        fallback();
      } finally {
        if (!ok) fallback();
      }
    };
  }

  function saveVolumeFromRange() {
    const range = document.querySelector('input[type="range"]');
    if (!range) return;
    const max = Number(range.max || 100);
    localStorage.setItem(VOLUME_KEY, String(Math.max(0, Math.min(1, Number(range.value) / max))));
    document.querySelectorAll('audio').forEach(a => { a.volume = getVolume(); });
  }

  function init() {
    showUnlockButtonIfNeeded();
    wrapSoundFunction('playSound', playNotifyFallback);
    wrapSoundFunction('playRunReadySound', () => beep(784, 0.12, 0.18));
    document.querySelectorAll('input[type="range"]').forEach(r => {
      r.addEventListener('input', saveVolumeFromRange, { passive: true });
      r.addEventListener('change', saveVolumeFromRange, { passive: true });
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && unlocked) resumeAudioContext();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.mbhUnlockAudio = unlockAudio;
  window.mbhTestSound = playNotifyFallback;
})();
