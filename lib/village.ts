/** Les quatre liens mis en avant dans la build 0.7.0. Clara reste dans les sauvegardes et le jury. */
export const LINKS = [
  { id: 'marcel', name: 'Marcel', trait: 'Pragmatique et généreux', specialty: 'Les paniers de carottes', level: 4,
    orderItem: 'carotte', orderAmount: 2, quote: 'Gardez les plus croquantes pour vos semis, Rosalie.',
    next: ['Une graine après quelques récoltes', 'Conseils pour les belles récoltes', 'Une graine plus souvent'] },
  { id: 'emile', name: 'Émile', trait: 'Curieux des bonnes affaires', specialty: 'Le marché des primeurs', level: 4,
    orderItem: 'radis', orderAmount: 4, quote: 'Je saurai raconter votre jardin aux voisins.',
    next: ['Meilleurs prix à la vente', 'Contrats mieux payés', 'Un étal réputé au village'] },
  { id: 'lucie', name: 'Lucie', trait: 'Boulangère au cœur franc', specialty: 'Le pain de campagne', level: 8,
    orderItem: 'pain|rustique', orderAmount: 1, quote: 'Un bon pain rassemble toujours du monde.',
    next: ['Conseils de cuisine', 'Brioche de Lucie', 'La maîtrise du four'] },
  { id: 'jeanne', name: 'Jeanne', trait: 'Herboriste attentive', specialty: 'Les douceurs de fraises', level: 10,
    orderItem: 'confiture|rustique', orderAmount: 1, quote: 'Le fruit mûr apporte déjà la moitié de la douceur.',
    next: ['Idées plus créatives', 'Infusion de Jeanne', 'Un palais très sûr'] },
] as const;
export type LinkId = (typeof LINKS)[number]['id'];
export type SkillPath = 'culture' | 'cuisine' | 'commerce';
export const SKILL_PATHS = [
  { id: 'culture', title: 'Culture', hint: 'Découvrez différentes récoltes.',
    choices: [{ id: 'semencier', name: 'Semencier', desc: 'Une graine de plus lors de la première récolte de chaque culture.' },
      { id: 'terre-soignee', name: 'Terre soignée', desc: 'L’arrosage rend les belles récoltes sensiblement plus fréquentes.' }] },
  { id: 'cuisine', title: 'Cuisine', hint: 'Préparez des recettes différentes.',
    choices: [{ id: 'mise-en-place', name: 'Mise en place', desc: 'Les préparations finissent 20 % plus vite.' },
      { id: 'gout-sur', name: 'Goût sûr', desc: 'Avec un bel ingrédient, évite le résultat rustique.' }] },
  { id: 'commerce', title: 'Commerce', hint: 'Livrez des paniers et menus variés.',
    choices: [{ id: 'panier-fidele', name: 'Panier fidèle', desc: 'Une graine revient après chaque commande de récolte.' },
      { id: 'deux-comptoirs', name: 'Deux comptoirs', desc: 'Une commande simple supplémentaire reste affichée.' }] },
] as const;
export const FESTIVAL_THEMES = [
  { id: 'potager', name: 'Le potager en fête', crops: ['radis', 'carotte', 'salade', 'tomate', 'aubergine', 'citrouille'], tip: 'Un plat aux légumes du jardin convient au thème.' },
  { id: 'moissons', name: 'Les moissons dorées', crops: ['ble', 'mais'], tip: 'Le blé et le maïs sont à l’honneur.' },
  { id: 'douceurs', name: 'Les douceurs du verger', crops: ['fraise', 'myrtille', 'raisin', 'melon'], tip: 'Présentez une recette aux fruits.' },
] as const;
