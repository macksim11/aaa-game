// Comic-book style story player: illustrated slides + pop-in speech bubbles / narration boxes.
import { el } from '../util.js';
import { sfx, playMusic } from '../audio.js';

// Each slide: img (assets/story/<img>.webp), pan (zoom drift), and beats shown one per tap.
// beat: { say: 'text', who: 'Name', x, y (0-1 position of bubble), tail: 'left'|'right'|'down' } or { box: 'narration', pos: 'top'|'bottom' }
export const INTRO = [
  { img: 's01_lego_world', pan: [1.0, 1.08, 0.5, 0.45], beats: [
    { box: 'Far, far away... in a world made ENTIRELY of LEGO bricks...', pos: 'top' },
    { say: 'Everything is AWESOME... when it belongs to ME!', who: 'President Business', x: 0.5, y: 0.34, tail: 'down' } ] },
  { img: 's02_portal', pan: [1.12, 1.0, 0.5, 0.5], beats: [
    { say: 'This LEGO world is too SMALL! I need a REAL city to glue in place with my KRAGLE!', who: 'President Business', x: 0.42, y: 0.16, tail: 'down' },
    { box: 'So he jumped through a portal... and escaped!', pos: 'bottom' } ] },
  { img: 's03_montreal', pan: [1.0, 1.1, 0.55, 0.4], beats: [
    { box: 'He landed right in the middle of MONTREAL.', pos: 'top' },
    { say: 'MWAHAHA! Montreal is MINE!', who: 'President Business', x: 0.5, y: 0.3, tail: 'down' } ] },
  { img: 's04_malgosha', pan: [1.05, 1.15, 0.6, 0.4], beats: [
    { say: 'My lord... the Orb of Dominance shows ONE person who could ruin everything...', who: 'Malgosha', x: 0.32, y: 0.16, tail: 'down' },
    { say: 'A boy. His name is... ARLO.', who: 'Malgosha', x: 0.6, y: 0.82, tail: 'up' } ] },
  { img: 's05_army', pan: [1.1, 1.0, 0.5, 0.5], beats: [
    { say: 'A KID?! Ha! Minions! Take his family. Take his pets. Take his HOUSE!', who: 'President Business', x: 0.4, y: 0.15, tail: 'down' },
    { say: 'Then he’ll have NOTHING!', who: 'President Business', x: 0.62, y: 0.32, tail: 'down' } ] },
  { img: 's06_river', pan: [1.0, 1.08, 0.4, 0.55], beats: [
    { box: 'Meanwhile, by the Rivière des Prairies in Pierrefonds...', pos: 'top' },
    { say: 'Gotta go, gotta go, GOTTA GO!', who: 'Arlo', x: 0.6, y: 0.3, tail: 'down' },
    { box: 'Arlo REALLY had to pee. So he ran way down to the river, behind the big bushes.', pos: 'bottom' } ] },
  { img: 's07_attack', pan: [1.08, 1.0, 0.5, 0.5], beats: [
    { box: 'While he was gone... the minions attacked!', pos: 'top' },
    { say: 'AAAH! Monsters in the living room!', who: 'Mom', x: 0.3, y: 0.24, tail: 'down' },
    { say: 'Where’s Arlo?!', who: 'Emery', x: 0.7, y: 0.22, tail: 'down' } ] },
  { img: 's08_shrink', pan: [1.0, 1.12, 0.5, 0.5], beats: [
    { box: 'ZAP! The Kragle-ray shrank the WHOLE house into a tiny LEGO house!', pos: 'top' },
    { box: 'They took everyone. Mom, Papa, Alyzée, Évéah, Emery... and all the pets.', pos: 'bottom' } ] },
  { img: 's09_empty', pan: [1.1, 1.0, 0.45, 0.55], beats: [
    { say: '...Mom? Papa? Twyla? ...GUYS?!', who: 'Arlo', x: 0.4, y: 0.18, tail: 'down' },
    { box: 'The house was gone. All that was left... was a note.', pos: 'bottom' } ] },
  { img: 's10_note', pan: [1.0, 1.05, 0.5, 0.5], note: true, beats: [
    { box: 'The note said:', pos: 'top' },
    { note: '"Now that we’ve taken all your family, your pets AND your stuff, there’s NO WAY you could ever stop us!"\n— President Business\n(P.S. Nice try, kid.)' } ] },
  { img: 's11_determined', pan: [1.15, 1.0, 0.5, 0.4], beats: [
    { say: 'Oh... it is ON.', who: 'Arlo', x: 0.3, y: 0.15, tail: 'down' },
    { say: 'I’m rescuing EVERYONE. Then I’m taking Montreal back!', who: 'Arlo', x: 0.62, y: 0.82, tail: 'up' } ] },
  { img: 's12_nana_papi', pan: [1.0, 1.08, 0.5, 0.5], beats: [
    { box: 'Arlo ran all the way to Nana & Papi’s house. It would be his base.', pos: 'top' },
    { say: 'Then go get them back, sweetheart. We’ll be right here.', who: 'Nana', x: 0.28, y: 0.3, tail: 'down' },
    { say: 'But first... you eat!', who: 'Papi', x: 0.72, y: 0.36, tail: 'down' } ] },
  { img: 's13_title', pan: [1.08, 1.0, 0.5, 0.5], title: true, beats: [{ box: 'Absolute cinema.', pos: 'bottom' }] },
];

