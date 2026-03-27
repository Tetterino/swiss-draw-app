'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MatchCard from './MatchCard';
import { Match, Player, GameResult } from '@/types';

interface PendingResult {
  games: GameResult;
  winnerId: string | null;
  isDraw: boolean;
  isBothLoss: boolean;
}

interface SortableMatchCardProps {
  match: Match;
  players: Player[];
  bestOf: number;
  onChangeResult: (matchId: string, games: GameResult, winnerId: string | null, isDraw: boolean, isBothLoss: boolean) => void;
  tableNumber: number;
  pendingResult?: PendingResult;
  canDrop?: boolean;
  onDropPlayer?: (playerId: string, playerName: string) => void;
}

export default function SortableMatchCard(props: SortableMatchCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.match.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <MatchCard
        {...props}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
