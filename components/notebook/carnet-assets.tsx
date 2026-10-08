'use client';

import { createContext, useContext, type ReactNode } from 'react';

// Le Carnet utilise ses propres visuels ; la ferme conserve ses sprites de jeu.
const CarnetAssetsContext = createContext(false);

export function CarnetAssets({ children }: { children: ReactNode }) {
  return <CarnetAssetsContext.Provider value={true}>{children}</CarnetAssetsContext.Provider>;
}

export function useCarnetAssets() {
  return useContext(CarnetAssetsContext);
}
