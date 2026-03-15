export type TournamentPhase = 'registration' | 'rounds' | 'finished';
export type PlayerStatus = 'active' | 'dropped';

export interface Player {
  id: string;
  name: string;
  status: PlayerStatus;
}

export interface GameResult {
  player1Wins: number;
  player2Wins: number;
  draws: number;
}

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string | null; // null for BYE
  games: GameResult;
  winnerId: string | null;
  isBye: boolean;
  isDraw: boolean;
  isCompleted: boolean;
}

export interface Round {
  roundNumber: number;
  matches: Match[];
  isCompleted: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  bestOf: number;
  totalRounds: number;
  phase: TournamentPhase;
  players: Player[];
  rounds: Round[];
  createdAt: string;
}

export interface PlayerStanding {
  playerId: string;
  playerName: string;
  rank: number;
  matchPoints: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  gameWins: number;
  gameLosses: number;
  gameDraws: number;
  omwPercent: number; // Opponent Match Win %
  gwPercent: number;  // Game Win %
  ogwPercent: number; // Opponent Game Win %
  isDropped: boolean;
}
