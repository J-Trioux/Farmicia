'use client';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type ConfirmChoice = {
  title: string;
  description: string;
  items?: string[];
  confirmLabel: string;
};
export type AskConfirm = (choice: ConfirmChoice, onConfirm: () => void) => void;
export type PendingConfirm = { choice: ConfirmChoice; onConfirm: () => void } | null;

export function GameConfirmDialog({ pending, onClose }: { pending: PendingConfirm; onClose: () => void }) {
  return <AlertDialog open={!!pending} onOpenChange={(open) => { if (!open) onClose(); }}>
    <AlertDialogContent className="game-confirm-dialog">
      <div className="game-confirm-head"><div><small>Confirmation de Rosalie</small><AlertDialogTitle>{pending?.choice.title || 'Confirmer cette action'}</AlertDialogTitle></div></div>
      <AlertDialogDescription>{pending?.choice.description}</AlertDialogDescription>
      {!!pending?.choice.items?.length && <div className="game-confirm-items"><b>Produits utilisés</b><ul>{pending.choice.items.map((item,index)=><li key={index}>{item}</li>)}</ul></div>}
      <div className="game-confirm-actions"><AlertDialogCancel onClick={onClose}>Garder les produits</AlertDialogCancel><AlertDialogAction onClick={() => { const callback=pending?.onConfirm; onClose(); callback?.(); }}>{pending?.choice.confirmLabel || 'Confirmer'}</AlertDialogAction></div>
    </AlertDialogContent>
  </AlertDialog>;
}
