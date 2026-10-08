'use client';
/**
 * 0.26 — Page Savoir-faire du carnet (maquette 09-savoir-faire de ChatGPT).
 *
 * Onglets Culture, Cuisine, Commerce ; le bandeau et, à côté, le rang de la
 * voie et ses découvertes ; puis les deux voies au choix en grandes cartes et
 * « Choisir … ». Vrais noms, effets et coût du changement (50 pièces) de
 * lib/village.ts ; une même action répétée ne fait pas monter ces voies.
 */
import { useState } from 'react';
import { CarnetBanner, CarnetSegments, CarnetTabs } from '@/components/notebook/carnet';
import { CarnetIcon as PixelIcon } from '@/components/notebook/carnet-icon';
import { SKILL_PATHS, skillProgress, skillRank, type ActionArgument, type Game } from '@/lib/game';
import { Glyph } from '@/components/glyph';

type Dispatch = (action: string, argument?: ActionArgument) => unknown;
type PathId = (typeof SKILL_PATHS)[number]['id'];
const PATH_ICONS: Record<PathId, string> = { culture: 'sachet', cuisine: 'casserole', commerce: 'balance' };
const CHOICE_ICONS: Record<string, string> = {
  semencier: 'sachet',
  'terre-soignee': 'arrosoir',
  'mise-en-place': 'sablier',
  'gout-sur': 'etoile',
  'panier-fidele': 'cagette',
  'deux-comptoirs': 'marche',
};

export function SkillsPage({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const [view, setView] = useState<PathId>(() => SKILL_PATHS.find((p) => skillRank(game, p.id) >= 2 && !game.skillChoices[p.id])?.id || 'culture');
  const path = SKILL_PATHS.find((p) => p.id === view)!;
  const rank = skillRank(game, path.id);
  const count = skillProgress(game, path.id);
  const current = game.skillChoices[path.id];
  const [picks, setPicks] = useState<Record<string, string>>({});
  const pick = picks[path.id] ?? current ?? '';
  const choice = path.choices.find((c) => c.id === pick);
  const changing = !!current && pick !== current;
  const locked = rank < 2;
  return (
    <div className="carnet-stack skills-page">
      <CarnetTabs<PathId>
        label="Voies du savoir-faire"
        value={view}
        onChange={setView}
        items={SKILL_PATHS.map((p) => ({ id: p.id, label: p.title, icon: PATH_ICONS[p.id], count: skillRank(game, p.id) >= 2 && !game.skillChoices[p.id] ? 1 : 0 }))}
      />
      <div className="skills-head">
        <CarnetBanner id="savoir-faire" variant={view} />
        <section className="carnet-card skills-rank" aria-labelledby="skills-rank-title">
          <h4 id="skills-rank-title">
            {path.title} · rang {rank}/3
          </h4>
          <CarnetSegments value={Math.min(count, 6)} max={6} segments={6} label={`${count} découvertes sur 6`} />
          <p>
            <b>
              {Math.min(count, 6)}
              {' '}/{' '}6 découvertes
            </b>{' '}
            · choix à 3, album complet à 6
          </p>
          <small>{path.hint} Une même action répétée ne fait pas monter cette voie.</small>
        </section>
      </div>
      <fieldset className="carnet-choices skills-choices">
        <legend className="sr-only">Voies de {path.title.toLowerCase()}</legend>
        {path.choices.map((entry) => (
          <button key={entry.id} type="button" className="carnet-choice" aria-pressed={pick === entry.id} disabled={locked} onClick={() => setPicks({ ...picks, [path.id]: entry.id })}>
            <span className="carnet-tile-check" aria-hidden="true">
              {pick === entry.id && <Glyph id="coche" />}
            </span>
            <PixelIcon id={CHOICE_ICONS[entry.id] || PATH_ICONS[path.id]} />
            <b>
              {entry.name}
              {current === entry.id ? ' · actuelle' : ''}
            </b>
            <small>{entry.desc}</small>
          </button>
        ))}
      </fieldset>
      <div className="carnet-detail-actions skills-action">
        <button
          type="button"
          className="carnet-primary"
          disabled={locked || !choice || pick === current || (changing && game.coins < 50)}
          onClick={() => dispatch('skillChoice', { path: path.id, choice: pick })}
        >
          <PixelIcon id={PATH_ICONS[path.id]} />
          {locked
            ? `Encore ${Math.max(0, 3 - count)} découverte${3 - count > 1 ? 's' : ''} pour choisir`
            : !choice
              ? 'Choisissez une voie'
              : pick === current
                ? `${choice.name} : choisie`
                : changing
                  ? `Passer à ${choice.name} · 50 pièces`
                  : `Choisir ${choice.name}`}
        </button>
      </div>
      <p className="carnet-note carnet-center">Premier choix gratuit · changer de voie : 50 pièces.</p>
    </div>
  );
}
