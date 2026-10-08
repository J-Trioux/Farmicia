/** Associations explicites des nouveautés ; aucune étoile de repli. */
import { CROPS, EMBELLISHMENTS, RECIPES, UPGRADES } from './game.ts';
import { UPGRADE_ICONS } from './pixel-icons.ts';

const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toLowerCase().trim();

export function iconFor(text: string): string | null {
  const t = normalize(text);
  if (t.startsWith('projet')) return 'projet-village';
  const embellishment = EMBELLISHMENTS.find((entry) => t.includes(normalize(entry.name)));
  if (embellishment) return embellishment.id;
  const upgrade = UPGRADES.find((entry) => t === normalize(entry.name));
  if (upgrade) return UPGRADE_ICONS[upgrade.id];
  if (t.includes('semis de garde')) return 'garde';
  if (t.includes('extension du jardin')) return 'parcelles';
  if (t.includes('graines prometteuses')) return 'graine-doree';
  if (t.includes('foire')) return 'rosette';
  if (t.includes('caravane')) return t.includes('vallee') ? 'valley' : 'tournee';
  if (t.includes('menu du boulanger')) return 'menu';
  if (t.includes('recettes signatures')) return 'signature';
  if (t.includes('repas prestigieux')) return 'cloche';
  if (t.includes('marches de qualite')) return 'balance';
  if (/grandes? commandes?/.test(t)) return 'cagette';
  if (t.includes('maitre jardinier')) return 'laurier';
  if (t.includes('serre')) return 'serre';
  if (t.includes('marche')) return 'marche';
  const recipe = RECIPES.find((entry) => t.includes(normalize(entry.name)));
  if (recipe) return recipe.id;
  if (/^recettes?\s*:/.test(t)) return 'recette';
  const crop = CROPS.find((entry) => t.startsWith(normalize(entry.name) + ' :'));
  return crop?.id || null;
}

/** Une carte par plat, même quand l’annonce regroupe plusieurs recettes. */
export function levelIconCards(system: string) {
  return system.split(' · ').filter(Boolean).flatMap((title) => {
    const t = normalize(title);
    if (/^recettes?\s*:/.test(t)) {
      const recipes = RECIPES.filter((entry) => !entry.parent && t.includes(normalize(entry.name)));
      if (recipes.length) return recipes.map((entry) => ({ title: entry.name, icon: entry.id }));
    }
    if (t === 'recettes signatures et grande commande') return [
      { title: 'Recettes signatures', icon: 'signature' },
      { title: 'Grande commande', icon: 'cagette' },
    ];
    if (t === 'graines prometteuses et foires aux varietes') return [
      { title: 'Graines prometteuses', icon: 'graine-doree' },
      { title: 'Foires aux variétés', icon: 'rosette' },
    ];
    return [{ title, icon: iconFor(title) }];
  });
}
