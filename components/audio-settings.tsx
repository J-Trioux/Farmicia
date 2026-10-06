'use client';
/** 0.22 — Réglages du son : activé ou coupé, volume de la musique et des effets. */
import { useId } from 'react';
import { useAudioPrefs } from '@/components/game-audio';
import { SettingToggle } from '@/components/notebook/setting-toggle';
import { gameAudio } from '@/lib/audio/engine';

function Slider({ label, value, onChange, disabled, hint }: { label: string; value: number; onChange: (v: number) => void; disabled: boolean; hint: string }) {
  const id = useId();
  return (
    <div className="audio-slider">
      <label htmlFor={id}>
        <b>{label}</b>
        <small>{hint}</small>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(value * 100)}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.currentTarget.value) / 100)}
        aria-valuetext={`${Math.round(value * 100)} %`}
      />
      <output htmlFor={id}>{Math.round(value * 100)}{' '}%</output>
    </div>
  );
}

export function AudioSettings() {
  const prefs = useAudioPrefs();
  return (
    <>
      <SettingToggle
        label="Son et musique"
        description="Thème de la saison, bruitages des gestes et ambiance de la ferme."
        active={prefs.on}
        onClick={() => gameAudio.setPrefs({ on: !prefs.on })}
      />
      <div className="audio-sliders">
        <Slider label="Musique" hint="Le thème de la saison, plus doux le soir." value={prefs.music} disabled={!prefs.on}
          onChange={(music) => gameAudio.setPrefs({ music })} />
        <Slider label="Effets" hint="Gestes de Rosalie, fenêtres, ambiance." value={prefs.sfx} disabled={!prefs.on}
          onChange={(sfx) => {
            gameAudio.setPrefs({ sfx });
            gameAudio.play('recolter');
          }} />
      </div>
    </>
  );
}
