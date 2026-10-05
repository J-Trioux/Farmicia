export const FESTIVAL_JUDGE_IDS = [
  'lucie',
  'marcel',
  'jeanne',
  'clara',
  'emile',
] as const;

export type FestivalJudgeId = (typeof FESTIVAL_JUDGE_IDS)[number];

export const FESTIVAL_AWARDS = [
  {
    id: 'convive',
    name: 'Tablier de convive',
    icon: '🍽️',
    minimum: 0,
  },
  {
    id: 'ruban',
    name: 'Ruban des saveurs',
    icon: '🎗️',
    minimum: 45,
  },
  {
    id: 'argent',
    name: 'Médaille du village',
    icon: '🥈',
    minimum: 65,
  },
  {
    id: 'or',
    name: 'Grand Prix de Rosalie',
    icon: '🏆',
    minimum: 85,
  },
] as const;

export type FestivalAwardId = (typeof FESTIVAL_AWARDS)[number]['id'];

export type FestivalEntry = {
  dish: string;
  score: number;
  award: FestivalAwardId;
  leadJudge: FestivalJudgeId;
  themeId?: string;
  breakdown?: FestivalScoreBreakdown;
};

export type FestivalState = {
  entries: number;
  bestScore: number;
  bestDish: string | null;
  bestAward: FestivalAwardId | null;
  lastEntry: FestivalEntry | null;
  introSeen: boolean;
};

export type FestivalScoreBreakdown = {
  quality: number;
  mastery: number;
  friendship: number;
  affinity: number;
  theme?: number;
  savoirFaire?: number;
};

export type FestivalScore = {
  score: number;
  award: (typeof FESTIVAL_AWARDS)[number];
  breakdown: FestivalScoreBreakdown;
};

export type FestivalReaction = {
  judge: FestivalJudgeId;
  mood: 'curieux' | 'souriant' | 'conquis' | 'ebloui';
  text: string;
};

const QUALITY_POINTS: Record<string, number> = {
  rustique: 24,
  reussi: 39,
  savoureux: 55,
  chef: 70,
};

const REACTIONS: Record<
  FestivalJudgeId,
  Record<FestivalReaction['mood'], string>
> = {
  lucie: {
    curieux: 'Une assiette sincère, Rosalie. Continue à l’affiner.',
    souriant: 'Les saveurs sont bien posées, comme une pâte bien levée.',
    conquis: 'Voilà une recette que je servirais avec fierté.',
    ebloui: 'Quel équilibre ! Toute la place va en parler.',
  },
  marcel: {
    curieux: 'On reconnaît le jardin. Il peut encore mieux chanter.',
    souriant: 'De bons produits et une main sûre, ça se sent.',
    conquis: 'Le potager est joliment mis à l’honneur.',
    ebloui: 'Du champ à l’assiette, c’est une vraie réussite !',
  },
  jeanne: {
    curieux: 'Une première note douce, puis le plat se cherche encore.',
    souriant: 'Les parfums se répondent avec délicatesse.',
    conquis: 'Chaque bouchée raconte une promenade au jardin.',
    ebloui: 'Une harmonie rare, lumineuse et généreuse.',
  },
  clara: {
    curieux: 'L’idée est jolie. Un peu de précision la fera briller.',
    souriant: 'La finition est soignée, j’aime beaucoup.',
    conquis: 'C’est précis, gourmand et plein de personnalité.',
    ebloui: 'Une assiette de fête jusque dans le dernier détail !',
  },
  emile: {
    curieux: 'Le village goûtera volontiers une prochaine version.',
    souriant: 'Une assiette qui trouverait vite son public.',
    conquis: 'Les voisins vont me réclamer la recette.',
    ebloui: 'C’est le plat vedette de la fête, aucun doute !',
  },
};

function integer(value: unknown, minimum: number, maximum: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, Math.floor(value)));
}

export function freshFestival(): FestivalState {
  return {
    entries: 0,
    bestScore: 0,
    bestDish: null,
    bestAward: null,
    lastEntry: null,
    introSeen: false,
  };
}

export function festivalAward(score: number) {
  const safeScore = integer(score, 0, 100);
  return (
    [...FESTIVAL_AWARDS]
      .reverse()
      .find((award) => safeScore >= award.minimum) || FESTIVAL_AWARDS[0]
  );
}

export function festivalLeadJudge(entries: number): FestivalJudgeId {
  return FESTIVAL_JUDGE_IDS[integer(entries, 0, Number.MAX_SAFE_INTEGER) % 5];
}

