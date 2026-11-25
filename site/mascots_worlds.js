/* New sidekicks for the new worlds, drawn in the same style as ballknowledge's Old Boot, Ref Rita and Bench (same face, shadow and moods).
   Original characters. Lines are written in each character's voice. */
Object.assign(MASCOTS, {
  bongi: { name: "Bongi", voice: "af_heart", blurb: "A lightstick who thinks every song is a comeback. Has never missed a fan chant.", sport: "kpop" },
  pin: { name: "Pin", voice: "am_adam", blurb: "A map pin who has never once been where it is now. Very calm about it.", sport: "geography" },
  tock: { name: "Tock", voice: "bm_lewis", blurb: "An old hourglass who was there for most of history and remembers about half of it.", sport: "history" },
  dumpling: { name: "Dumpling", voice: "bf_lily", blurb: "A dumpling and a very strict judge. Pleats must be perfect. Answers too.", sport: "food" },
});
Object.assign(MASCOT_SVG, {
  bongi: (md) => `<svg viewBox="0 0 120 120" class="msvg"><ellipse cx="60" cy="114" rx="26" ry="5" fill="#000" opacity=".2"/><defs><radialGradient id="bgl" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#ffb3d9"/><stop offset="1" stop-color="#ff3e9a"/></radialGradient></defs><circle cx="60" cy="44" r="40" fill="#ff3e9a" opacity=".18"><animate attributeName="r" values="36;42;36" dur="1.6s" repeatCount="indefinite"/></circle><rect x="50" y="72" width="20" height="40" rx="8" fill="#2b2233" stroke="#120d18" stroke-width="3"/><rect x="54" y="84" width="12" height="5" rx="2" fill="#ff3e9a"/><rect x="46" y="68" width="28" height="10" rx="4" fill="#d9d4e3" stroke="#120d18" stroke-width="3"/><circle cx="60" cy="42" r="30" fill="url(#bgl)" stroke="#a3125b" stroke-width="3"/><path d="M60 8l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1z" fill="#ffe066" stroke="#a3125b" stroke-width="2"/>${mascotFace(md, 60, 40, 0.95)}</svg>`,
  pin: (md) => `<svg viewBox="0 0 120 120" class="msvg"><ellipse cx="60" cy="114" rx="20" ry="5" fill="#000" opacity=".25"/><path d="M60 110C40 82 22 66 22 44a38 38 0 0 1 76 0c0 22-18 38-38 66z" fill="#22c3d6" stroke="#0b5560" stroke-width="3" stroke-linejoin="round"/><circle cx="60" cy="44" r="26" fill="#e9fbff" stroke="#0b5560" stroke-width="3"/><path d="M36 30q24-14 48 0" stroke="#0b5560" stroke-width="2" fill="none" opacity=".35"/><path d="M34 46h52M60 18v52" stroke="#0b5560" stroke-width="1.5" opacity=".25"/>${mascotFace(md, 60, 42, 0.85)}</svg>`,
  tock: (md) => `<svg viewBox="0 0 120 120" class="msvg"><ellipse cx="60" cy="114" rx="34" ry="5" fill="#000" opacity=".2"/><rect x="22" y="6" width="76" height="10" rx="4" fill="#8a5a1c" stroke="#3b230c" stroke-width="3"/><rect x="22" y="100" width="76" height="10" rx="4" fill="#8a5a1c" stroke="#3b230c" stroke-width="3"/><path d="M28 16h4v84h-4zM88 16h4v84h-4z" fill="#b07a2a" stroke="#3b230c" stroke-width="2"/><path d="M36 16h48c0 26-18 30-18 42s18 16 18 42H36c0-26 18-30 18-42S36 42 36 16z" fill="#fff6e0" fill-opacity=".85" stroke="#3b230c" stroke-width="3"/><path d="M42 26h36c-4 12-14 16-18 22-4-6-14-10-18-22z" fill="#f2c14e"/><path d="M46 96h28c-3-10-9-14-14-16-5 2-11 6-14 16z" fill="#f2c14e"/><path d="M60 58v24" stroke="#f2c14e" stroke-width="2" stroke-dasharray="2 3"><animate attributeName="stroke-dashoffset" from="0" to="-10" dur=".8s" repeatCount="indefinite"/></path>${mascotFace(md, 60, 30, 0.7)}</svg>`,
  dumpling: (md) => `<svg viewBox="0 0 120 120" class="msvg"><ellipse cx="60" cy="112" rx="46" ry="6" fill="#000" opacity=".2"/><path d="M12 92c0-34 22-58 48-58s48 24 48 58c0 10-8 14-18 14H30c-10 0-18-4-18-14z" fill="#fbf1e1" stroke="#8a6a3f" stroke-width="3"/><path d="M34 44q4 8 0 14M48 36q4 9 0 16M62 34q3 9-1 16M76 38q2 8-2 15M88 46q0 7-4 12" stroke="#8a6a3f" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M40 26q4-8 0-14M60 22q4-8 0-14M80 26q4-8 0-14" stroke="#c9bfae" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"><animate attributeName="opacity" values=".2;.8;.2" dur="2.2s" repeatCount="indefinite"/></path>${mascotFace(md, 60, 74, 1)}</svg>`,
});
Object.assign(MASCOT_LINES, {
  bongi: {
    welcome: ["Annyeong! Lightsticks up. Let's see who really knows their generations.", "You're back! I charged my batteries just for this.", "Fan chant ready? Good. Let's play."],
    hit: ["Yes! That's a daesang-level answer.", "Correct! The whole fandom is screaming.", "Perfect pitch. Well, perfect answer.", "You know your groups. I respect that."],
    bighit: ["That fast? Stan behaviour. I love it.", "Instant! Did you see the debut stage live?"],
    miss: ["Oof. That one's still on hiatus in your head.", "Not quite. Even idols miss a note.", "Wrong group, right energy."],
    streak: ["Three in a row! That's a triple crown.", "You're on a comeback streak!", "Streak! Somebody give this player a lightstick."],
    best: ["New personal best! Encore, encore!", "Record broken. Chart number one."],
    over: ["Run's over. Rest your voice, then go again.", "Good show. Same time next comeback?"],
    achieve: ["Achievement! I'm glowing. Literally."], idle: ["Tap me and I'll do a fan chant. Quietly."],
  },
  pin: {
    welcome: ["Hello. I'm Pin. I have no idea where we are, which is the fun part.", "Back again? Let's find somewhere new.", "Maps out. Let's go."],
    hit: ["Right on the spot.", "Correct. I'd drop myself there.", "Nailed the coordinates.", "That's the place."],
    bighit: ["Straight there. No detours.", "Instant! You've been there, haven't you?"],
    miss: ["Wrong continent, maybe. It happens.", "Off the map on that one.", "Close-ish. Geography is big."],
    streak: ["Three in a row. You're circling the globe.", "Streak! Passport getting full."],
    best: ["New best. Put a pin in that.", "Record! Somebody update the atlas."],
    over: ["Journey's over. Good trip, though.", "Rest, then we explore again."],
    achieve: ["Achievement! Marking it on the map."], idle: ["I'm a pin. I point at things. It's honest work."],
  },
  tock: {
    welcome: ["Ah. I'm Tock. I was there. I think. Let's check.", "Back again? Time flies. I would know.", "Turn me over, let's begin."],
    hit: ["Correct. I remember that one, actually.", "Right. History approves.", "Spot on. Write it in the chronicles.", "Yes. That's exactly how it went."],
    bighit: ["Before the sand even moved! Impressive.", "Instant. Were you there too?"],
    miss: ["No, no. Wrong century, I'm afraid.", "Not quite. Even I mix up my dynasties.", "Hmm. History will forgive you."],
    streak: ["Three in a row. A golden age!", "Streak! An empire of right answers."],
    best: ["New best! That's one for the history books.", "A record. Carve it in stone."],
    over: ["That era has ended. A new one begins.", "Time's up. Turn me over and try again."],
    achieve: ["Achievement! Truly historic."], idle: ["Tick. No, wait. That's a clock. I just pour."],
  },
  dumpling: {
    welcome: ["Wash your hands. I'm Dumpling, and I judge strictly.", "Back for seconds? Good.", "The kitchen is open. Let's cook."],
    hit: ["Correct. Chef's kiss.", "Right! Perfectly seasoned.", "Yes. Ten out of ten pleats.", "Delicious answer."],
    bighit: ["That fast? Michelin star.", "Instant! You've eaten that before."],
    miss: ["Undercooked. Try again.", "No. That's a different dish entirely.", "Too much salt on that guess."],
    streak: ["Three in a row. Full course!", "Streak! The whole table is impressed."],
    best: ["New best. Bring out the dessert.", "Record! Frame the menu."],
    over: ["Kitchen's closed. For now.", "Good service tonight."],
    achieve: ["Achievement! Plated beautifully."], idle: ["Don't poke me. I'm steaming."],
  },
});
/* sidekicks for general knowledge and anime */
Object.assign(MASCOTS, {
  dogear: { name: "Dog-ear", voice: "bm_daniel", blurb: "The folded corner of an encyclopedia page. Marks every good fact.", sport: "general" },
  neko: { name: "Neko", voice: "af_sky", blurb: "A cat in headphones who has watched every opening sequence twice.", sport: "anime" },
});
Object.assign(MASCOT_SVG, {
  dogear: (md) => `<svg viewBox="0 0 120 120" class="msvg"><ellipse cx="60" cy="114" rx="34" ry="5" fill="#000" opacity=".2"/><path d="M22 10h56l20 20v78H22z" fill="#fff8e1" stroke="#6b5a2a" stroke-width="3" stroke-linejoin="round"/><path d="M78 10v20h20z" fill="#e8d9a8" stroke="#6b5a2a" stroke-width="3" stroke-linejoin="round"/><path d="M32 82h56M32 92h40M32 100h48" stroke="#c9b88a" stroke-width="3" stroke-linecap="round"/>${mascotFace(md, 58, 50, 1)}</svg>`,
  neko: (md) => `<svg viewBox="0 0 120 120" class="msvg"><ellipse cx="60" cy="114" rx="34" ry="5" fill="#000" opacity=".2"/><path d="M26 44l6-30 20 18M94 44l-6-30-20 18" fill="#3a3046" stroke="#15111c" stroke-width="3" stroke-linejoin="round"/><circle cx="60" cy="62" r="38" fill="#4a3d5a" stroke="#15111c" stroke-width="3"/><circle cx="60" cy="66" r="26" fill="#fde8f4"/><path d="M20 58a40 40 0 0 1 80 0" fill="none" stroke="#ff4d8d" stroke-width="7"/><rect x="12" y="52" width="14" height="24" rx="6" fill="#ff4d8d" stroke="#15111c" stroke-width="3"/><rect x="94" y="52" width="14" height="24" rx="6" fill="#ff4d8d" stroke="#15111c" stroke-width="3"/>${mascotFace(md, 60, 62, 0.9)}<path d="M38 74l-10 2M38 78l-10 4M82 74l10 2M82 78l10 4" stroke="#15111c" stroke-width="2"/></svg>`,
});
MASCOT_LINES.dogear = { welcome: ["Dog-ear here. I've marked the good bits. Let's begin.", "Back for more facts? Page turned."], hit: ["Correct. Bookmark that.", "Right! Footnote-worthy.", "Exactly. Encyclopaedic."], bighit: ["Instant! You've read ahead."], miss: ["Not quite. Check the index.", "Wrong page."], streak: ["Three in a row. A whole chapter!"], best: ["New best. First edition."], over: ["The end. For now."], achieve: ["Achievement! Pressed and framed."], idle: ["Please don't fold me further."] };
MASCOT_LINES.neko = { welcome: ["Nya. Neko here. Opening theme, start!", "Back for another episode?"], hit: ["Correct! Plot armour activated.", "Right! Power-up!", "Nice. Main character energy."], bighit: ["Instant! You skipped the intro."], miss: ["Filler episode. Try again.", "Wrong arc."], streak: ["Three in a row! Transformation sequence!"], best: ["New best! Season finale."], over: ["To be continued…"], achieve: ["Achievement! Sparkles everywhere."], idle: ["*adjusts headphones*"] };
/* two more K-pop sidekicks */
Object.assign(MASCOTS, {
  mic: { name: "Maknae Mic", voice: "af_bella", blurb: "The youngest microphone in the studio. Hits every high note, forgets every lyric.", sport: "kpop" },
  pocha: { name: "Pocha", voice: "af_nova", blurb: "A rare photocard who knows she is rare. Has been traded eleven times.", sport: "kpop" },
});
Object.assign(MASCOT_SVG, {
  mic: (md) => `<svg viewBox="0 0 120 120" class="msvg"><ellipse cx="60" cy="114" rx="24" ry="5" fill="#000" opacity=".2"/><rect x="52" y="70" width="16" height="40" rx="6" fill="#3a3346" stroke="#15111c" stroke-width="3"/><rect x="48" y="66" width="24" height="10" rx="4" fill="#c9c2d6" stroke="#15111c" stroke-width="3"/><circle cx="60" cy="40" r="30" fill="#b7aecb" stroke="#15111c" stroke-width="3"/><path d="M34 30h52M32 42h56M36 54h48M46 14v52M60 10v60M74 14v52" stroke="#7d7392" stroke-width="2" opacity=".55"/><circle cx="60" cy="40" r="22" fill="#e9e4f2"/>${mascotFace(md, 60, 38, 0.8)}<path d="M90 18l4-6M96 26l7-2M30 18l-4-6" stroke="#ff5fb4" stroke-width="3" stroke-linecap="round"/></svg>`,
  pocha: (md) => `<svg viewBox="0 0 120 120" class="msvg"><ellipse cx="60" cy="114" rx="30" ry="5" fill="#000" opacity=".2"/><g transform="rotate(-6 60 60)"><rect x="26" y="10" width="68" height="96" rx="10" fill="url(#pch)" stroke="#5a2a70" stroke-width="3"/><defs><linearGradient id="pch" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ffd6ec"/><stop offset=".5" stop-color="#d7c7ff"/><stop offset="1" stop-color="#bff0ff"/></linearGradient></defs><rect x="32" y="16" width="56" height="64" rx="6" fill="#fff" opacity=".55"/>${mascotFace(md, 60, 46, 0.95)}<path d="M34 90h52M40 98h40" stroke="#5a2a70" stroke-width="3" stroke-linecap="round" opacity=".5"/><path d="M80 16l2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z" fill="#ffe066"/></g></svg>`,
});
MASCOT_LINES.mic = { welcome: ["Testing, testing! Maknae Mic here. Let's go.", "Mic check. You ready?"], hit: ["High note! Correct.", "That's the one. Encore!", "Pitch perfect."], bighit: ["Instant! You didn't even need the backing track."], miss: ["Off key. Try again.", "Wrong verse, I think."], streak: ["Three in a row. Key change!"], best: ["New best! Standing ovation."], over: ["Mic drop. Run's over."], achieve: ["Achievement! Spotlight on you."], idle: ["Tap tap. Is this thing on?"] };
MASCOT_LINES.pocha = { welcome: ["Hi! I'm Pocha, a very rare photocard. Be nice.", "Back to collect more? Same."], hit: ["Correct! That one's going in the binder.", "Rare answer. I approve.", "Mint condition."], bighit: ["Instant! Ultra rare move."], miss: ["Oof. That's a common mistake.", "Wrong card."], streak: ["Three in a row! Full set!"], best: ["New best! Framing this."], over: ["Binder closed. For now."], achieve: ["Achievement! It's sparkly."], idle: ["Please don't bend me."] };
/* chess coaches from ballknowledge's chess page, with their own lines mapped to game moments */
Object.entries(COACHES).forEach(([k, c]) => { MASCOTS[k] = { ...c, sport: "chess" }; MASCOT_SVG[k] = (md) => (k === "pip" ? pipSVG(md === "calm" ? "calm" : md) : COACH_SVG[k](md)).replace('class="pip', 'class="msvg pip'); const L = COACH_LINES[k] || {}; MASCOT_LINES[k] = { welcome: [`${c.name} here. ${c.blurb}`], hit: [...(L.best || []), ...(L.great || [])], bighit: L.brilliant || L.best || [], miss: [...(L.mistake || []), ...(L.blunder || [])], streak: L.great_game || L.excellent || [], best: L.great_game || [], over: L.loss || L.rough_game || [], achieve: L.great_game || [], idle: L.good || [] }; });
Object.entries(MASCOTS).forEach(([k, m]) => { m.lines = MASCOT_LINES[k]; });
