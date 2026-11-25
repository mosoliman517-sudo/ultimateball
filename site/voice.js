/* ---------------- sidekick voices: recorded Kokoro clips, one voice per sidekick (pipelines/make_voices.py) ----------------
   A clip's file name is a hash of "sidekick|line", so there is no index to download or go stale. A line without a clip stays silent. */
const Voice = {
  ctx: null, src: null, seq: 0, pending: null, cache: new Map(),
  file(who, text) { let h = 0x811c9dc5; for (const b of new TextEncoder().encode(who + "|" + text)) h = Math.imul(h ^ b, 0x01000193) >>> 0; return "voice/" + h.toString(16).padStart(8, "0") + ".mp3"; },
  // browsers only let sound start after a tap or key press: open the audio context on the first one, then say anything waiting
  ready() {
    try {
      const C = this.ctx || (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
      const go = () => { const p = this.pending; this.pending = null; if (p && Date.now() - p[2] < 8000) this.say(p[0], p[1]); };
      if (C.state !== "running") C.resume().then(go).catch(() => {}); else go();
    } catch (e) { /* no audio */ }
  },
  stop() { this.seq++; if (this.src) { try { this.src.stop(); } catch (e) { /* already done */ } this.src = null; } },
  async say(who, text) {
    if (typeof Snd !== "undefined" && Snd.level === 0) return false;
    if (!this.ctx || this.ctx.state !== "running") { this.pending = [who, text, Date.now()]; return false; }
    this.stop(); const mine = this.seq, url = this.file(who, text);
    try {
      let buf = this.cache.get(url);
      if (!buf) { const r = await fetch(url); if (!r.ok) return false; buf = await this.ctx.decodeAudioData(await r.arrayBuffer()); this.cache.set(url, buf); if (this.cache.size > 60) this.cache.delete(this.cache.keys().next().value); }
      if (mine !== this.seq) return false;   // a newer line took over while this one was loading
      const s = this.ctx.createBufferSource(), g = this.ctx.createGain(); s.buffer = buf; g.gain.value = (typeof Snd !== "undefined" && Snd.level === 2 ? 1 : 0.75) * (window.MIXVOX == null ? 1 : window.MIXVOX);
      s.connect(g); g.connect(this.ctx.destination); s.start(); this.src = s; return true;
    } catch (e) { return false; }
  },
};
["pointerdown", "keydown", "touchend"].forEach((ev) => document.addEventListener(ev, () => Voice.ready(), { passive: true }));
