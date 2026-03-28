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
  isBothLoss: boolean;
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
  /** 勝手累点 (Win Total Point): 対戦して勝利した相手のマッチポイントの合計 */
  winTotalPoint: number;
  /** 対手累点 (Opponent Total Point): 対戦相手のマッチポイントの合計（同一相手は対戦回数分加算） */
  opponentTotalPoint: number;
  isDropped: boolean;
}
