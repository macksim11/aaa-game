// Chapters. mult scales every enemy in the chapter. Add new chapters at the end;
// saves only store chapter ids, so adding chapters never breaks progress.
export const CHAPTERS = [
  {
    id: 1, name: 'Pierrefonds Riverside', short: 'Riverside', theme: 'river', days: 30, mult: 1.0,
    enemies: ['zombie', 'slime', 'spider', 'baby_zombie', 'creeper'], elite: 'zombie_brute', boss: 'king_creeper',
    rescueFamily: 'mom', pets: [{ id: 'twyla', day: 14, guard: 'zombie', text: 'You hear happy barking! [p:Twyla] is tied to a tree by two Zombies!' }],
    reward: { coins: 800, gems: 50, mount: 'bike', gear: 1 },
    start: 'You walk along the [b:Rivière des Prairies], past Boulevard Gouin. The minions dragged Mom this way...',
    bossText: 'Behind a pile of TNT, you see a cage. [p:Mom] is inside!',
  },
  {
    id: 2, name: 'Île-Bizard Bridge', short: 'The Bridge', theme: 'bridge', days: 35, mult: 1.9,
    enemies: ['skeleton', 'zombie', 'spider', 'micro_manager', 'creeper', 'slime'], elite: 'iron_golem', boss: 'skeleton_general',
    rescueFamily: 'papa', pets: [
      { id: 'lenny', day: 11, guard: 'skeleton', text: 'A fancy black-and-white floof is stuck in a Lego cage! It\'s [p:Lenny]!' },
      { id: 'goose', day: 25, guard: 'micro_manager', text: 'Something tiny is hiding under the bridge, shaking... it\'s [p:Goose]! A Micro Manager is guarding her.' },
    ],
    reward: { coins: 1500, gems: 80, mount: 'horse', gear: 2 },
    start: 'The [b:Île-Bizard bridge] is crawling with skeletons. Papa must be on the other side!',
    bossText: 'At the middle of the bridge, the Skeleton General stands guard over [p:Papa]!',
  },
  {
    id: 3, name: 'Mount Royal', short: 'Mount Royal', theme: 'mountain', days: 40, mult: 3.5,
    enemies: ['enderman', 'pillager', 'spider', 'creeper', 'witch', 'skeleton'], elite: 'witch', boss: 'ender_king',
    rescueFamily: 'alyzee', pets: [{ id: 'marah', day: 19, guard: 'pillager', text: 'A round, fluffy loaf is sitting in a Pillager\'s camp. It\'s [p:Marah]! She looks very chill about it.' }],
    reward: { coins: 2500, gems: 120, mount: 'hippo', gear: 2 },
    start: 'You climb [b:Mount Royal]. The big cross on top is glowing purple... that\'s not normal.',
    bossText: 'At the lookout, the Ender King is holding [p:Alyzée] up in the air!',
  },
  {
    id: 4, name: 'Metro Tunnels', short: 'The Metro', theme: 'metro', days: 40, mult: 6.2,
    enemies: ['silverfish', 'cave_spider', 'zombie', 'skeleton', 'micro_manager', 'creeper'], elite: 'iron_golem', boss: 'warden',
    rescueFamily: 'eveah', pets: [{ id: 'tobi', day: 17, guard: 'cave_spider', text: 'Two big curious ears peek out from a metro wagon. It\'s [p:Tobi]! He\'s sniffing a Cave Spider...' }],
    reward: { coins: 4000, gems: 160, mount: 'ebike', gear: 3 },
    start: 'The [b:Montreal Metro] has been taken over! The trains are full of Minecraft mobs.',
    bossText: 'Deep in the dark tunnel you hear singing. It\'s [p:Évéah]! But something BIG is listening...',
  },
  {
    id: 5, name: 'Olympic Stadium', short: 'The Stadium', theme: 'stadium', days: 45, mult: 10.5,
    enemies: ['micro_manager', 'pillager', 'skeleton', 'vindicator', 'creeper', 'enderman'], elite: 'iron_golem', boss: 'bad_cop',
    rescueFamily: 'emery', pets: [{ id: 'zuko', day: 21, guard: 'vindicator', text: 'A blur zooms around the soccer field. It\'s [p:Zuko]! A Vindicator is chasing him!' }],
    reward: { coins: 6000, gems: 250, mount: 'car', gear: 3 },
    start: 'The [b:Olympic Stadium] tower is now President Business\'s prison. Emery is locked at the very top.',
    bossText: 'Bad Cop stands in front of the tallest cage you\'ve ever seen. Inside: [p:Emery], all 6 feet 9 inches of him.',
  },
  {
    id: 6, name: 'Terry Fox School', short: 'School', theme: 'school', days: 45, mult: 17,
    enemies: ['zombie', 'baby_zombie', 'skeleton', 'micro_manager', 'witch', 'slime'], elite: 'iron_golem', boss: 'toasty',
    reward: { coins: 9000, gems: 300, mount: 'golfcart', gear: 3 },
    start: 'Your school, [b:Terry Fox], has been taken over! The hallways are full of mobs.',
    bossText: 'In the gym, [r:Toasty] sits on a throne made of lunch trays.',
    freeText: 'Terry Fox School is FREE! Recess is back on!',
  },
  {
    id: 7, name: 'The Water Park', short: 'Water Park', theme: 'waterpark', days: 50, mult: 27,
    enemies: ['drowned', 'guardian', 'slime', 'zombie', 'skeleton'], elite: 'witch', boss: 'elder_guardian',
    reward: { coins: 13000, gems: 350, gear: 4 },
    start: 'President Business KNEW you love water parks. So he took one over. Big mistake.',
    bossText: 'At the top of the biggest slide waits the [r:Elder Guardian].',
    freeText: 'The water park is open again! Slides for everyone!',
  },
  {
    id: 8, name: 'La Ronde', short: 'La Ronde', theme: 'laronde', days: 50, mult: 42,
    enemies: ['blaze', 'magma_cube', 'piglin', 'skeleton', 'creeper'], elite: 'vindicator', boss: 'ghast',
    reward: { coins: 18000, gems: 400, gear: 4 },
    start: 'Malgosha turned [b:La Ronde] into a piece of the Nether. The roller coasters are on fire!',
    bossText: 'A [r:Ghast] the size of a house floats over the Ferris wheel.',
    freeText: 'La Ronde is saved! The rides are spinning again!',
  },
  {
    id: 9, name: 'Nether Fortress', short: 'Fortress', theme: 'nether', days: 55, mult: 65,
    enemies: ['wither_skel', 'blaze', 'piglin', 'magma_cube', 'vindicator'], elite: 'iron_golem', boss: 'malgosha',
    reward: { coins: 26000, gems: 500, gear: 5 },
    start: 'You and Emery step through a Nether portal under the Jacques Cartier bridge...',
    bossText: '[r:Malgosha] waits on her throne with the Staff of Dominance glowing.',
    freeText: 'Malgosha is defeated! The Orb of Dominance shatters!',
  },
  {
    id: 10, name: 'Business Tower', short: 'The Tower', theme: 'tower', days: 60, mult: 100,
    enemies: ['micro_manager', 'vindicator', 'wither_skel', 'enderman', 'pillager', 'iron_golem'], elite: 'iron_golem', boss: 'president_business',
    reward: { coins: 40000, gems: 1000, gear: 5, house: true },
    start: 'Downtown Montreal. The tallest tower now says [r:BUSINESS] at the top. Your house is up there, on a shelf.',
    bossText: 'The top floor. [r:President Business] stands next to the Kragle... and your Lego house in a glass case.',
    freeText: 'YOU DID IT! Montreal is free and your house is back to normal size!',
  },
];
export const BOSS_HP = 10, BOSS_ATK = 1.9, ELITE_HP = 4.0, ELITE_ATK = 1.6;
export function chapterById(id) { return CHAPTERS.find(c => c.id === id); }