export const ENDING = [
  { img: 'e01_victory', pan: [1.0, 1.1, 0.5, 0.5], beats: [
    { say: 'Nooo! My KRAGLE! My beautiful plan!', who: 'President Business', x: 0.35, y: 0.3, tail: 'down' },
    { say: 'Got it! Our HOUSE!', who: 'Arlo', x: 0.62, y: 0.18, tail: 'down' } ] },
  { img: 'e02_house', pan: [1.12, 1.0, 0.5, 0.6], beats: [
    { box: 'With a flash of sparkles, the tiny LEGO house grew back to full size, right where it belonged.', pos: 'top' },
    { say: 'ABSOLUTE CINEMA!', who: 'Arlo', x: 0.5, y: 0.3, tail: 'down' } ] },
  { img: 'e03_family', pan: [1.0, 1.08, 0.5, 0.5], beats: [
    { box: 'Montreal was free. The family was home. And Papi made burgers for everyone.', pos: 'top' },
    { say: 'Our hero!', who: 'Mom', x: 0.3, y: 0.3, tail: 'down' },
    { say: 'Happy birthday, Arlo!', who: 'Everyone', x: 0.65, y: 0.24, tail: 'down' } ] },
  { img: 'e04_end', pan: [1.08, 1.0, 0.5, 0.5], beats: [
    { say: 'Not bad, little bro. Not bad at all.', who: 'Emery', x: 0.4, y: 0.2, tail: 'down' },
    { box: 'THE END... for now.', pos: 'bottom' } ] },
];

export function hasComicArt() {
  return fetch(`assets/story/${INTRO[0].img}.webp`, { method: 'HEAD' }).then(r => r.ok).catch(() => false);
}

export function playComic(slides, onDone) {
  playMusic('story');
  const stage = el('div', { class: 'comic-stage' });
  const imgA = el('img', { class: 'comic-img' }); stage.append(imgA);
  const layer = el('div', { class: 'comic-layer' }); stage.append(layer);
  const tap = el('div', { class: 'comic-tap' }, 'tap ▶');
  const skip = el('button', { class: 'btn small gray skip-btn', onclick: e => { e.stopPropagation(); finish(); } }, 'Skip ⏭');
  const dots = el('div', { class: 'comic-dots' });
  const root = el('div', { class: 'cutscene comic' }, skip, stage, dots, tap);
  document.getElementById('overlay').append(root);
  let si = 0, bi = -1, done = false, anim = null;
  slides.forEach(() => dots.append(el('i')));
  function showSlide(k) {
    si = k; bi = -1; layer.innerHTML = '';
    const s = slides[si];
    [...dots.children].forEach((d, i) => d.classList.toggle('on', i <= si));
    imgA.src = `assets/story/${s.img}.webp`;
    imgA.classList.remove('in'); void imgA.offsetWidth; imgA.classList.add('in');
    const [z0, z1, ox, oy] = s.pan || [1, 1.08, 0.5, 0.5];
    imgA.style.transformOrigin = `${ox * 100}% ${oy * 100}%`;
    anim?.cancel?.();
    anim = imgA.animate([{ transform: `scale(${z0})` }, { transform: `scale(${z1})` }], { duration: 9000, fill: 'forwards', easing: 'ease-in-out' });
    sfx('click');
    setTimeout(nextBeat, 450);
  }
  function nextBeat() {
    const s = slides[si];
    if (bi >= s.beats.length - 1) return false;
    bi++;
    const b = s.beats[bi];
    let node;
    if (b.say) {
      node = el('div', { class: `comic-bubble tail-${b.tail || 'down'}`, style: { left: (b.x * 100) + '%', top: (b.y * 100) + '%' } }, b.who ? el('div', { class: 'who' }, b.who) : null, el('div', {}, b.say));
      sfx('pet');
    } else if (b.box) {
      node = el('div', { class: `comic-box ${b.pos || 'top'}` }, b.box); sfx('step');
    } else if (b.note) {
      node = el('div', { class: 'comic-note' }, ...b.note.split('\n').map(line => el('div', {}, line))); sfx('dice');
    }
    layer.append(node);
    return true;
  }
  function advance() {
    if (done) return;
    if (nextBeat()) return;
    if (si < slides.length - 1) showSlide(si + 1); else finish();
  }
  function finish() { if (done) return; done = true; anim?.cancel?.(); root.remove(); onDone(); }
  root.addEventListener('click', advance);
  showSlide(0);
}
