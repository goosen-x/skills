// Preview player for a normal browser (npm run preview). Never runs during headless render.
// Space play/pause, ←/→ frame, shift+←/→ second, M mute. Audio: window.AUDIO_URL (optional).
if (!navigator.webdriver) {
  const css = document.createElement('style');
  css.textContent = `
    body{background:#0a0a0a;color:#ddd;font:500 0.875rem system-ui,sans-serif}
    #stage{transform-origin:0 0}
    #player{position:fixed;left:0;right:0;bottom:0;display:flex;align-items:center;gap:1rem;padding:0.75rem 1.25rem;background:rgba(20,20,20,.92);border-top:0.0625rem solid #2a2a2a}
    #player button{cursor:pointer;width:2.5rem;height:2.5rem;border-radius:0.5rem;border:0;background:#FEC200;color:#111;font:700 1rem system-ui,sans-serif}
    #player input{flex:1;cursor:pointer;accent-color:#FEC200}
    #player .tc{font-variant-numeric:tabular-nums;min-width:7.5rem;text-align:right}
    #player .hint{opacity:.45;font-size:0.75rem}`;
  document.head.appendChild(css);
  const bar = document.createElement('div');
  bar.id = 'player';
  bar.innerHTML = '<button class="play" title="Пробел">▶</button><button class="snd" title="M">🔊</button><input type="range" min="0" step="0.001"><span class="tc"></span><span class="hint">пробел · ←/→ кадр · shift+←/→ секунда · M звук</span>';
  document.body.appendChild(bar);
  const btn = bar.querySelector('.play'), snd = bar.querySelector('.snd'), range = bar.querySelector('input'), tc = bar.querySelector('.tc'), hint = bar.querySelector('.hint');
  const audio = new Audio();
  // loaded as a blob: python http.server has no range requests, and without them audio cannot seek
  if (window.AUDIO_URL) {
    const type = window.AUDIO_URL.endsWith('.wav') ? 'audio/wav' : window.AUDIO_URL.endsWith('.mp3') ? 'audio/mpeg' : 'audio/mp4';
    fetch(window.AUDIO_URL).then((r) => r.arrayBuffer())
      .then((b) => { audio.src = URL.createObjectURL(new Blob([b], { type })); })
      .catch(() => { hint.textContent = 'звук не загрузился'; });
  }
  let t = 0, playing = false, last = 0;
  const DUR = () => window.DUR;
  const fit = () => { stage.style.transform = `scale(${Math.min(innerWidth / W, (innerHeight - bar.offsetHeight) / H)})`; };
  const show = () => {
    draw(t);
    range.max = DUR();
    range.value = t;
    tc.textContent = `${t.toFixed(2)} / ${DUR().toFixed(2)} s`;
    btn.textContent = playing ? '❚❚' : '▶';
  };
  // browsers only allow sound after a user gesture, so playback starts from the button or space
  const setPlaying = (v) => {
    playing = v; last = performance.now();
    if (v && audio.src) { audio.currentTime = t; audio.play().catch(() => {}); } else audio.pause();
    show();
  };
  audio.oncanplay = () => { if (playing && audio.paused) { audio.currentTime = t; audio.play().catch(() => {}); } };
  const toggleMute = () => { audio.muted = !audio.muted; snd.textContent = audio.muted ? '🔇' : '🔊'; };
  snd.onclick = toggleMute;
  btn.onclick = () => setPlaying(!playing);
  range.oninput = () => { t = Number(range.value); setPlaying(false); };
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); setPlaying(!playing); }
    if (e.code === 'KeyM') toggleMute();
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
      e.preventDefault();
      t = clamp(t + (e.shiftKey ? 1 : 1 / 60) * (e.code === 'ArrowRight' ? 1 : -1), 0, DUR() - 1e-6);
      setPlaying(false);
    }
  });
  addEventListener('resize', fit);
  fit();
  window.ready.then(() => {
    show();
    last = performance.now();
    (function loop(now) {
      if (playing) {
        t += (now - last) / 1000;
        if (t >= DUR()) { t = 0; audio.currentTime = 0; }
        if (!audio.paused && Math.abs(audio.currentTime - t) > .08) audio.currentTime = t;
        show();
      }
      last = now;
      requestAnimationFrame(loop);
    })(last);
  });
}