export function calculateFestivalScore(input: {
  qualityId: string;
  mastery: number;
  relations: Partial<Record<FestivalJudgeId, number>>;
  affinities: readonly FestivalJudgeId[];
  themeBonus?: number;
  skillBonus?: number;
}): FestivalScore {
  const quality = QUALITY_POINTS[input.qualityId] ?? 0;
  const mastery = integer(input.mastery - 1, 0, 4) * 4;
  const friendshipTotal = FESTIVAL_JUDGE_IDS.reduce(
    (total, id) => total + integer(input.relations[id], 0, 5),
    0,
  );
  const friendship = Math.round((friendshipTotal / 25) * 10);
  const affinity =
    new Set(input.affinities.filter((id) => FESTIVAL_JUDGE_IDS.includes(id)))
      .size * 2;
  const breakdown = { quality, mastery, friendship, affinity,
    theme: integer(input.themeBonus, 0, 12), savoirFaire: integer(input.skillBonus, 0, 6) };
  const score = Math.min(
    100,
    Object.values(breakdown).reduce((total, value) => total + value, 0),
  );
  return { score, award: festivalAward(score), breakdown };
}

export function festivalReactions(
  score: number,
  affinities: readonly FestivalJudgeId[],
  relations: Partial<Record<FestivalJudgeId, number>>,
): FestivalReaction[] {
  const safeScore = integer(score, 0, 100);
  return FESTIVAL_JUDGE_IDS.map((judge) => {
    const personalScore =
      safeScore +
      (affinities.includes(judge) ? 6 : 0) +
      integer(relations[judge], 0, 5);
    const mood: FestivalReaction['mood'] =
      personalScore >= 88
        ? 'ebloui'
        : personalScore >= 68
          ? 'conquis'
          : personalScore >= 47
            ? 'souriant'
            : 'curieux';
    return { judge, mood, text: REACTIONS[judge][mood] };
  });
}

export function normalizeFestival(
  raw: unknown,
  validDish: (dish: string) => boolean = () => true,
): FestivalState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    return freshFestival();
  const value = raw as Record<string, unknown>;
  const entries = integer(value.entries, 0, Number.MAX_SAFE_INTEGER);
  const bestScore = integer(value.bestScore, 0, 100);
  const bestDish =
    typeof value.bestDish === 'string' && validDish(value.bestDish)
      ? value.bestDish
      : null;
  const last =
    value.lastEntry &&
    typeof value.lastEntry === 'object' &&
    !Array.isArray(value.lastEntry)
      ? (value.lastEntry as Record<string, unknown>)
      : null;
  const lastDish =
    last && typeof last.dish === 'string' && validDish(last.dish)
      ? last.dish
      : null;
  const lastScore = integer(last?.score, 0, 100);
  const lastJudge = FESTIVAL_JUDGE_IDS.includes(
    last?.leadJudge as FestivalJudgeId,
  )
    ? (last?.leadJudge as FestivalJudgeId)
    : festivalLeadJudge(Math.max(0, entries - 1));
  const normalizedEntries = Math.max(entries, lastDish ? 1 : 0);
  const lastIsBest = Boolean(lastDish && lastScore > (bestDish ? bestScore : 0));
  const normalizedBestDish = lastIsBest ? lastDish : bestDish;
  const normalizedBestScore = normalizedBestDish
    ? Math.max(bestDish ? bestScore : 0, lastDish ? lastScore : 0)
    : 0;
  return {
    entries: normalizedEntries,
    bestScore: normalizedBestScore,
    bestDish: normalizedBestDish,
    bestAward: normalizedBestDish
      ? festivalAward(normalizedBestScore).id
      : null,
    lastEntry: lastDish
      ? {
          dish: lastDish,
          score: lastScore,
          award: festivalAward(lastScore).id,
          leadJudge: lastJudge,
          themeId: typeof last?.themeId === 'string' ? last.themeId : undefined,
          breakdown: last?.breakdown && typeof last.breakdown === 'object'
            ? Object.fromEntries(['quality', 'mastery', 'friendship', 'affinity', 'theme', 'savoirFaire'].map((key) =>
                [key, integer((last.breakdown as Record<string, unknown>)[key], 0, 100)])) as FestivalScoreBreakdown
            : undefined,
        }
      : null,
    introSeen: value.introSeen === true,
  };
}
