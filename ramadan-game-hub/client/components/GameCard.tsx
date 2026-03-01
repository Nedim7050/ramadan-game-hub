"use client";

import { ReactNode } from 'react';

interface GameCardProps {
  gameType: string;
  title: string;
  description?: string;
  onSelect: (gameType: string) => void;
  icon?: ReactNode;
}

/**
 * Affiche une carte sélectionnable représentant un jeu.  Lorsque la carte
 * est cliquée, on déclenche la fonction `onSelect` avec le type du jeu.
 */
export default function GameCard({ gameType, title, description, onSelect, icon }: GameCardProps) {
  return (
    <div
      onClick={() => onSelect(gameType)}
      className="cursor-pointer bg-secondary text-white p-4 rounded shadow hover:bg-gray-700 flex flex-col items-center justify-center"
    >
      {icon && <div className="mb-2 text-3xl text-primary">{icon}</div>}
      <h3 className="font-semibold text-lg mb-1 text-primary">{title}</h3>
      {description && <p className="text-sm text-gray-300 text-center">{description}</p>}
    </div>
  );
}