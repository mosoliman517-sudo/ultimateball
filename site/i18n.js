/* ================= Languages: German, French, Arabic (right to left), the same three as ballknowledge =================
   Exact English wording is swapped on screen; anything not listed stays English, and names, clues, answers and sidekick lines are never
   touched. A first draft: no native speaker has read it. One row per phrase: English|German|French|Arabic */
const I18N_ROWS = `
Skip to content|Zum Inhalt springen|Aller au contenu|انتقل إلى المحتوى
Built by moisback22|Gebaut von moisback22|Créé par moisback22|من صنع moisback22
Draft|Entwurf|Brouillon|مسودة
Sign in|Anmelden|Se connecter|تسجيل الدخول
← Menu|← Menü|← Menu|← القائمة
← Back|← Zurück|← Retour|→ رجوع
← Worlds|← Welten|← Mondes|← العوالم
Menu|Menü|Menu|القائمة
Worlds|Welten|Mondes|العوالم
Settings|Einstellungen|Réglages|الإعدادات
Wiki|Wiki|Wiki|الموسوعة
Calendar|Kalender|Calendrier|التقويم
Pictures|Bilder|Images|الصور
Collection|Sammlung|Collection|المجموعة
Every topic, one arena|Jedes Thema, eine Arena|Tous les sujets, une arène|كل المواضيع في ساحة واحدة
K-pop, football, basketball, chess, geography, history, food, anime and general knowledge. Real data, typed answers, solo or against a friend.|K-Pop, Fußball, Basketball, Schach, Erdkunde, Geschichte, Essen, Anime und Allgemeinwissen. Echte Daten, getippte Antworten, allein oder gegen Freunde.|K-pop, football, basket, échecs, géographie, histoire, cuisine, anime et culture générale. De vraies données, des réponses tapées, seul ou contre un ami.|كيبوب وكرة قدم وكرة سلة وشطرنج وجغرافيا وتاريخ وطعام وأنمي ومعلومات عامة. بيانات حقيقية وإجابات مكتوبة، وحدك أو ضد صديق.
Pick a category|Wähle eine Kategorie|Choisis une catégorie|اختر فئة
Tap one to see its games. Each has its own sidekick, music, loading screens and rank.|Tippe eine an, um ihre Spiele zu sehen. Jede hat ihren eigenen Sidekick, Musik, Ladebildschirme und Rang.|Touche-en une pour voir ses jeux. Chacune a son compagnon, sa musique, ses écrans et son rang.|اضغط على فئة لترى ألعابها. لكل منها رفيقها وموسيقاها وشاشاتها ورتبتها.
categories|Kategorien|catégories|فئات
games|Spiele|jeux|لعبة
real people, places and things|echte Menschen, Orte und Dinge|personnes, lieux et choses réels|أشخاص وأماكن وأشياء حقيقية
Multi-genre|Gemischt|Multi-genres|متعدد الفئات
Every category in one game. Test yourself across all of them, or beat a friend who knows completely different things.|Alle Kategorien in einem Spiel. Teste dich quer durch alles oder schlag jemanden, der ganz andere Dinge weiß.|Toutes les catégories en un jeu. Teste-toi partout, ou bats un ami qui connaît tout autre chose.|كل الفئات في لعبة واحدة. اختبر نفسك فيها كلها أو اغلب صديقًا يعرف أشياء مختلفة تمامًا.
Cross-category match|Kategorien-Duell|Match entre catégories|مباراة بين الفئات
Challenge a friend|Freund herausfordern|Défie un ami|تحدَّ صديقًا
Gamut run|Alles-Lauf|Le grand tour|جولة كل الفئات
Solo. One round from every category, back to back. How far does your knowledge reach?|Allein. Eine Runde aus jeder Kategorie, direkt hintereinander. Wie weit reicht dein Wissen?|En solo. Une manche par catégorie, à la suite. Jusqu'où vont tes connaissances ?|وحدك. جولة من كل فئة على التوالي. إلى أين تصل معرفتك؟
Pick your|Wähle deine|Choisis ton|اختر
world|Welt|monde|عالمك
What do you want to play?|Worauf hast du Lust?|À quoi veux-tu jouer ?|ماذا تريد أن تلعب؟
Football|Fußball|Football|كرة القدم
Basketball|Basketball|Basket|كرة السلة
Chess|Schach|Échecs|الشطرنج
K-pop|K-Pop|K-pop|كيبوب
Geography|Erdkunde|Géographie|الجغرافيا
History|Geschichte|Histoire|التاريخ
Food|Essen|Cuisine|الطعام
Anime|Anime|Anime|أنمي
General knowledge|Allgemeinwissen|Culture générale|معلومات عامة
Rank|Rang|Rang|الرتبة
World XP|Welt-XP|XP du monde|نقاط العالم
Dex|Dex|Dex|الألبوم
Difficulty|Schwierigkeit|Difficulté|الصعوبة
Easy|Leicht|Facile|سهل
Medium|Mittel|Moyen|متوسط
Hard|Schwer|Difficile|صعب
Players and devices|Spieler und Geräte|Joueurs et appareils|اللاعبون والأجهزة
Solo streak|Solo-Serie|Série en solo|سلسلة فردية
Solo|Allein|Solo|فردي
Solo, against the computer|Allein gegen den Computer|Seul contre l'ordinateur|وحدك ضد الحاسوب
Solo, against the clock|Allein gegen die Uhr|Seul contre la montre|وحدك ضد الساعة
Two players, one device|Zwei Spieler, ein Gerät|Deux joueurs, un appareil|لاعبان على جهاز واحد
Two players, two devices|Zwei Spieler, zwei Geräte|Deux joueurs, deux appareils|لاعبان على جهازين
Survival|Überleben|Survie|البقاء
Three lives. The questions get harder every three. One high score.|Drei Leben. Alle drei Fragen wird es schwerer. Ein Rekord.|Trois vies. Les questions se corsent toutes les trois. Un seul record.|ثلاث محاولات. تزداد الصعوبة كل ثلاثة أسئلة. رقم قياسي واحد.
Keep going for as long as you can. The run ends the first time you miss.|Mach weiter, so lange du kannst.|Continue aussi longtemps que possible.|استمر قدر ما تستطيع.
Five rounds. Race to buzz: A for player 1, L for player 2.|Fünf Runden. Wer zuerst buzzert: A für Spieler 1, L für Spieler 2.|Cinq manches. Au buzzer : A pour le joueur 1, L pour le joueur 2.|خمس جولات. سباق على الجرس: A للاعب الأول وL للثاني.
The same race on two phones or computers, with a four-letter room code.|Dasselbe Rennen auf zwei Geräten, mit einem Raumcode aus vier Buchstaben.|La même course sur deux appareils, avec un code à quatre lettres.|السباق نفسه على جهازين برمز غرفة من أربعة أحرف.
Names for two players on one device (optional)|Namen für zwei Spieler an einem Gerät (freiwillig)|Noms des deux joueurs (facultatif)|اسما اللاعبين على جهاز واحد (اختياري)
Not played yet|Noch nicht gespielt|Pas encore joué|لم تُلعب بعد
vs computer · 2 players|gegen Computer · 2 Spieler|contre l'ordinateur · 2 joueurs|ضد الحاسوب · لاعبان
Solo streak · 2 players|Solo-Serie · 2 Spieler|Série solo · 2 joueurs|سلسلة فردية · لاعبان
Solo 60 seconds · 2 players|Solo 60 Sekunden · 2 Spieler|Solo 60 secondes · 2 joueurs|فردي ٦٠ ثانية · لاعبان
Solo streak · 2 players · online|Solo-Serie · 2 Spieler · online|Série solo · 2 joueurs · en ligne|سلسلة فردية · لاعبان · عبر الإنترنت
Solo · 2 players|Allein · 2 Spieler|Solo · 2 joueurs|فردي · لاعبان
Buzz|Buzzern|Buzz|اضغط
BUZZ|BUZZ|BUZZ|الجرس
space bar|Leertaste|barre d'espace|مفتاح المسافة
Give up|Aufgeben|Abandonner|استسلم
Skip this one|Überspringen|Passer|تخطَّ
Guess|Raten|Valider|خمّن
Your answer|Deine Antwort|Ta réponse|إجابتك
Type your answer|Antwort eintippen|Tape ta réponse|اكتب إجابتك
Type a name|Namen eintippen|Tape un nom|اكتب اسمًا
Next round|Nächste Runde|Manche suivante|الجولة التالية
Next|Weiter|Suivant|التالي
Pause|Pause|Pause|إيقاف مؤقت
See the final score|Endstand ansehen|Voir le score final|النتيجة النهائية
See the result|Ergebnis ansehen|Voir le résultat|النتيجة
Play again|Nochmal spielen|Rejouer|العب مجددًا
The answer|Die Antwort|La réponse|الإجابة
You got it|Richtig|Bien joué|أصبت
Not this time|Diesmal nicht|Pas cette fois|ليس هذه المرة
Nobody got it|Niemand wusste es|Personne n'a trouvé|لم يعرفها أحد
Skipped|Übersprungen|Passé|تم التخطي
Full time|Abpfiff|Terminé|انتهت المباراة
A draw.|Unentschieden.|Égalité.|تعادل.
Serious knowledge.|Echtes Fachwissen.|Sacrées connaissances.|معرفة كبيرة.
Solid.|Solide.|Solide.|جيد.
Keep practising.|Weiter üben.|Continue à t'entraîner.|واصل التدريب.
Out of lives.|Keine Leben mehr.|Plus de vies.|انتهت المحاولات.
Held on well.|Gut durchgehalten.|Belle résistance.|صمود جيد.
A survivor.|Ein Überlebenskünstler.|Un vrai survivant.|ناجٍ حقيقي.
Score|Punkte|Score|النتيجة
Worth|Wert|Vaut|تساوي
points now|Punkte jetzt|points maintenant|نقطة الآن
Sharpens every few seconds|Wird alle paar Sekunden schärfer|Plus net toutes les quelques secondes|تتضح كل بضع ثوانٍ
Zooming out every few seconds|Zoomt alle paar Sekunden heraus|Dézoome toutes les quelques secondes|يبتعد التكبير كل بضع ثوانٍ
Tiles fall away every few seconds|Alle paar Sekunden fallen Kacheln weg|Des tuiles tombent toutes les quelques secondes|تسقط المربعات كل بضع ثوانٍ
Listening… replay with the button below|Läuft… unten nochmal abspielen|Écoute… relance avec le bouton|استمع… أعد التشغيل بالزر أدناه
▶ Tap to play|▶ Antippen zum Abspielen|▶ Touche pour écouter|▶ اضغط للتشغيل
Your rival is answering…|Dein Gegner antwortet…|Ton rival répond…|منافسك يجيب…
Sound|Ton|Son|الصوت
Off|Aus|Non|إيقاف
Soft|Leise|Doux|خافت
Full|Voll|Fort|كامل
On|An|Oui|تشغيل
Lobby music|Menümusik|Musique du menu|موسيقى القائمة
Language|Sprache|Langue|اللغة
Your profile, ranks and achievements|Dein Profil, Ränge und Erfolge|Ton profil, tes rangs et succès|ملفك ورتبك وإنجازاتك
Your collection|Deine Sammlung|Ta collection|مجموعتك
All worlds|Alle Welten|Tous les mondes|كل العوالم
Photocards|Fotokarten|Photocards|بطاقات الصور
Loading screens|Ladebildschirme|Écrans de chargement|شاشات التحميل
In your Dex|In deinem Dex|Dans ton Dex|في ألبومك
New photocard|Neue Fotokarte|Nouvelle photocard|بطاقة جديدة
Odd one out|Wer passt nicht?|L'intrus|من الدخيل؟
Five idols, four from one group. Type the name of the one who doesn't belong.|Fünf Idols, vier aus einer Gruppe. Tippe den Namen, der nicht dazugehört.|Cinq idoles, quatre du même groupe. Tape le nom de l'intrus.|خمسة نجوم، أربعة من فرقة واحدة. اكتب اسم الدخيل.
Who is not in the same group as the others?|Wer ist nicht in derselben Gruppe?|Qui n'est pas du même groupe ?|من ليس في الفرقة نفسها؟
Two songs at once|Zwei Songs auf einmal|Deux chansons à la fois|أغنيتان معًا
Two song previews play together. Name both titles, one at a time or with a + between them.|Zwei Hörproben laufen gleichzeitig. Nenne beide Titel, einzeln oder mit + dazwischen.|Deux extraits jouent ensemble. Donne les deux titres, un par un ou séparés par +.|مقطعان يعملان معًا. اذكر العنوانين، واحدًا تلو الآخر أو بينهما +.
Mixed marathon|Mix-Marathon|Marathon mixte|ماراثون منوّع
One run that jumps between games.|Ein Lauf quer durch die Spiele.|Une course d'un jeu à l'autre.|جولة تقفز بين الألعاب.
All twelve, as many points as you can.|Alle zwölf, so viele Punkte wie möglich.|Les douze, un maximum de points.|الأسئلة الاثنا عشر بأكبر عدد من النقاط.
Race to buzz: A for player 1, L for player 2.|Buzzer-Rennen: A für Spieler 1, L für Spieler 2.|Au buzzer : A pour le joueur 1, L pour le joueur 2.|سباق على الجرس: A للأول وL للثاني.
Party room|Partyraum|Salle de fête|غرفة الحفلة
3 to 8 players, own phones|3 bis 8 Spieler, eigene Handys|3 à 8 joueurs, chacun son téléphone|من ٣ إلى ٨ لاعبين بهواتفهم
One code, everyone answers at once, fastest scores most.|Ein Code, alle antworten gleichzeitig, die Schnellsten punkten am meisten.|Un code, tout le monde répond en même temps, le plus rapide marque le plus.|رمز واحد، الجميع يجيب معًا، والأسرع يكسب أكثر.
Your name|Dein Name|Ton nom|اسمك
Start a party|Party starten|Lancer une fête|ابدأ حفلة
Join|Beitreten|Rejoindre|انضم
or|oder|ou|أو
Party code|Party-Code|Code de la fête|رمز الحفلة
Copy the invite link|Einladungslink kopieren|Copier le lien|انسخ رابط الدعوة
Create a room|Raum erstellen|Créer un salon|أنشئ غرفة
Play a friend: room code|Gegen Freunde: Raumcode|Contre un ami : code du salon|العب مع صديق: رمز الغرفة
Photocard binder|Fotokarten-Album|Classeur de photocards|ألبوم البطاقات
Your collection|Deine Sammlung|Ta collection|مجموعتك
Every idol you name correctly leaves a card here.|Jedes richtig genannte Idol hinterlässt hier eine Karte.|Chaque idole trouvée laisse une carte ici.|كل نجم تسمّيه بشكل صحيح يترك بطاقة هنا.
Play a round that starts with this one|Eine Runde, die hiermit beginnt|Jouer une manche qui commence par ceci|العب جولة تبدأ بهذا
Quick quiz|Schnellquiz|Quiz express|اختبار سريع
Answer scramble|Antwort-Salat|Réponse mélangée|إجابة مبعثرة
Scramble|Buchstabensalat|Lettres mêlées|حروف مبعثرة
Who am I?|Wer bin ich?|Qui suis-je ?|من أنا؟
Career path|Karriereweg|Parcours|مسيرة اللاعب
Name that club|Welcher Verein?|Quel club ?|ما اسم النادي؟
Badge blur|Wappen-Rätsel|Écusson flou|شعار ضبابي
Logo blur|Logo-Rätsel|Logo flou|شارة ضبابية
Flag blur|Flaggen-Rätsel|Drapeau flou|علم ضبابي
Who's that player?|Wer ist der Spieler?|Qui est ce joueur ?|من هذا اللاعب؟
Market value|Marktwert|Valeur marchande|القيمة السوقية
Starting XI|Startelf|Le onze de départ|التشكيلة الأساسية
Starting five|Startfünf|Le cinq majeur|الخماسي الأساسي
Football tic-tac-toe|Fußball-Tic-Tac-Toe|Morpion foot|إكس أو الكروي
Hoops tic-tac-toe|Basketball-Tic-Tac-Toe|Morpion basket|إكس أو السلة
K-pop tic-tac-toe|K-Pop-Tic-Tac-Toe|Morpion K-pop|إكس أو الكيبوب
Club roulette|Vereins-Roulette|Roulette des clubs|روليت الأندية
Team roulette|Team-Roulette|Roulette des équipes|روليت الفرق
Career points|Karrierepunkte|Points en carrière|نقاط المسيرة
Play chess|Schach spielen|Jouer aux échecs|العب الشطرنج
Who is this player?|Wer ist das?|Qui est ce joueur ?|من هذا اللاعب؟
Who's that grandmaster?|Welcher Großmeister?|Quel grand maître ?|من هذا الأستاذ الكبير؟
Name the opening|Welche Eröffnung?|Quelle ouverture ?|ما اسم الافتتاحية؟
Higher peak?|Höhere Bestzahl?|Meilleur record ?|أي ذروة أعلى؟
Who's that idol?|Welches Idol?|Quelle idole ?|من هذا النجم؟
Who's missing?|Wer fehlt?|Qui manque ?|من الغائب؟
Name the group|Welche Gruppe?|Quel groupe ?|ما اسم الفرقة؟
Album → song|Album → Song|Album → chanson|من الألبوم إلى الأغنية
Blurred album cover|Verschwommenes Cover|Pochette floue|غلاف ضبابي
Hear the song|Song hören|Écoute la chanson|استمع للأغنية
Guess the song|Song erraten|Devine la chanson|خمّن الأغنية
Which album is it from?|Aus welchem Album?|De quel album ?|من أي ألبوم؟
Whose song is it?|Von wem ist der Song?|De qui est la chanson ?|لمن هذه الأغنية؟
Group: Who are we?|Gruppe: Wer sind wir?|Groupe : qui sommes-nous ?|الفرقة: من نحن؟
Which release came first?|Was erschien zuerst?|Quelle sortie en premier ?|أي إصدار جاء أولًا؟
Name the release|Welche Veröffentlichung?|Quelle sortie ?|ما اسم الإصدار؟
Name the leader|Wer ist Leader?|Qui est le leader ?|من القائد؟
Name the maknae|Wer ist Maknae?|Qui est le maknae ?|من أصغر الأعضاء؟
Whose fandom is this?|Welches Fandom?|À qui ce fandom ?|لمن هذا الجمهور؟
Whose colours are these?|Wessen Farben?|À qui ces couleurs ?|لمن هذه الألوان؟
Whose unit is it?|Wessen Unit?|À qui cette sous-unité ?|لمن هذه الوحدة؟
Which song is newer?|Welcher Song ist neuer?|Quelle chanson est la plus récente ?|أي أغنية أحدث؟
Bigger fandom?|Größeres Fandom?|Plus grand fandom ?|أي جمهور أكبر؟
Member roulette|Mitglieder-Roulette|Roulette des membres|روليت الأعضاء
Name every member|Alle Mitglieder nennen|Tous les membres|سمِّ كل الأعضاء
Who's older?|Wer ist älter?|Qui est l'aîné ?|من الأكبر سنًا؟
Label roulette|Label-Roulette|Roulette des agences|روليت الوكالات
Tile reveal: the idol|Kacheln: das Idol|Tuiles : l'idole|المربعات: النجم
Tile reveal: the series|Kacheln: die Serie|Tuiles : la série|المربعات: المسلسل
Tile reveal: the flag|Kacheln: die Flagge|Tuiles : le drapeau|المربعات: العلم
Tile reveal: the moment|Kacheln: der Moment|Tuiles : le moment|المربعات: الحدث
Zoom out: the player|Rauszoomen: der Spieler|Dézoom : le joueur|ابتعد: اللاعب
Zoom out: the grandmaster|Rauszoomen: der Großmeister|Dézoom : le grand maître|ابتعد: الأستاذ الكبير
Zoom out: the landmark|Rauszoomen: das Wahrzeichen|Dézoom : le monument|ابتعد: المعلم
Zoom out: the figure|Rauszoomen: die Person|Dézoom : le personnage|ابتعد: الشخصية
Zoom out: the dish|Rauszoomen: das Gericht|Dézoom : le plat|ابتعد: الطبق
Zoom out: who is it?|Rauszoomen: wer ist das?|Dézoom : qui est-ce ?|ابتعد: من هذا؟
Which anime am I?|Welcher Anime bin ich?|Quel anime suis-je ?|أي أنمي أنا؟
Which anime are they from?|Aus welchem Anime?|De quel anime ?|من أي أنمي هم؟
Character roulette|Figuren-Roulette|Roulette des personnages|روليت الشخصيات
Who's that character?|Welche Figur?|Quel personnage ?|من هذه الشخصية؟
Which aired first?|Was lief zuerst?|Lequel est sorti en premier ?|أيهما عُرض أولًا؟
Series from its cast|Serie am Ensemble erkennen|La série par ses personnages|المسلسل من شخصياته
More episodes?|Mehr Folgen?|Plus d'épisodes ?|أيهما أكثر حلقات؟
Hear the opening|Opening hören|Écoute l'opening|استمع للمقدمة
Hear the ending|Ending hören|Écoute l'ending|استمع للخاتمة
Which country am I?|Welches Land bin ich?|Quel pays suis-je ?|أي بلد أنا؟
Capital cities|Hauptstädte|Capitales|العواصم
More people?|Mehr Einwohner?|Plus d'habitants ?|أيهما أكثر سكانًا؟
Name the landmark|Welches Wahrzeichen?|Quel monument ?|ما اسم المعلم؟
Where in the world?|Wo auf der Welt?|Où dans le monde ?|أين في العالم؟
Which invention came first?|Welche Erfindung war zuerst?|Quelle invention en premier ?|أي اختراع جاء أولًا؟
Name the invention|Welche Erfindung?|Quelle invention ?|ما اسم الاختراع؟
Name the event|Welches Ereignis?|Quel événement ?|ما اسم الحدث؟
Which happened first?|Was geschah zuerst?|Qu'est-ce qui s'est passé en premier ?|أيهما حدث أولًا؟
Whose flag was this?|Wessen Flagge war das?|À qui était ce drapeau ?|علم من كان هذا؟
Who's in the portrait?|Wer ist auf dem Porträt?|Qui est sur le portrait ?|من في الصورة؟
Who was born first?|Wer wurde zuerst geboren?|Qui est né en premier ?|من وُلد أولًا؟
Name the dish|Welches Gericht?|Quel plat ?|ما اسم الطبق؟
Ingredient reveal|Zutaten-Rätsel|Les ingrédients|كشف المكونات
Where's it from?|Woher kommt es?|D'où ça vient ?|من أين هو؟
Hard questions only|Nur schwere Fragen|Questions difficiles seulement|الأسئلة الصعبة فقط
Science and nature|Wissenschaft und Natur|Sciences et nature|العلوم والطبيعة
History and myth|Geschichte und Mythen|Histoire et mythes|التاريخ والأساطير
Film and TV|Film und Fernsehen|Cinéma et télé|السينما والتلفاز
Music|Musik|Musique|الموسيقى
Video games|Videospiele|Jeux vidéo|ألعاب الفيديو
Sport and vehicles|Sport und Fahrzeuge|Sport et véhicules|الرياضة والمركبات
Places|Orte|Lieux|الأماكن
Books, comics and art|Bücher, Comics und Kunst|Livres, BD et art|الكتب والقصص المصورة والفن
A close-up that slowly zooms out. Buzz as soon as you know it.|Eine Nahaufnahme, die langsam herauszoomt. Buzzer, sobald du es weißt.|Un gros plan qui dézoome lentement. Buzze dès que tu sais.|لقطة قريبة تبتعد ببطء. اضغط حالما تعرف.
A picture hidden behind tiles that fall away. Buzz as soon as you know it.|Ein Bild hinter Kacheln, die wegfallen. Buzzer, sobald du es weißt.|Une image cachée derrière des tuiles qui tombent. Buzze dès que tu sais.|صورة خلف مربعات تتساقط. اضغط حالما تعرف.
An idol's photo, right away. Buzz and type the name. A hint comes at a third of the time, another at two thirds.|Sofort ein Foto eines Idols. Buzzern und Namen tippen. Hinweise nach einem und zwei Dritteln der Zeit.|La photo d'une idole tout de suite. Buzze et tape le nom. Des indices au tiers et aux deux tiers du temps.|صورة نجم فورًا. اضغط واكتب الاسم. تلميح بعد ثلث الوقت وآخر بعد ثلثيه.
A group's line-up with one empty slot. Name the missing member.|Eine Gruppenaufstellung mit einer Lücke. Wer fehlt?|La formation d'un groupe avec une place vide. Nomme le membre manquant.|تشكيلة فرقة بمكان فارغ. سمِّ العضو الغائب.
Member names appear one by one. Buzz with the group they're in.|Mitgliedernamen erscheinen nacheinander. Nenne die Gruppe.|Les noms des membres apparaissent un à un. Donne le groupe.|تظهر أسماء الأعضاء واحدًا تلو الآخر. اذكر الفرقة.
Three seconds of a real song. Then five more. Buzz and type the title before the hints arrive.|Drei Sekunden eines echten Songs, dann fünf mehr. Tippe den Titel, bevor die Hinweise kommen.|Trois secondes d'une vraie chanson, puis cinq de plus. Tape le titre avant les indices.|ثلاث ثوانٍ من أغنية حقيقية ثم خمس أخرى. اكتب العنوان قبل التلميحات.
A real song: when it came out, its album, then the group. Type the title.|Ein echter Song: Erscheinungsjahr, Album, dann die Gruppe. Tippe den Titel.|Une vraie chanson : date, album, puis le groupe. Tape le titre.|أغنية حقيقية: تاريخها ثم ألبومها ثم الفرقة. اكتب العنوان.
A mystery player. Clues go from obscure to obvious. Buzz in early for more points.|Ein unbekannter Spieler. Die Hinweise werden immer deutlicher. Früh buzzern bringt mehr Punkte.|Un joueur mystère. Les indices vont de l'obscur à l'évident. Buzze tôt pour plus de points.|لاعب غامض. التلميحات من الأصعب إلى الأوضح. اضغط مبكرًا لنقاط أكثر.
Type names in any order. Initials cost 30 points, a wrong name 20.|Namen in beliebiger Reihenfolge. Initialen kosten 30 Punkte, ein falscher Name 20.|Les noms dans n'importe quel ordre. Les initiales coûtent 30 points, un mauvais nom 20.|اكتب الأسماء بأي ترتيب. الأحرف الأولى تكلف ٣٠ نقطة والاسم الخاطئ ٢٠.
The difficulty sets how strong the computer plays.|Die Schwierigkeit bestimmt die Spielstärke des Computers.|La difficulté règle la force de l'ordinateur.|الصعوبة تحدد قوة الحاسوب.
The picture is there from the start; hints arrive at one third and two thirds of the time.|Das Bild ist von Anfang an da; Hinweise nach einem und zwei Dritteln der Zeit.|L'image est là dès le début ; les indices arrivent au tiers et aux deux tiers.|الصورة ظاهرة من البداية، والتلميحات بعد ثلث الوقت وثلثيه.
Clues start hard and get easier.|Die Hinweise werden von schwer zu leicht.|Les indices vont du plus dur au plus facile.|تبدأ التلميحات صعبة ثم تسهل.
The picture starts blurred and sharpens every few seconds.|Das Bild beginnt unscharf und wird nach und nach schärfer.|L'image commence floue et devient nette peu à peu.|تبدأ الصورة ضبابية وتتضح تدريجيًا.
The letters of every word are shuffled. Hints arrive slowly.|Die Buchstaben jedes Wortes sind vertauscht. Hinweise kommen langsam.|Les lettres de chaque mot sont mélangées. Les indices arrivent lentement.|حروف كل كلمة مبعثرة. التلميحات تأتي ببطء.
Two picks, one question. Tap the right side.|Zwei Möglichkeiten, eine Frage. Tippe die richtige Seite an.|Deux choix, une question. Touche le bon côté.|خياران وسؤال واحد. اضغط على الجانب الصحيح.
Tap a square and name someone who fits its row and column. A wrong or repeated name loses your turn.|Feld antippen und jemanden nennen, der zu Zeile und Spalte passt. Falsch oder doppelt kostet den Zug.|Touche une case et nomme quelqu'un qui convient. Un nom faux ou répété fait perdre le tour.|اضغط مربعًا وسمِّ من يناسب صفه وعموده. الاسم الخاطئ أو المكرر يضيع دورك.
Name as many as you can. In a duel, take turns: blank, repeat or run out of time and you lose the round.|Nenne so viele wie möglich. Im Duell abwechselnd: Wer nichts weiß, wiederholt oder zu lange braucht, verliert die Runde.|Nomme-en le plus possible. En duel, chacun son tour : sans réponse, répétition ou temps écoulé, la manche est perdue.|سمِّ أكبر عدد ممكن. في المبارزة بالتناوب: من يتوقف أو يكرر أو ينتهي وقته يخسر الجولة.
A real song plays in short slices: 3 seconds, then 5 more, then the rest.|Ein echter Song in kurzen Stücken: 3 Sekunden, dann 5 weitere, dann der Rest.|Une vraie chanson par petits bouts : 3 secondes, puis 5, puis le reste.|أغنية حقيقية على مقاطع: ٣ ثوانٍ ثم ٥ ثم الباقي.
Solo: keep the streak going. Two players: take turns, five each.|Allein: die Serie halten. Zu zweit: abwechselnd, je fünf.|En solo : garde la série. À deux : chacun son tour, cinq chacun.|وحدك: حافظ على السلسلة. لاعبان: بالتناوب، خمسة لكل منهما.
Buzz in whenever you think you know it. The sooner you are right, the more you score (up to 1,000); a wrong guess costs 150.|Buzzer, sobald du es zu wissen glaubst. Je früher richtig, desto mehr Punkte (bis 1.000); falsch kostet 150.|Buzze dès que tu penses savoir. Plus tu trouves tôt, plus tu marques (jusqu'à 1 000) ; une erreur coûte 150.|اضغط متى ظننت أنك تعرف. كلما أسرعت بالصواب زادت نقاطك (حتى ١٠٠٠)، والخطأ يكلف ١٥٠.
Facts come from Wikidata (CC0), ballknowledge's football data and other credited sources. Some pictures are freely licensed; many belong to their owners and are shown with credit.|Fakten aus Wikidata (CC0), den Fußballdaten von ballknowledge und weiteren genannten Quellen. Manche Bilder sind frei lizenziert; viele gehören ihren Inhabern und werden mit Quellenangabe gezeigt.|Les faits viennent de Wikidata (CC0), des données de ballknowledge et d'autres sources citées. Certaines images sont libres ; beaucoup appartiennent à leurs auteurs et sont créditées.|المعلومات من ويكي بيانات وبيانات ballknowledge ومصادر أخرى مذكورة. بعض الصور حرة الترخيص، وكثير منها ملك لأصحابها وتُعرض مع ذكرهم.
Picture sources and removal requests|Bildquellen und Löschanfragen|Sources des images et demandes de retrait|مصادر الصور وطلبات الإزالة
. An independent student project, not affiliated with anyone shown.|. Ein unabhängiges Studentenprojekt ohne Verbindung zu den Gezeigten.|. Un projet étudiant indépendant, sans lien avec les personnes montrées.|. مشروع طلابي مستقل لا علاقة له بمن يظهر فيه.
Daily missions|Tagesmissionen|Missions du jour|مهام اليوم
Weekly chest|Wochentruhe|Coffre de la semaine|صندوق الأسبوع
Play in 3 different categories|Spiele in 3 verschiedenen Kategorien|Joue dans 3 catégories|العب في ٣ فئات مختلفة
Try a game you've never played|Probier ein neues Spiel|Essaie un jeu jamais joué|جرّب لعبة لم تلعبها
Answer 10 questions in any game|Beantworte 10 Fragen in beliebigen Spielen|Réponds à 10 questions|أجب عن ١٠ أسئلة في أي لعبة
All three: +100 XP. New missions every day.|Alle drei: +100 XP. Jeden Tag neue Missionen.|Les trois : +100 XP. De nouvelles missions chaque jour.|الثلاث: ‎+100 XP. مهام جديدة كل يوم.
done|erledigt|fait|تم
Redemption round|Revanche-Runde|La revanche|جولة التعويض
Play|Spielen|Jouer|العب
Play →|Spielen →|Jouer →|العب ←
Continue playing|Weiterspielen|Reprendre|تابع اللعب
Daily challenges|Tagesaufgaben|Défis du jour|تحديات اليوم
The same five rounds for everyone today, one per category. Come back tomorrow for new ones.|Heute für alle dieselben fünf Runden, je Kategorie. Morgen gibt es neue.|Les mêmes cinq manches pour tous aujourd'hui, une par catégorie. Reviens demain.|الجولات الخمس نفسها للجميع اليوم، واحدة لكل فئة. عد غدًا لجديدة.
5 rounds · play now|5 Runden · jetzt spielen|5 manches · jouer|٥ جولات · العب الآن
Comeback calendar|Comeback-Kalender|Calendrier des comebacks|تقويم العودات
Releases and debut anniversaries, month by month|Veröffentlichungen und Debüt-Jubiläen, Monat für Monat|Sorties et anniversaires de débuts, mois par mois|الإصدارات وذكرى الانطلاق شهرًا بشهر
For you|Für dich|Pour toi|لك
Picked from what you play.|Passend zu dem, was du spielst.|Choisi selon tes parties.|مختارة حسب ما تلعب.
Try something different|Mal was anderes|Essaie autre chose|جرّب شيئًا مختلفًا
Idols, groups, songs, fandoms|Idols, Gruppen, Songs, Fandoms|Idoles, groupes, chansons, fandoms|النجوم والفرق والأغاني والجماهير
Five leagues, real data|Fünf Ligen, echte Daten|Cinq championnats, vraies données|خمسة دوريات وبيانات حقيقية
25 seasons of the NBA|25 NBA-Saisons|25 saisons de NBA|٢٥ موسمًا من دوري NBA
Grandmasters and openings|Großmeister und Eröffnungen|Grands maîtres et ouvertures|الأساتذة الكبار والافتتاحيات
Flags, capitals, countries|Flaggen, Hauptstädte, Länder|Drapeaux, capitales, pays|الأعلام والعواصم والدول
Events, inventions, empires, people|Ereignisse, Erfindungen, Reiche, Menschen|Événements, inventions, empires, personnages|الأحداث والاختراعات والإمبراطوريات والشخصيات
Science, history, film, sport and more|Wissenschaft, Geschichte, Film, Sport und mehr|Sciences, histoire, cinéma, sport et plus|العلوم والتاريخ والسينما والرياضة وأكثر
Series, studios, creators|Serien, Studios, Schöpfer|Séries, studios, créateurs|المسلسلات والاستوديوهات والمبدعون
Dishes of the world|Gerichte der Welt|Plats du monde|أطباق العالم
The current generation: 4th and 5th gen groups plus TWICE, BLACKPINK, BTS and IZ*ONE, with their idols, songs from 2022 on (every era for TWICE, BLACKPINK, BTS and IZ*ONE), album covers and song previews.|Die aktuelle Generation: Gruppen der 4. und 5. Generation plus TWICE, BLACKPINK, BTS und IZ*ONE, mit Idols, Songs ab 2022 (bei diesen vier aus allen Phasen), Covern und Hörproben.|La génération actuelle : les groupes des 4e et 5e générations plus TWICE, BLACKPINK, BTS et IZ*ONE, avec leurs idoles, les chansons depuis 2022 (toutes les époques pour ces quatre), pochettes et extraits.|الجيل الحالي: فرق الجيلين الرابع والخامس إضافة إلى TWICE وBLACKPINK وBTS وIZ*ONE، مع نجومها وأغانيها منذ ٢٠٢٢ (وكل المراحل لهذه الأربع) وأغلفة الألبومات ومقاطع الأغاني.
Players, careers, crests and market values from ballknowledge's real data.|Spieler, Karrieren, Wappen und Marktwerte aus den echten Daten von ballknowledge.|Joueurs, carrières, écussons et valeurs marchandes issus des données de ballknowledge.|اللاعبون ومسيراتهم وشعاراتهم وقيمهم السوقية من بيانات ballknowledge الحقيقية.
Players, careers, team logos and career points from ballknowledge's basketball data.|Spieler, Karrieren, Teamlogos und Karrierepunkte aus den Basketballdaten von ballknowledge.|Joueurs, carrières, logos et points en carrière issus des données de ballknowledge.|اللاعبون ومسيراتهم وشعارات الفرق ونقاطهم من بيانات ballknowledge.
Elite players with their peak ratings, and the real openings from Lichess.|Spitzenspieler mit ihren Bestwertungen und echte Eröffnungen von Lichess.|Les meilleurs joueurs et leur record Elo, et les vraies ouvertures de Lichess.|كبار اللاعبين وأعلى تصنيفاتهم، وافتتاحيات حقيقية من Lichess.
Every sovereign country: flags, capitals, languages and populations.|Alle souveränen Staaten: Flaggen, Hauptstädte, Sprachen, Einwohner.|Tous les pays souverains : drapeaux, capitales, langues et populations.|كل الدول ذات السيادة: الأعلام والعواصم واللغات والسكان.
Wars and revolutions, world-changing inventions, the flags of countries that are gone, and the people who made it all happen.|Kriege und Revolutionen, weltverändernde Erfindungen, Flaggen verschwundener Staaten und die Menschen dahinter.|Guerres et révolutions, grandes inventions, drapeaux de pays disparus et ceux qui ont fait l'histoire.|الحروب والثورات والاختراعات التي غيّرت العالم وأعلام دول اندثرت ومن صنعوا ذلك.
Real quiz questions from Open Trivia DB, rated easy to hard. Type the answer.|Echte Quizfragen von Open Trivia DB, von leicht bis schwer. Tippe die Antwort.|De vraies questions d'Open Trivia DB, de facile à difficile. Tape la réponse.|أسئلة حقيقية من Open Trivia DB من السهل إلى الصعب. اكتب الإجابة.
The most famous anime series from Wikidata: year, studio, episodes and the manga behind them.|Die bekanntesten Anime-Serien laut Wikidata: Jahr, Studio, Folgen und Manga-Vorlage.|Les anime les plus connus d'après Wikidata : année, studio, épisodes et manga d'origine.|أشهر مسلسلات الأنمي من ويكي بيانات: السنة والاستوديو والحلقات والمانغا الأصلية.
Famous dishes, where they come from and what goes in them.|Berühmte Gerichte, ihre Herkunft und Zutaten.|Des plats célèbres, leur origine et leurs ingrédients.|أطباق شهيرة ومن أين جاءت وما مكوناتها.
Up to 10 at a time. Get one right and it returns later, then retires.|Höchstens 10 auf einmal. Richtig beantwortet kommt sie später wieder und verschwindet dann.|Jusqu'à 10 à la fois. Bien répondue, elle revient plus tard puis disparaît.|حتى ١٠ في المرة. إن أجبت صوابًا يعود السؤال لاحقًا ثم يختفي.
Leaderboard|Bestenliste|Classement|لوحة الصدارة
Today|Heute|Aujourd'hui|اليوم
This week|Diese Woche|Cette semaine|هذا الأسبوع
All time|Insgesamt|Depuis toujours|كل الأوقات
Loading…|Lädt…|Chargement…|جارٍ التحميل…
Your best runs|Deine besten Läufe|Tes meilleures séries|أفضل محاولاتك
Play a solo run to set your first score.|Spiel eine Solorunde für deinen ersten Eintrag.|Joue en solo pour poser ton premier score.|العب جولة فردية لتسجل أول نتيجة.
Open|Öffnen|Ouvrir|فتح`;
const I18N_LANGS = [["en", "English"], ["de", "Deutsch"], ["fr", "Français"], ["ar", "العربية"]];
/* wording with a number or a name in it */
const I18N_PATTERNS = [
  [/^(\d+)\/(\d+) done$/, "$1/$2 erledigt", "$1/$2 faits", "تم $1/$2"],
  [/^(\d+) questions? you missed (?:is|are) back$/, "$1 verpasste Fragen sind zurück", "$1 questions manquées reviennent", "عادت $1 من الأسئلة الفائتة"],
  [/^(\d+) games$/, "$1 Spiele", "$1 jeux", "$1 لعبة"],
  [/^(\d+) rounds$/, "$1 Runden", "$1 manches", "$1 جولات"],
  [/^Round (\d+) of (\d+)(.*)$/, "Runde $1 von $2$3", "Manche $1 sur $2$3", "الجولة $1 من $2$3"],
  [/^Question (\d+) of (\d+)(.*)$/, "Frage $1 von $2$3", "Question $1 sur $2$3", "السؤال $1 من $2$3"],
  [/^Your best: ([\d.,\s]+) pts · streak (\d+)$/, "Dein Rekord: $1 Punkte · Serie $2", "Ton record : $1 pts · série $2", "أفضل نتيجة: $1 نقطة · سلسلة $2"],
  [/^Hint (\d+)(.*)$/, "Hinweis $1$2", "Indice $1$2", "تلميح $1$2"],
  [/^(\d+) games in (.+)\. Every one works solo, on one device with a friend, or on two devices\.$/, "$1 Spiele in $2. Jedes geht allein, zu zweit an einem Gerät oder an zwei Geräten.", "$1 jeux dans $2. Tous se jouent seul, à deux sur un appareil ou sur deux.", "$1 لعبة في $2. كلها تُلعب وحدك أو مع صديق على جهاز أو جهازين."],
  [/^(.+) wins!$/, "$1 gewinnt!", "$1 gagne !", "الفائز: $1"],
  [/^(\d+) of (\d+) right · best streak (\d+)$/, "$1 von $2 richtig · beste Serie $3", "$1 bonnes sur $2 · meilleure série $3", "$1 صحيحة من $2 · أفضل سلسلة $3"],
];
const lang = () => { try { const l = localStorage.getItem("gp_lang"); return ["de", "fr", "ar"].includes(l) ? l : "en"; } catch (e) { return "en"; } };
const I18N_AT = { de: 1, fr: 2, ar: 3 };
const I18N_KEEP = ".sugs, .clue b, .schint b, .rcard h3, .wp-card, .wcard, .wchip, .holside, .mbubble, .finskbub, .pboard, .pcard, .oddq + .facerow, .mixstrip, .disco, textarea, script, style";
const I18N = {
  map: null, long: [], at: 0,
  load() {
    this.at = I18N_AT[lang()]; if (!this.at) return false;
    this.map = new Map(I18N_ROWS.trim().split("\n").map((r) => r.split("|")).filter((c) => c.length === 4).map((c) => [c[0], c[this.at]]));
    this.long = [...this.map.keys()].filter((k) => k.length >= 28).sort((a, b) => b.length - a.length);
    return true;
  },
  text(t) {
    const core = t.trim(); if (!core) return null;
    let to = this.map.get(core);
    if (to == null) for (const [re, ...out] of I18N_PATTERNS) if (re.test(core)) { to = core.replace(re, out[this.at - 1]); break; }
    if (to == null && /^[A-Z0-9 '→-]+$/.test(core)) { const k = [...this.map.keys()].find((x) => x.toUpperCase() === core); if (k) to = this.map.get(k); }
    if (to == null && core.length >= 28) { let s = core; this.long.forEach((k) => { if (s.includes(k)) s = s.split(k).join(this.map.get(k)); }); if (s !== core) to = s; }
    return to == null || to === core ? null : t.replace(core, () => to);
  },
  walk(root) {
    if (root.nodeType === 3) { const p = root.parentElement; if (!p || p.closest(I18N_KEEP)) return; const v = this.text(root.nodeValue); if (v != null) root.nodeValue = v; return; }
    if (root.nodeType !== 1 || root.closest(I18N_KEEP)) return;
    for (const a of ["placeholder", "title", "aria-label"]) { const v = root.getAttribute(a); if (v) { const t = this.text(v); if (t != null) root.setAttribute(a, t); } }
    root.childNodes.forEach((n) => this.walk(n));
  },
  start() {
    if (!this.load()) return;
    const L = lang(), d = document.documentElement; d.lang = L; d.dir = L === "ar" ? "rtl" : "ltr";
    this.walk(document.body);
    new MutationObserver((list) => list.forEach((m) => { if (m.type === "characterData") this.walk(m.target); else m.addedNodes.forEach((n) => this.walk(n)); })).observe(document.body, { subtree: true, childList: true, characterData: true });
  },
};
{ const set0 = renderSettings; renderSettings = function () {
  const out = set0.apply(this, arguments), L = lang();
  $("#setRoom").insertAdjacentHTML("beforeend", `<div class="card" style="margin-top:12px"><div class="label">Language</div><div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap">${I18N_LANGS.map(([c, n]) => `<button class="chip" type="button" data-lang="${c}" aria-pressed="${L === c}">${n}</button>`).join("")}</div><p class="fine">Menus, game names and instructions are translated. Questions, answers and sidekick voices stay in English. A first draft that no native speaker has checked yet.</p></div>`);
  return out;
}; }
document.addEventListener("click", (e) => { const t = e.target.closest("button[data-lang]"); if (!t) return; try { localStorage.setItem("gp_lang", t.dataset.lang); } catch (x) { /* blocked */ } location.reload(); });
I18N.start();
