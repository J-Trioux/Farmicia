import assert from 'node:assert/strict';
import {
  act,
  basePrice,
  canProduceQuality,
  cookingProbabilities,
  cropMastery,
  CROPS,
  defaultIngredients,
  fresh,
  fulfillment,
  growTime,
  harvestProbabilities,
  level,
  LEVEL_XP,
  marketEvent,
  masteryGain,
  maxPlots,
  order,
  RECIPES,
  recipeLock,
  restore,
  SPECIALIZATIONS,
  upgradeCost,
  type Game,
} from '../lib/game.ts';

const t = 1_000_000;
const lowRoll = () => 0;
const highRoll = () => 0.999;

// Nouvelle partie : boucle immédiate et première extension bien avant deux minutes.
let g = fresh(t);
for (let i = 0; i < 6; i++)
  g = act(g, 'plant', { index: i, crop: 'radis' }, t).g;
const originalEnd = g.plots[0]!.end;
g = act(g, 'water', 0, t + 1_000).g;
assert.equal(g.plots[0]!.end, originalEnd, 'arroser ne doit plus accélérer');
for (let i = 0; i < 6; i++) g = act(g, 'harvest', i, t + 31_000, lowRoll).g;
assert.equal(g.stock.radis, 6);
g = act(g, 'sell', 'radis', t + 32_000).g;
assert.ok(g.coins >= 55);
g = act(g, 'upgrade', 'expand', t + 33_000).g;
assert.equal(g.plots.length, 9);
assert.equal(upgradeCost(g, 'expand'), 70);
assert.equal(maxPlots(g), 9);

// Les douze niveaux débloquent les cultures dans l’ordre attendu.
assert.equal(LEVEL_XP.length, 12);
assert.deepEqual(
  CROPS.map((crop) => [crop.id, crop.level]),
  [
    ['radis', 1],
    ['carotte', 1],
    ['ble', 3],
    ['salade', 2],
    ['tomate', 4],
    ['fraise', 5],
    ['mais', 6],
    ['aubergine', 7],
    ['myrtille', 8],
    ['citrouille', 9],
    ['raisin', 10],
    ['melon', 11],
  ],
);

// Un passage de niveau offre la nouvelle graine et la place dans la commande suivante.
let leveler: Game = {
  ...fresh(t),
  xp: LEVEL_XP[1] - 2,
  seeds: { radis: 1 },
};
leveler = act(leveler, 'plant', { index: 0, crop: 'radis' }, t).g;
const levelResult = act(leveler, 'harvest', 0, t + 31_000, lowRoll);
leveler = levelResult.g;
assert.equal(level(leveler), 2);
assert.equal(levelResult.levelUp?.level, 2);
assert.equal(levelResult.levelUp?.crop, 'salade');
assert.equal(leveler.seeds.salade, 1);
assert.equal(order(leveler).crop.split('|')[0], 'salade');

// Les cultures longues rapportent davantage d’XP, de valeur et de maîtrise.
assert.ok(CROPS.at(-1)!.xp > CROPS[0].xp * 20);
assert.ok(CROPS.at(-1)!.price > CROPS[0].price * 40);
assert.ok(masteryGain('melon') > masteryGain('radis'));

// Maîtrise en points et trois spécialisations.
let specialist: Game = { ...fresh(t), coins: 500, cropXP: { radis: 59 } };
specialist.seeds.radis = 1;
specialist = act(specialist, 'plant', { index: 0, crop: 'radis' }, t).g;
specialist = act(specialist, 'harvest', 0, t + 31_000, lowRoll).g;
assert.equal(cropMastery(specialist, 'radis'), 3);
for (const specialization of SPECIALIZATIONS) {
  const before = growTime(specialist, 'radis');
  specialist = act(
    specialist,
    'specialize',
    { crop: 'radis', specialization: specialization.id },
    t,
  ).g;
  assert.equal(specialist.specializations.radis, specialization.id);
  if (specialization.id === 'precoce')
    assert.ok(growTime(specialist, 'radis') < before);
}

