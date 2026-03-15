import { Player, Round, Match, PlayerStanding } from '@/types';
import { hasHadBye } from './standings';

/**
 * Select a player for BYE: lowest match points, no prior BYE, random tiebreak.
 * Returns the selected player or null if no valid candidate.
 */
export function selectByePlayer(
  activePlayers: Player[],
  rounds: Round[],
  standings: PlayerStanding[]
): Player | null {
  // Filter players who haven't had a BYE yet
  const candidates = activePlayers.filter((p) => !hasHadBye(p.id, rounds));

  if (candidates.length === 0) {
    // All players have had a BYE; pick lowest MP
    return pickLowestMP(activePlayers, standings);
  }

  return pickLowestMP(candidates, standings);
}

function pickLowestMP(players: Player[], standings: PlayerStanding[]): Player | null {
  if (players.length === 0) return null;

  const standingMap = new Map(standings.map((s) => [s.playerId, s]));

  // Find minimum match points
  let minMP = Infinity;
  for (const p of players) {
    const mp = standingMap.get(p.id)?.matchPoints ?? 0;
    if (mp < minMP) minMP = mp;
  }

  // Get all players with minimum MP
  const lowestPlayers = players.filter((p) => (standingMap.get(p.id)?.matchPoints ?? 0) === minMP);

  // Random selection among tied players
  const idx = Math.floor(Math.random() * lowestPlayers.length);
  return lowestPlayers[idx];
}

/**
 * Create a BYE match (2-0 win).
 */
export function createByeMatch(playerId: string): Match {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
    player1Id: playerId,
    player2Id: null,
    games: { player1Wins: 2, player2Wins: 0, draws: 0 },
    winnerId: playerId,
    isBye: true,
    isDraw: false,
    isCompleted: true,
  };
}
