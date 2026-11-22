// Random adventure events. Effects:
// heal (fraction of max HP, negative hurts), maxHp/atk/def (fraction), xp (multiplier of a normal fight),
// coins (multiplier of a normal fight), gems, food, skill: 'common'|'legendary'|'mythic' (pick 1 of 3)
// ch: limit to certain chapters. kind: good | bad | neutral (card colour + banner)
export const EVENTS = [
  // ---------- GOOD ----------
  { id: 'poutine', kind: 'good', luck: 'Minor Win', text: 'You find a [b:poutine] stand that\'s still open. Squeaky cheese curds!', effect: { heal: 0.30 } },
  { id: 'bagel', kind: 'good', luck: 'Minor Win', text: 'A friendly baker tosses you a warm [b:sesame bagel] fresh from the wood oven.', effect: { heal: 0.2, xp: 0.5 } },
  { id: 'golden_burger', kind: 'good', luck: 'Major Win', text: 'You find a [b:golden hamburger] on a park bench... it\'s still warm?!', effect: { maxHp: 0.08 } },
  { id: 'pigeon_coins', kind: 'good', luck: 'Minor Win', text: 'A pigeon drops a shiny [b:coin pouch] at your feet. Thanks, pigeon!', effect: { coins: 3 } },
  { id: 'kata', kind: 'good', luck: 'Minor Win', text: 'You practice your [b:kung fu kata] by the river. Your fists feel faster!', effect: { atk: 0.06 } },
  { id: 'pushups', kind: 'good', luck: 'Minor Win', text: 'You do 100 karate push-ups. Okay, 40. Still counts!', effect: { atk: 0.04, xp: 0.6 } },
  { id: 'diamond', kind: 'good', luck: 'Major Win', text: 'You spot a [b:diamond] in the dirt! Minecraft must be leaking into Montreal.', effect: { gems: 8 } },
  { id: 'depanneur', kind: 'good', luck: 'Minor Win', text: 'The lady at the [b:dépanneur] gives you a free slushie. Brain freeze!', effect: { heal: 0.25 } },
  { id: 'goal', kind: 'good', luck: 'Minor Win', text: 'You find a soccer ball and score an [b:upper-corner goal] on an empty net. The crowd (one squirrel) goes wild!', effect: { xp: 1, atk: 0.03 } },
  { id: 'habs', kind: 'good', luck: 'Minor Win', text: 'A Canadiens fan yells [r:"GO HABS GO!"] from a balcony. You feel pumped!', effect: { def: 0.06, heal: 0.1 } },
  { id: 'papa_advice', kind: 'good', luck: 'Minor Win', text: 'You remember your sensei\'s advice: "Breathe first. Then strike." You feel focused.', effect: { atk: 0.05 } },
  { id: 'sprinkler', kind: 'good', luck: 'Minor Win', text: 'A lawn sprinkler turns on. It\'s basically a mini [b:water park]! You feel refreshed.', effect: { heal: 0.3 } },
  { id: 'sugar_shack', kind: 'good', luck: 'Major Win', text: 'You find a cozy [b:cabane à sucre]! You eat maple taffy on snow and rest for the night.', effect: { heal: 0.45 } },
  { id: 'chess', kind: 'good', luck: 'Minor Win', text: 'You find a [b:chess board] in a free library box and solve a puzzle in 3 moves. Big brain!', effect: { xp: 1.4 } },
  { id: 'gi_found', kind: 'good', luck: 'Minor Win', text: 'You find a [b:black belt] hanging on a fence. It doesn\'t fit, but it inspires you.', effect: { def: 0.05, atk: 0.03 } },
  { id: 'cat_cafe', kind: 'good', luck: 'Minor Win', text: 'You pass a [b:cat café]. The cats all stare at you. You feel strangely protected.', effect: { def: 0.05 } },
  { id: 'food_bag', kind: 'good', luck: 'Minor Win', text: 'You find a big bag of [b:pet food]. Your pets will love this!', effect: { food: 4 } },
  { id: 'rain', kind: 'good', luck: 'Minor Win', text: 'A light summer rain cools you down. Like a slow water slide.', effect: { heal: 0.15, xp: 0.4 } },
  { id: 'steve', kind: 'good', luck: 'Major Win', text: 'A blocky guy in a cyan shirt hands you a [b:golden apple] and walks away without a word.', effect: { maxHp: 0.06, heal: 0.2 } },

  // ---------- BAD ----------
  { id: 'lego', kind: 'bad', luck: 'Bad Luck', text: 'You step on a [r:LEGO brick] left by the minions. OUCH! The worst pain known to humans.', effect: { maxHp: -0.05 } },
  { id: 'seagull', kind: 'bad', luck: 'Bad Luck', text: 'A seagull steals your snack right out of your hand. Rude.', effect: { heal: -0.10 } },
  { id: 'cones', kind: 'bad', luck: 'Bad Luck', text: 'Montreal [r:construction cones] EVERYWHERE. You take a long detour and get tired.', effect: { heal: -0.08 } },
  { id: 'pigeon_poop', kind: 'bad', luck: 'Bad Luck', text: 'A pigeon poops on your head. Gross. You lose some confidence.', effect: { def: -0.05 } },
  { id: 'wind', kind: 'bad', luck: 'Bad Luck', text: 'A freezing Montreal wind blows down the street. BRRRR.', effect: { heal: -0.12 } },
  { id: 'pothole', kind: 'bad', luck: 'Bad Luck', text: 'You trip in a giant [r:pothole]. Montreal roads, am I right?', effect: { atk: -0.04 } },
  { id: 'kragle_puddle', kind: 'bad', luck: 'Bad Luck', text: 'You step in a puddle of [r:Kragle] glue. Your shoe is stuck for an hour!', effect: { heal: -0.06, atk: -0.03 } },

  // ---------- CHOICES ----------
  { id: 'lego_salesman', kind: 'neutral', weight: 0.8, text: 'A shady [r:LEGO salesman] in a tiny suit whispers: "Psst. Want a [p:Legendary skill]? Only costs a bit of your life..."',
    choices: [
      { label: 'Refuse', sub: '', effect: {}, result: 'You walk away. He looks disappointed in a very plastic way.' },
      { label: 'Make the deal', sub: 'Max HP -12%', effect: { maxHp: -0.12, skill: 'legendary' }, result: 'He snaps his fingers. You feel POWERFUL.' },
    ] },
  { id: 'raccoon', kind: 'neutral', weight: 0.9, text: 'A wise old [b:raccoon] from Mount Royal offers to teach you a secret move. "Every lesson has a price, young one."',
    choices: [
      { label: 'Give life', sub: 'Max HP -7%', effect: { maxHp: -0.07, skill: 'common' }, result: 'The raccoon teaches you something cool.' },
      { label: 'Give power', sub: 'ATK -7%', effect: { atk: -0.07, skill: 'common' }, result: 'The raccoon teaches you something cool.' },
    ] },
  { id: 'mcdonalds', kind: 'neutral', weight: 1, text: 'The golden arches glow in the distance. It\'s a [b:McDonald\'s]! Your stomach growls.',
    choices: [
      { label: 'Big Mac', sub: '30 coins: Heal 50%', cost: 30, effect: { heal: 0.5 }, result: 'Two all-beef patties, special sauce... You feel AMAZING.' },
      { label: 'Happy Meal', sub: '45 coins: a skill!', cost: 45, effect: { skill: 'common' }, result: 'There\'s a toy inside! It\'s... a new skill!' },
    ] },
  { id: 'pinball', kind: 'neutral', weight: 1.1, special: 'pinball', text: 'In an old arcade, a [p:pinball machine] is blinking and dinging all by itself. The high score is... President Business. Not for long.',
    choices: [
      { label: 'Skip', sub: '', effect: {}, result: 'You walk past. The machine looks sad.' },
      { label: 'PLAY!', sub: 'Score = skills', special: 'pinball' },
    ] },
  { id: 'board_game', kind: 'neutral', weight: 1, special: 'dice', text: 'You remember [b:family board game night]. You find a giant pair of dice on the sidewalk. Roll them?',
    choices: [
      { label: 'Skip', sub: '', effect: {}, result: 'Maybe next game night.' },
      { label: 'Roll!', sub: 'Anything can happen', special: 'dice' },
    ] },
  { id: 'obby', kind: 'neutral', weight: 0.9, special: 'obby', text: 'A floating [b:obby] appears out of nowhere, with a sign: "Beat my obby for gems!"',
    choices: [
      { label: 'Skip', sub: '', effect: {}, result: 'You skip the obby. Smart. Or scared?' },
      { label: 'Try it', sub: '65% win gems, or OOF', special: 'obby' },
    ] },
  { id: 'penalty', kind: 'neutral', weight: 0.9, special: 'penalty', text: 'A Zombie goalie blocks a soccer net. "Score on me and you get a prize," it groans.',
    choices: [
      { label: 'Shoot LEFT', sub: '⚽', special: 'penalty' },
      { label: 'Shoot RIGHT', sub: '⚽', special: 'penalty' },
    ] },
  { id: 'crossing_guard', kind: 'neutral', weight: 1, text: 'A friendly [b:crossing guard] with a stop sign waves you over. "You look like you need help, kiddo."',
    choices: [
      { label: 'Heal me', sub: 'Heal 40%', effect: { heal: 0.4 }, result: 'She gives you a juice box and a granola bar. Better!' },
      { label: 'Teach me', sub: 'Learn a skill', effect: { skill: 'common' }, result: 'She teaches you a move she learned in the 80s.' },
    ] },
  { id: 'fountain', kind: 'neutral', weight: 0.8, text: 'You find a [b:wishing fountain] in Old Montreal. Toss in some coins?',
    choices: [
      { label: 'Keep coins', sub: '', effect: {}, result: 'You keep your coins. Wishes are for babies. (Just kidding.)' },
      { label: 'Toss 25 coins', sub: '?', cost: 25, effect: { random: [{ heal: 0.5 }, { maxHp: 0.08 }, { atk: 0.08 }, { gems: 10 }] }, result: 'The fountain sparkles!' },
    ] },
  { id: 'potion', kind: 'neutral', weight: 0.8, text: 'One of [r:Malgosha\'s] spies left a strange bubbling potion on a bench.',
    choices: [
      { label: 'Leave it', sub: '', effect: {}, result: 'Probably smart.' },
      { label: 'Drink it', sub: '50/50...', effect: { random: [{ atk: 0.12 }, { maxHp: 0.10 }, { heal: -0.2 }, { def: -0.08 }] }, result: 'Glug glug glug...' },
    ] },
  { id: 'gym', kind: 'neutral', weight: 0.7, text: 'You find a [b:dojo] with the door open. The sensei is gone, but the training dummies are still there.',
    choices: [
      { label: 'Train hard', sub: 'HP -15%, ATK +10%', effect: { heal: -0.15, atk: 0.10 }, result: 'You punch the dummies until they cry. ATK up!' },
      { label: 'Meditate', sub: 'Heal 25%, DEF +4%', effect: { heal: 0.25, def: 0.04 }, result: 'Ommmmm. You feel calm and strong.' },
    ] },
];

// short "nothing happens" days so the walk feels like a journey
export const WALK_TEXTS = [
  'You keep walking. Montreal is weirdly quiet without people.',
  'You walk past a giant Lego wall that says [r:"PROPERTY OF PRESIDENT BUSINESS"]. Rude.',
  'A squirrel follows you for a while. Then it gets bored.',
  'You hum your favourite song and keep going. Absolute cinema.',
  'You find a poster of yourself that says [r:WANTED: ARLO]. They spelled it right at least.',
];
