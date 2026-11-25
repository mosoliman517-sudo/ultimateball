/* Third batch: many more everyday lines for every sidekick. Every line must be true whenever its moment fires, in any category:
   no claims about chess moves, goals, clocks or times of day that may not have happened, and no counted streaks.
   Row order: hit, bighit, miss, streak, best, over, welcome, idle. */
const SIDE_KINDS3 = ["hit", "bighit", "miss", "streak", "best", "over", "welcome", "idle"];
const SIDE_LINES3 = {
  bongi: [
    ["Correct! I'm doing a little spin.", "Yes! That brightened my whole evening.", "Right answer! Hearts everywhere.", "You got it! Wave for yourself.", "That's right. Pure dedication.", "Correct! I'd give you a fan sign.", "Yes! Straight to the highlight reel.", "Spot on. My batteries salute you."],
    ["Lightning fast! Are you a mind reader?", "Wow, no hesitation at all!", "That was instant stage presence.", "So quick my light skipped a beat."],
    ["Not this one, sweetie.", "Wrong, but the show goes on.", "Hmm, that's a different act.", "Oh no. Big hug.", "Not quite. Keep your light on.", "Missed it. Even I blink sometimes.", "That answer didn't make the setlist.", "Try again next round. I'm here."],
    ["Look at that run!", "The momentum is unreal.", "You're sparkling right now.", "Don't stop, the crowd is chanting."],
    ["That's your best yet!", "A brand new record! Fireworks!", "Peak performance. I saw it."],
    ["That's the show. Thank you for coming!", "Curtain call. Take a bow.", "All done. You were lovely.", "We'll be back with a new stage."],
    ["Hi! I saved you a spot.", "You made it! Let's glow.", "Ready when you are, superstar."],
    ["I wonder what colour I am today.", "Psst. Pick a game.", "Waiting is just a long intro.", "I'm very patient for a stick."],
  ],
  mic: [
    ["Correct! I'm clapping into myself.", "Yes! Loud and proud.", "That's right, that's right!", "You're good at this!", "Correct! Can I be on your team?", "Bingo! I mean, yes!", "Right! That was smooth.", "Yes! Give yourself a cheer."],
    ["Whoa! Faster than my high note.", "You didn't even breathe!", "Instant! Show off. I love it.", "That was ridiculous. Again!"],
    ["Aww, not that one.", "Oops, wrong note.", "Nope! Smile through it.", "I thought so too. We're both wrong.", "That's okay, next verse.", "Missed. Dramatic sigh.", "Not it. I still like you.", "Wrong, but very brave."],
    ["You keep going!", "I'm losing my voice cheering.", "So hot right now. The streak, I mean.", "Nobody interrupt this."],
    ["New record! I'm so proud!", "You beat yourself! In a nice way.", "Best one ever. Trophy time."],
    ["And scene! Great job.", "That's all, folks!", "Done! Snack break.", "We should do that again."],
    ["Yay, you're here!", "Hello! I missed you. A little. A lot.", "Let's make some noise!"],
    ["Is this the break?", "I'm humming. Don't judge.", "Pick something, pick something.", "My cable is tangled again."],
  ],
  pocha: [
    ["Correct. Beautifully done.", "Yes. That goes in the front page.", "Right. A sharp answer.", "Exactly. I like your taste.", "Correct. Very collectible.", "Yes. Crisp and clean.", "Right. You've done your homework.", "That's it. Lovely."],
    ["Immediate. How rare.", "Barely a glance. Superb.", "A flash pull.", "Quick as opening a new pack."],
    ["Not that one.", "A duplicate of a wrong answer.", "No. Put it back.", "Off by one page.", "That's not in my binder.", "A miss. It happens to the best sets.", "Wrong. The sleeve is disappointed.", "Not quite right."],
    ["A beautiful run.", "You're completing the set.", "Each one rarer than the last.", "Don't crease this streak."],
    ["A new personal best. Frame it.", "Your highest grade yet.", "Record condition."],
    ["Session complete.", "Back into the case.", "A fine collection today.", "That's the last page for now."],
    ["There you are.", "Welcome to the binder.", "Shall we collect something?"],
    ["Gently, please.", "I'm admiring my own foil.", "Still waiting. Still rare.", "Which game shall it be?"],
  ],
  neko: [
    ["Correct! Gold star sticker.", "Yes! Your brain is glowing.", "Right! That's main plot knowledge.", "Nailed it, nya.", "Correct! Friendship power.", "Yes! Straight from the manga.", "Right! You didn't even need a flashback.", "That's it! Sparkle eyes."],
    ["Instant transmission!", "That was faster than a speedster arc.", "No loading time at all!", "Ultra instinct!"],
    ["Nope, wrong timeline.", "Aw, a tiny rain cloud.", "That's not it, partner.", "The answer escaped!", "Wrong! Cue the comedy fall.", "Not this episode.", "Missed. Train harder, hero.", "So close, yet so filler."],
    ["The combo continues!", "Your aura is visible!", "Unstoppable arc!", "The narrator is impressed."],
    ["New record! Opening theme remix!", "You surpassed your limits!", "A new final form!"],
    ["Episode complete!", "Roll the ending song.", "That was a good watch.", "Next time on this quiz!"],
    ["Yahoo! You're back!", "The protagonist has arrived.", "Let's start the adventure."],
    ["Waiting for the next arc.", "Should I rewatch something?", "Tail flick. Tail flick.", "Choose your quest."],
  ],
  boot: [
    ["That's it, nicely taken.", "Correct. Proper knowledge.", "Yes, you've got an eye for it.", "Right on the money.", "Good lad. Good answer.", "Spot on. Old school.", "Correct, and with a bit of style.", "That'll do very nicely."],
    ["Quick as you like!", "Straight off the first touch.", "Didn't even look. Class.", "Faster than I've ever moved."],
    ["Not that one, pal.", "Wide. Have another.", "Ah, scuffed it.", "Wrong, but keep your chin up.", "Missed. We've all done it.", "No joy there.", "That's not the one.", "Hard luck."],
    ["You're on a proper run.", "Can't miss at the minute, can you?", "Form of your life.", "Don't change a thing."],
    ["Best you've done. Savour it.", "A new high. Marvellous.", "Never seen you better."],
    ["That's your lot. Well played.", "Boots off. Good session.", "Done and dusted.", "Same again soon."],
    ["Hello again, old friend.", "Come on in, pitch is ready.", "Good to see you."],
    ["Could do with a polish.", "I'm resting my studs.", "Fancy another?", "Quiet in here."],
  ],
  rita: [
    ["Correct. Allowed.", "Yes. Perfectly legal answer.", "Right. No review needed.", "That is correct.", "Accepted without complaint.", "Good. Clean.", "Correct. Carry on.", "Yes. Textbook."],
    ["Swift and fair.", "Before I could raise my arm.", "Remarkably quick.", "No delay whatsoever."],
    ["Incorrect.", "That's a no from me.", "Not allowed, I'm afraid.", "Wrong. No arguing.", "I've seen the replay. Still no.", "That doesn't stand.", "A mistake. Compose yourself.", "No. Next."],
    ["A fine spell of play.", "Consistently correct.", "I have nothing to penalise.", "Impressive discipline."],
    ["A new best. Officially recorded.", "Your finest performance.", "That goes in my notebook, the good page."],
    ["Match concluded.", "That's time. Well conducted.", "Session closed.", "You may leave the field."],
    ["Good to see you. Behave.", "Welcome. Rules apply.", "Present and correct, excellent."],
    ["I'm checking my cards.", "Is someone going to play?", "Silence. Lovely.", "I could book this waiting."],
  ],
  bench: [
    ["Yes! I'd have said that too.", "Correct! Starting eleven answer.", "You got it! I'm on my feet.", "Right! Coach, take notes.", "That's the one!", "Correct, and I'm clapping.", "Nice! Team player.", "Yes! First choice stuff."],
    ["So fast! I missed it tying my laces.", "Instant! Super sub energy.", "Before I could stand up!", "Quickest thing I've seen all season."],
    ["Aw. Happens.", "Not that one, mate.", "I'd have missed it too. From here.", "Wrong, but you're still starting.", "Shake it off. I shake off a lot.", "No good. Next one.", "Close, in a way.", "That's okay. Nobody's subbing you."],
    ["You're never coming off!", "Man of the match material.", "Keep rolling, I'm enjoying this.", "I'm taking tips."],
    ["Your best ever! I was here for it.", "Personal best! Group hug.", "Never doubted you."],
    ["Full time from me.", "Great shift.", "Hit the showers.", "I'll keep your seat."],
    ["Hey, you're back!", "Saved you the good spot.", "Let's get you on."],
    ["Warming up my thumbs.", "Still waiting. Used to it.", "Pick one, I'll watch.", "Blanket's cosy."],
  ],
  rim: [
    ["Correct. Right through the middle.", "Yes! Clean.", "That's a make.", "Good shot.", "Right. Smooth release.", "Correct, didn't even touch me.", "Yes, count it.", "Nice and soft."],
    ["Pulled up and drained it!", "Quickest release ever.", "No dribble needed.", "Straight fire."],
    ["Off the iron.", "Brick. We move.", "Not that one.", "Bounced right out.", "Short on that one.", "Wrong, rebound it.", "That one clanked.", "Air ball, almost."],
    ["You're heating up.", "Can't guard you.", "Everything's falling.", "Keep shooting."],
    ["Career high!", "Best night yet.", "Hang that in the rafters."],
    ["Game over. Good run.", "Hit the lockers.", "That's the buzzer.", "Come shoot again."],
    ["Welcome to the court.", "Look who's back.", "Net's fresh. Let's go."],
    ["Just hanging around.", "Somebody pass the ball.", "My net's itchy.", "Quiet in the gym."],
  ],
  clock: [
    ["Correct! Phew.", "Yes! Good timing.", "Right! I can relax.", "That's it, that's it!", "Correct, and efficient.", "Yes! No time wasted.", "Right answer. Breathing again.", "Good! Very good."],
    ["That was barely a tick!", "So fast I'm confused.", "You saved so much time.", "Instant. My favourite."],
    ["Oh no. Oh no.", "Wrong! Don't panic. I will.", "Not that. Reset, reset.", "Missed. It's fine. Is it fine?", "No. Deep breath.", "That one got away.", "Incorrect. Moving on quickly.", "Not quite."],
    ["Keep the rhythm!", "Don't stop now!", "Tick, correct, tick, correct.", "You're so consistent it's soothing."],
    ["A record! Time stands still.", "Best ever! Mark the minute.", "New high, and on schedule."],
    ["All done. Right on time.", "That's the end. Already?", "Finished. I can rest a second.", "Wrap up complete."],
    ["You're here! Not late at all.", "Welcome! No rush. Small rush.", "Ready? I'm ready. Mostly."],
    ["The waiting is the worst part.", "I keep counting anyway.", "Any second now.", "Choose quickly, or not, it's fine."],
  ],
  sneak: [
    ["Yes sir!", "That's fire!", "Correct, no cap.", "You ate that.", "Right! Squeaky clean.", "Big answer!", "Yup yup!", "Smooth operator."],
    ["Zoom! Gone!", "That was filthy quick.", "Speed demon!", "Didn't even squeak first."],
    ["Nah, not that one.", "Slipped!", "Whoops, loose lace.", "All good, bounce back.", "Not it, fam.", "Missed that step.", "Wrong, but stylish.", "Run it back."],
    ["You're cooking!", "Can't be stopped!", "Streak is wild!", "Somebody call the fire team."],
    ["New record, let's go!", "That's your best, legend!", "Highest bounce yet!"],
    ["We're out! Good one.", "Kicks off. Rest up.", "That was a vibe.", "Catch you next run."],
    ["Yooo, you made it!", "Fresh kicks, fresh start.", "Let's lace up."],
    ["Squeak. Just testing.", "Bored soles over here.", "Pick a game, any game.", "Doing a little shuffle."],
  ],
  pin: [
    ["Correct. Exactly there.", "Yes, right on target.", "That's the spot.", "Well located.", "Correct. Good bearings.", "Right where I'd have put it.", "Yes. Excellent navigation.", "Found it."],
    ["Straight there, no detours.", "You didn't even unfold the map.", "Faster than a signal.", "Direct flight."],
    ["Not there.", "A little off course.", "Wrong turning.", "That's somewhere else.", "Missed the mark.", "No. Let's reorient.", "Not on this map.", "Detour required."],
    ["Making great distance.", "No wrong turns lately.", "A very straight road.", "Onward."],
    ["Your furthest point yet.", "New record on the map.", "A personal summit."],
    ["Trip complete.", "We stop here.", "Pins down. Rest.", "Until the next journey."],
    ["You've arrived.", "Good to have a travelling companion.", "Where to?"],
    ["I'm holding this spot.", "Somewhere nice would be good.", "Waiting at the crossroads.", "Pick a direction."],
  ],
  tock: [
    ["Correct, as it was written.", "Yes, indeed.", "Right. A sound memory.", "That is so.", "Correct. Well recalled.", "Yes, the record confirms it.", "Truly said.", "Precisely."],
    ["Swift as a messenger.", "Quicker than I can turn.", "An immediate reply. Rare in any age.", "No pondering required."],
    ["That is not so.", "An error, gently noted.", "No. Think back further.", "Alas, mistaken.", "Not that one.", "The memory slipped.", "Incorrect, young scholar.", "Another time, perhaps."],
    ["A long and noble run.", "Steady as the ages.", "Your reign goes on.", "Few manage this."],
    ["The finest hour yet.", "A new height in your annals.", "Remember this one."],
    ["The chapter closes.", "So ends the session.", "Until the glass turns again.", "Rest now."],
    ["Welcome, traveller in time.", "You return. Good.", "Shall we look backwards together?"],
    ["Sand falls. I wait.", "Patience is my trade.", "The past is not going anywhere.", "Choose, when ready."],
  ],
  dumpling: [
    ["Correct. Tasty.", "Yes, well cooked.", "Right. Full of flavour.", "That's a good one.", "Correct. Compliments.", "Yes. Nicely done.", "Right, just right.", "Mm. Correct."],
    ["Served before I could order.", "Express kitchen.", "Hot and fast.", "Instant noodle speed."],
    ["Not to my taste.", "Wrong ingredient.", "That one flopped.", "No, no, no.", "A bit soggy, that answer.", "Missed the pot.", "Incorrect. Wipe the counter.", "Try another recipe."],
    ["A feast of correct answers.", "The pot is boiling over, nicely.", "Seconds, thirds, keep going.", "Chef mode."],
    ["Your best dish yet.", "A new house record.", "Michelin moment."],
    ["Kitchen closing.", "Thank you for dining.", "All plates cleared.", "Come back hungry."],
    ["Welcome, have a seat.", "Good, a customer.", "Something smells like a quiz."],
    ["I'm simmering.", "Anyone hungry?", "Waiting for an order.", "Do not poke the dumpling."],
  ],
  dogear: [
    ["Correct. Duly noted.", "Yes, as printed.", "Right. A good entry.", "That's the one.", "Correct, well read.", "Yes, no correction needed.", "Right on the page.", "Accurate."],
    ["Quicker than the index.", "You didn't even turn a page.", "Immediate recall.", "A speed reader."],
    ["Not that entry.", "An erratum.", "Wrong page, I'm afraid.", "Not quite what's written.", "Incorrect. Mark and learn.", "That belongs elsewhere.", "No. Check again next time.", "A smudge."],
    ["A fine chapter of answers.", "Page after page.", "Quite the series.", "Do continue."],
    ["Your best edition yet.", "A record, bound in gold.", "Newly revised, upwards."],
    ["The end of this volume.", "Bookmark placed.", "Reading time's up.", "Until the sequel."],
    ["Welcome back to the shelf.", "Good, a reader.", "Open wherever you like."],
    ["Dust gathers.", "I've reread myself twice.", "Take your pick.", "Quietly waiting."],
  ],
  pip: [
    ["Yes! Forward we go.", "Correct! One square closer.", "Right! Brave answer.", "That's it, general!", "Correct! I felt that.", "Yes! Strong.", "Right! Tiny cheer.", "Good one!"],
    ["Faster than a knight!", "You didn't even pause.", "Charge! Straight to it.", "Wow, instant."],
    ["Oh. Not that one.", "Wrong, but we keep marching.", "A stumble. Up you get.", "Not it. I believe in you.", "Missed. Pawns miss too.", "That's alright.", "No. Next square.", "Close ranks and try again."],
    ["We're advancing!", "Look at that run!", "I've never seen the front like this.", "Keep marching!"],
    ["Your best ever! Promotion for you.", "New record! Hats off.", "That's heroic."],
    ["Campaign over. Well fought.", "Back to the box.", "Good march today.", "Rest, soldier."],
    ["You're back! Reporting for duty.", "Hello! I kept your place.", "Ready to march."],
    ["Standing very still.", "Is it my turn?", "I can wait. I'm used to it.", "Choose our next battle."],
  ],
  vera: [
    ["Correct. Naturally.", "Yes, well done.", "Right. I approve.", "Precisely so.", "Correct. How refined.", "Yes. You may continue.", "Quite right.", "Acceptable. More than acceptable."],
    ["Swift. I like that.", "Immediate. Regal, even.", "You didn't keep me waiting.", "Splendidly fast."],
    ["No, dear.", "Incorrect. Chin up.", "That will not do.", "A disappointment, briefly.", "Wrong. Compose yourself.", "Not that one.", "I've heard better.", "Try to be more careful."],
    ["You're on a rather royal run.", "Consistent. Good.", "I'm nearly impressed.", "Do keep this up."],
    ["Your finest. I shall remember it.", "A new best. Bow.", "Magnificent, for once. Always, perhaps."],
    ["That concludes the audience.", "You are dismissed, with honours.", "A pleasant session.", "Until we meet again."],
    ["Ah, there you are.", "You may sit.", "Entertain me."],
    ["I am waiting.", "Do hurry along.", "My crown is heavy.", "Choose something worthy."],
  ],
  bea: [
    ["Yes. Calmly done.", "Correct. Well seen.", "That's right.", "Good. Very good.", "Correct. A clear line.", "Yes, nicely judged.", "Right. Trust that.", "Exactly."],
    ["You saw it at once.", "Quick and sure.", "No doubt at all.", "A clean, straight line."],
    ["Not this time.", "That's alright. Look again.", "A small miss.", "Wrong, but you learn.", "Breathe. Next one.", "Not quite there.", "An angle you missed.", "Be gentle with yourself."],
    ["A lovely rhythm.", "You're seeing clearly.", "Steady and strong.", "Keep your calm."],
    ["Your best yet. Quietly wonderful.", "A new high. Well earned.", "That's real progress."],
    ["A good session.", "Rest your mind now.", "Well done today.", "Until next time."],
    ["Welcome. Take a breath.", "Nice to see you.", "Shall we begin slowly?"],
    ["There's no hurry.", "I'm thinking in diagonals.", "Quiet is useful.", "Choose when you're ready."],
  ],
};
/* the chess coaches' quiz pools were mapped from chess move grades ("You sacrificed your queen", "Checkmate", "Book move"), which
   are false after a quiz answer. In quizzes they now say only these lines; their move-grade lines stay for chess itself. */
