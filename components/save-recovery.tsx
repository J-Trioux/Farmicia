'use client';
import { useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { exportRawSave, type SaveRecoveryError } from '@/lib/save';

export function SaveRecoveryDialog({ issue, open, onOpenChange, onRetry, onNew }: {
  issue: SaveRecoveryError | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
  onNew: () => void;
}) {
  const retry = useRef<HTMLButtonElement>(null);
  return <Dialog open={!!issue && open} onOpenChange={onOpenChange}>
    <DialogContent className="paper-dialog" initialFocus={retry}>
      <DialogTitle>Retrouver votre ferme</DialogTitle>
      <DialogDescription>Votre sauvegarde n’a pas pu être lue. Elle est mise de côté, rien n’est perdu.</DialogDescription>
      <p>La sauvegarde automatique est suspendue jusqu’à votre choix. Échap ferme cette fenêtre ; le bouton de récupération reste disponible.</p>
      <div className="save-actions">
        <button ref={retry} onClick={onRetry}>Réessayer</button>
        <button onClick={() => issue && exportRawSave(issue.raw)}>Télécharger la copie</button>
        <button onClick={onNew}>Commencer une nouvelle partie</button>
      </div>
    </DialogContent>
  </Dialog>;
}