// Qualités, arrosage manuel et arrosage groupé.
const dry = harvestProbabilities(fresh(t), 'radis', false);
const wet = harvestProbabilities(fresh(t), 'radis', true);
assert.ok(wet[1] + wet[2] > dry[1] + dry[2]);
let watered = { ...fresh(t), xp: LEVEL_XP[2], upgrades: ['watering-can'] };
watered = act(watered, 'plant', { index: 0, crop: 'radis' }, t).g;
watered = act(watered, 'plant', { index: 1, crop: 'carotte' }, t).g;
watered = act(watered, 'waterAll', null, t + 1).g;
assert.ok(watered.plots[0]?.watered && watered.plots[1]?.watered);
watered = act(watered, 'harvest', 0, t + 31_000, highRoll).g;
assert.equal(watered.stock['radis|exceptionnelle'], 1);

// Atelier : ingrédients de plusieurs qualités, bénéfice rustique et talents choisis.
let chef: Game = {
  ...fresh(t),
  xp: LEVEL_XP[7],
  coins: 100_000,
  upgrades: ['workshop'],
  stock: {
    ble: 20,
    'ble|belle': 20,
    'ble|exceptionnelle': 20,
    fraise: 20,
    tomate: 20,
    carotte: 20,
    aubergine: 20,
    myrtille: 20,
  },
};
const pain = RECIPES.find((recipe) => recipe.id === 'pain')!;
const ordinary = cookingProbabilities(chef, 'pain', ['ble', 'ble', 'ble']);
const exceptional = cookingProbabilities(chef, 'pain', [
  'ble|exceptionnelle',
  'ble|exceptionnelle',
  'ble|exceptionnelle',
]);
assert.ok(exceptional[2] + exceptional[3] > ordinary[2] + ordinary[3]);
for (let cooked = 0; cooked < 3; cooked++) {
  const ingredients =
    cooked === 0
      ? ['ble', 'ble|belle', 'ble|exceptionnelle']
      : defaultIngredients(chef, pain);
  chef = act(chef, 'craft', { id: 'pain', ingredients }, t, lowRoll).g;
  const ingredientValue = chef.job!.ingredientValue!;
  chef = act(chef, 'collect', null, t + 1_000_000, lowRoll).g;
  const produced = Object.keys(chef.stock).find(
    (id) => id.startsWith('pain|rustique|') && chef.stock[id] > 0,
  )!;
  assert.ok(basePrice(produced) >= ingredientValue + 5);
}
assert.equal(chef.talentPoints, 1);
const luckBefore = chef.stats.luck;
chef = act(chef, 'talent', { stat: 'luck' }, t).g;
assert.equal(chef.stats.luck, luckBefore + 1);
assert.equal(chef.talentPoints, 0);

// Une qualité supérieure satisfait une demande inférieure, après confirmation.
const substitute = fulfillment({ 'carotte|exceptionnelle': 3 }, 'carotte', 2);
assert.ok(substitute.possible && substitute.usesSuperior);
let customer: Game = {
  ...fresh(t),
  stock: { 'carotte|exceptionnelle': 10 },
  pendingCrop: 'carotte',
};
assert.equal(act(customer, 'order', null, t).g, customer);
customer = act(customer, 'order', { confirmSuperior: true }, t).g;
assert.equal(customer.orders, 1);

// Aucun événement inaccessible : au début, seules les cultures peuvent être ciblées.
const beginner = fresh(t);
for (let cycle = 0; cycle < 8; cycle++) {
  const event = marketEvent(beginner, t + cycle * 1_200_000);
  assert.equal(event.mode, 0);
  assert.ok(CROPS.some((crop) => crop.id === event.target && crop.level === 1));
}
assert.equal(canProduceQuality(beginner, 'belle'), false);
assert.equal(recipeLock(beginner, pain), 'Niveau 4');

// Sauvegardes v1 et v2 migrées, sauvegarde v3 conservée, absence sans perte.
for (const version of [1, 2] as const) {
  const legacy = { ...fresh(t), version, cropXP: { radis: 10 } };
  const migrated = restore(JSON.stringify(legacy));
  assert.equal(migrated.version, 3);
  assert.ok(migrated.cropXP.radis >= 10);
}
assert.equal(restore(JSON.stringify(fresh(t))).version, 3);
assert.equal(restore('invalide').version, 3);
let absent = fresh(t);
absent = act(absent, 'plant', { index: 0, crop: 'radis' }, t).g;
absent = restore(JSON.stringify(absent));
absent = act(absent, 'harvest', 0, t + 365 * 86_400_000, lowRoll).g;
assert.equal(absent.stock.radis, 1);

console.log(
  'OK 0.2.1: extension, 12 niveaux, graines offertes, maîtrise, spécialisations, qualités, arrosage, cuisine, talents, substitutions, marché, migrations et absence.',
);