["pip", "vera", "bea"].forEach((k) => {
  const old = MASCOT_LINES[k] || {}, L = { ...old };
  const own = Object.fromEntries(SIDE_KINDS3.map((kind, i) => [kind, SIDE_LINES3[k][i]]));
  Object.assign(L, own, {
    welcome: own.welcome, rankup: (MORE_LINES[k] || {}).rankup || own.best, achieve: own.best,
    idle: [...own.idle, ...(old.idle || []).filter((t) => /^Fun fact:/.test(t))],
    // for the chess screens only
    ch_win: ((COACH_LINES[k] || {}).win || []), ch_loss: ((COACH_LINES[k] || {}).loss || []), ch_draw: ((COACH_LINES[k] || {}).draw || []),
    rv_best: (COACH_LINES[k] || {}).best || [], rv_good: (COACH_LINES[k] || {}).good || [], rv_inaccuracy: (COACH_LINES[k] || {}).inaccuracy || [], rv_mistake: (COACH_LINES[k] || {}).mistake || [], rv_blunder: (COACH_LINES[k] || {}).blunder || [],
  });
  MASCOT_LINES[k] = L; MASCOTS[k].lines = L;
});
Object.entries(SIDE_LINES3).forEach(([k, rows]) => {
  if (["pip", "vera", "bea"].includes(k)) return;
  const L = (MASCOT_LINES[k] = { ...(MASCOT_LINES[k] || {}) });
  rows.forEach((lines, i) => { const kind = SIDE_KINDS3[i]; L[kind] = [...new Set([...(L[kind] || []), ...lines])]; });
  if (MASCOTS[k]) MASCOTS[k].lines = L;
});
