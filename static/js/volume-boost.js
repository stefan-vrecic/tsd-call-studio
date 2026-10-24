// volume-boost.js -- the "Volume boost" slider under the speed buttons: plays the main player louder than the normal 100% maximum
// (up to 300%) for quiet recordings. Above 100% the sound goes: leveller (lifts the quieter voice towards the louder one) -> the boost ->
// a fast limiter -> a soft safety clip, so loud moments get squashed instead of crackling. Measured on a real call (Oct 15 2026): at 300%
// speech +9 dB, the quieter voice +10.5 dB, no clipped samples (the old gain + slow limiter gave +4.4 dB on the quiet voice and crackled).
// At 100% the audio bypasses all of it; nothing changes until you move the slider. The setting is remembered.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const vbRange = document.getElementById('volume-boost');
const vbReadout = document.getElementById('volume-readout');
const vbRow = document.getElementById('volume-row');
let vbCtx = null, vbGain = null, vbSrc = null, vbIn = null;   // vbIn = the first node of the boost chain

function vbEnsureGraph() {
  if (vbCtx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  try {
    vbCtx = new AC();
    vbSrc = vbCtx.createMediaElementSource(media);   // from here on the player's sound goes through Web Audio
    const comp = (o) => { const c = vbCtx.createDynamicsCompressor(); for (const k in o) c[k].value = o[k]; return c; };
    const leveller = comp({ threshold: -38, knee: 12, ratio: 3, attack: 0.02, release: 0.35 });
    vbGain = vbCtx.createGain();
    const limiter = comp({ threshold: -4, knee: 0, ratio: 20, attack: 0.0005, release: 0.08 });
    const clip = vbCtx.createWaveShaper();            // soft safety clip: straight up to 92% of full scale, then rounds off instead of cracking
    const n = 4096, curve = new Float32Array(n), k = 0.92;
    for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1, a = Math.abs(x); curve[i] = Math.sign(x) * (a <= k ? a : k + (1 - k) * Math.tanh((a - k) / (1 - k))); }
    clip.curve = curve; clip.oversample = '4x';
    leveller.connect(vbGain); vbGain.connect(limiter); limiter.connect(clip); clip.connect(vbCtx.destination);
    vbIn = leveller;
    vbSrc.connect(vbCtx.destination);                 // starts bypassed (100%); vbSet routes it through the chain
    return true;
  } catch (e) { vbCtx = null; return false; }
}

function vbSet(pct, save = true) {
  pct = Math.min(300, Math.max(100, Math.round(pct / 5) * 5));
  vbRange.value = pct;
  vbReadout.textContent = pct + '%';
  vbRow.classList.toggle('boosted', pct > 100);
  if (save) liveStore('volumeBoost', pct);
  if (pct === 100 && !vbCtx) return;                  // never touched: leave the audio exactly as it was
  if (!vbEnsureGraph()) { vbReadout.textContent = 'not supported'; return; }
  vbGain.gain.value = pct / 100;
  vbSrc.disconnect();
  vbSrc.connect(pct > 100 ? vbIn : vbCtx.destination);   // 100% = straight through, untouched
  if (vbCtx.state === 'suspended') vbCtx.resume();     // browsers start audio contexts paused until you've interacted with the page
}

vbRange.addEventListener('input', () => vbSet(parseFloat(vbRange.value)));
vbReadout.onclick = () => vbSet(100);
media.addEventListener('play', () => { if (vbCtx && vbCtx.state === 'suspended') vbCtx.resume(); });

// restore the saved boost: the slider shows it right away, the audio stage is set up on your first click anywhere (a browser rule)
{
  const saved = parseFloat(liveStore('volumeBoost'));
  if (saved > 100) {
    vbSet(saved, false);   // (builds the graph if the browser allows it now; otherwise on the first click below)
    document.addEventListener('pointerdown', () => { if (vbCtx && vbCtx.state === 'suspended') vbCtx.resume(); else if (!vbCtx) vbSet(saved, false); }, { once: true });
  }
}
