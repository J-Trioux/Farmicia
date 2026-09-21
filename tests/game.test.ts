import assert from 'node:assert/strict';
import {
  act,
  fresh,
  restore,
  level,
  CROPS,
  RECIPES,
  VILLAGERS,
  OUTCOMES,
  QUALITIES,
  SPECIALIZATIONS,
  cropMastery,
  recipeMastery,
  growTime,
  cookingProbabilities,
  defaultIngredients,
  recipeLock,
  marketEvent,
  order,
  upgradeCost,
} from '../lib/game.ts';
const t = 1000000;
const lowRoll = () => 0;
let g = fresh(t);
for (let i = 0; i < 6; i++)
  g = act(g, 'plant', { index: i, crop: 'radis' }, t).g;
assert.equal(g.seeds.radis, 0);
assert.equal(act(g, 'harvest', 0, t + 1000).g, g);
g = act(g, 'water', 0, t + 1000).g;
assert.ok(g.plots[0]!.end < t + 30000);
assert.equal(act(g, 'water', 0, t + 2000).g, g);
g = restore(JSON.stringify(g));
assert.equal(g.plots.length, 6);
assert.equal(g.version, 2);
for (let i = 0; i < 6; i++) g = act(g, 'harvest', i, t + 31000, lowRoll).g;
assert.equal(g.stock.radis, 6);
assert.equal(g.harvests, 6);
assert.equal(cropMastery(g, 'radis'), 2);
g = act(g, 'sell', 'radis', t + 32000).g;
assert.equal(g.coins, 74);
g = act(g, 'upgrade', 'expand', t + 33000).g;
assert.equal(g.plots.length, 9);
assert.equal(g.coins, 39);
assert.equal(upgradeCost(g, 'expand'), 70);
g = act(g, 'mission', 'first', t + 34000).g;
assert.equal(level(g), 2);
assert.equal(g.coins, 59);
assert.equal(act(g, 'mission', 'first', t + 35000).g, g);
g = act(g, 'buy', 'ble', t + 36000).g;
assert.equal(g.seeds.ble, 1);
assert.equal(act(g, 'buy', 'melon', t + 36000).g, g);
// A mature crop survives an absence of one year.
g = act(g, 'plant', { index: 0, crop: 'ble' }, t + 37000).g;
g = restore(JSON.stringify(g));
g = act(g, 'harvest', 0, t + 365 * 86400000, lowRoll).g;
assert.equal(g.stock.ble, 1);
// Every crop can be grown. Deterministic high rolls produce exceptional quality.
let rich = { ...fresh(t), xp: 10000, coins: 100000 };
for (const c of CROPS) {
  rich = act(rich, 'buy', c.id, t).g;
  rich = act(rich, 'plant', { index: 0, crop: c.id }, t).g;
  rich = act(rich, 'harvest', 0, t + c.time * 1000 + 1, lowRoll).g;
  assert.ok((rich.stock[c.id] || 0) > 0);
  assert.ok(c.price > c.cost);
}
assert.equal(QUALITIES.length, 3);
assert.equal(SPECIALIZATIONS.length, 3);
// Mastery three unlocks a free specialization, which changes future growth.
rich.cropXP.radis = 18;
const normalTime = growTime(rich, 'radis');
rich = act(
  rich,
  'specialize',
  { crop: 'radis', specialization: 'precoce' },
  t,
).g;
assert.equal(rich.specializations.radis, 'precoce');
assert.ok(growTime(rich, 'radis') < normalTime);
for (const id of ['water', 'tools', 'workshop', 'coop', 'auto'])
  rich = act(rich, 'upgrade', id, t).g;
assert.equal(rich.upgrades.length, 5);
rich.stock = {
  ble: 30,
  fraise: 30,
  tomate: 30,
  carotte: 30,
  aubergine: 30,
  myrtille: 30,
  oeuf: 30,
};
for (const r of RECIPES.filter((r) => !r.parent && !r.friend)) {
  const ingredients = defaultIngredients(rich, r);
  rich = act(rich, 'craft', { id: r.id, ingredients }, t, lowRoll).g;
  assert.equal(rich.job?.id, r.id);
  assert.equal(act(rich, 'collect', null, t + 1).g, rich);
  rich = act(rich, 'collect', null, t + 1e9).g;
  assert.equal(
    Object.entries(rich.stock).filter(
      ([id, n]) => id.startsWith(r.id + '|') && n === 1,
    ).length,
    1,
  );
}
assert.equal(rich.crafted, 5);
assert.ok(Object.keys(rich.stock).some((id) => id.includes('|')));
assert.ok(OUTCOMES.every((o) => o.multiplier > 0));
// Better ingredients visibly improve the two best cooking outcomes.
const plain = cookingProbabilities(rich, 'pain', ['ble', 'ble', 'ble']);
const premium = cookingProbabilities(rich, 'pain', [
  'ble|exceptionnelle',
  'ble|exceptionnelle',
  'ble|exceptionnelle',
]);
assert.ok(premium[2] + premium[3] > plain[2] + plain[3]);
// Recipe mastery unlocks a signature variant.
rich.recipeXP.pain = 6;
assert.equal(recipeMastery(rich, 'pain'), 3);
assert.equal(
  recipeLock(
    rich,
    RECIPES.find((r) => r.id === 'pain_maison')!,
  ),
  '',
);
// Gifts advance friendship, then the personal quest opens heart three.
rich.stock.ble = 30;
rich = act(rich, 'gift', { villager: 'lucie', item: 'ble' }, t).g;
assert.equal(rich.relations.lucie, 1);
rich = act(rich, 'gift', { villager: 'lucie', item: 'ble' }, t).g;
rich = act(rich, 'gift', { villager: 'lucie', item: 'ble' }, t).g;
assert.equal(rich.relations.lucie, 2);
rich.stock['pain|reussi'] = 1;
rich = act(rich, 'quest', 'lucie', t).g;
assert.equal(rich.relations.lucie, 3);
assert.ok(rich.quests.includes('lucie'));
assert.ok(VILLAGERS.length >= 5);
assert.equal(
  recipeLock(
    rich,
    RECIPES.find((r) => r.id === 'brioche')!,
  ),
  '',
);
rich = act(rich, 'hens', null, t).g;
rich = act(rich, 'hens', null, t + 120000).g;
assert.ok(rich.stock.oeuf >= 4);
const o = order(rich);
rich.stock[o.crop] = o.amount;
const before = rich.coins;
rich = act(rich, 'order', null, t).g;
assert.equal(rich.coins, before + o.reward);
assert.ok(marketEvent(rich, t).bonus > 0);
const poor = { ...fresh(t), coins: 0, seeds: {}, stock: {} };
assert.equal(act(poor, 'rescue', null, t).g.seeds.radis, 3);
assert.equal(restore('broken').coins, 20);
assert.equal(restore('{"version":8}').coins, 20);
// Version 1 saves migrate without losing the garden.
const legacy = { ...fresh(t), version: 1 };
delete (legacy as Partial<typeof legacy>).cropXP;
assert.equal(restore(JSON.stringify(legacy)).version, 2);
console.log(
  'OK 0.2.0: progression, maîtrise, spécialisation, qualités, cuisine, recettes, amitiés, quêtes, marché, sauvegarde et absence.',
);
