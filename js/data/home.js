// Nana & Papi's house (assets/bg/bg_hub_wide.webp). Coordinates are fractions of the picture:
// ix = 0..1 left-to-right, iy = 0..1 top-to-bottom. A spot's iy is where the feet touch the floor.
// FURNITURE lists every object's left/right edge and the floor line at its front (base).
// Rule (checked by tools/doctor): anyone standing within a piece's x-range must have feet in FRONT of it
// (iy > base + 0.02), otherwise they'd look like they're inside / floating over it. Pet beds are 'bed' (pets sit in them).
export const FURNITURE = [
  { name: 'stove & counters', x0: 0.0, x1: 0.185, base: 0.885 },
  { name: 'dining table & chairs', x0: 0.2, x1: 0.37, base: 0.905 },
  { name: 'plant & lamp', x0: 0.4, x1: 0.47, base: 0.82 },
  { name: 'armchair', x0: 0.455, x1: 0.585, base: 0.83 },
  { name: 'piano & bench', x0: 0.575, x1: 0.715, base: 0.815 },
  { name: 'vanity & stool', x0: 0.715, x1: 0.835, base: 0.82 },
  { name: 'guitar & microphone', x0: 0.83, x1: 0.92, base: 0.83 },
  { name: 'pet bed 1', x0: 0.485, x1: 0.61, base: 0.985, bed: { ix: 0.548, iy: 0.935 } },
  { name: 'pet bed 2', x0: 0.725, x1: 0.85, base: 0.975, bed: { ix: 0.788, iy: 0.925 } },
];
// One spot per person, on open floor in front of the furniture
export const HOME_SPOTS = {
  papi: { ix: 0.115, iy: 0.95, anim: 'action' },   // cooking at the stove
  mom: { ix: 0.265, iy: 0.965 },                   // by the dining table
  nana: { ix: 0.395, iy: 0.95 },                   // by the window
  arlo: { ix: 0.445, iy: 0.975 },                  // middle of the room
  papa: { ix: 0.645, iy: 0.955, anim: 'action' },  // at the piano
  alyzee: { ix: 0.688, iy: 0.96 },                  // by the vanity mirror
  eveah: { ix: 0.887, iy: 0.955, anim: 'action' }, // at the microphone, singing
  emery: { ix: 0.955, iy: 0.972 },                  // by the front door
};
// Pets: the first two nap in the pet beds, the rest wander the open floor at the front
export const PET_SPOTS = [[0.548, 0.935], [0.788, 0.925], [0.33, 0.985], [0.64, 0.995], [0.19, 0.985], [0.92, 0.99], [0.06, 0.99], [0.68, 0.995], [0.455, 0.995], [0.875, 0.995], [0.4, 0.995]];
