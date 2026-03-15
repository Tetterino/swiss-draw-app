import { Player, Round, Match, PlayerStanding } from '@/types';
import { calculateStandings, getPlayerOpponents } from './standings';
import { selectByePlayer, createByeMatch } from './bye';

const MAX_BACKTRACK = 100;

function generateMatchId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Generate pairings for the next round using Swiss system.
 */
export function generatePairings(
  players: Player[],
  rounds: Round[],
  bestOf: number,
  tournamentPlayers: Player[]
): Round {
  const activePlayers = players.filter((p) => p.status === 'active');
  const roundNumber = rounds.length + 1;

  // Build a temporary tournament-like object for standings calculation
  const tempTournament = {
    id: '',
    name: '',
    bestOf,
    totalRounds: 0,
    phase: 'rounds' as const,
    players: tournamentPlayers,
    rounds,
    createdAt: '',
  };
  const standings = calculateStandings(tempTournament);

  const matches: Match[] = [];
  let remainingPlayers = [...activePlayers];

  // Handle BYE for odd number of players
  if (remainingPlayers.length % 2 === 1) {
    const byePlayer = selectByePlayer(remainingPlayers, rounds, standings);
    if (byePlayer) {
      matches.push(createByeMatch(byePlayer.id));
      remainingPlayers = remainingPlayers.filter((p) => p.id !== byePlayer.id);
    }
  }

  // Sort by match points (descending)
  const standingMap = new Map(standings.map((s) => [s.playerId, s]));
  remainingPlayers.sort((a, b) => {
    const mpA = standingMap.get(a.id)?.matchPoints ?? 0;
    const mpB = standingMap.get(b.id)?.matchPoints ?? 0;
    return mpB - mpA;
  });

  // Shuffle within same match-point groups (Fisher-Yates)
  let groupStart = 0;
  while (groupStart < remainingPlayers.length) {
    const groupMp = standingMap.get(remainingPlayers[groupStart].id)?.matchPoints ?? 0;
    let groupEnd = groupStart + 1;
    while (groupEnd < remainingPlayers.length && (standingMap.get(remainingPlayers[groupEnd].id)?.matchPoints ?? 0) === groupMp) {
      groupEnd++;
    }
    // Fisher-Yates shuffle for the group [groupStart, groupEnd)
    for (let i = groupEnd - 1; i > groupStart; i--) {
      const j = groupStart + Math.floor(Math.random() * (i - groupStart + 1));
      [remainingPlayers[i], remainingPlayers[j]] = [remainingPlayers[j], remainingPlayers[i]];
    }
    groupStart = groupEnd;
  }

  // Build opponent history
  const opponentHistory = new Map<string, Set<string>>();
  for (const p of remainingPlayers) {
    opponentHistory.set(p.id, getPlayerOpponents(p.id, rounds));
  }

  // Try pairing with opponent avoidance
  let paired = tryPairing(remainingPlayers, opponentHistory, true);

  // If strict avoidance fails, relax the constraint
  if (!paired) {
    paired = tryPairing(remainingPlayers, opponentHistory, false);
  }

  if (paired) {
    matches.push(...paired);
  }

  return {
    roundNumber,
    matches,
    isCompleted: false,
  };
}

function tryPairing(
  players: Player[],
  opponentHistory: Map<string, Set<string>>,
  avoidRematches: boolean
): Match[] | null {
  const n = players.length;
  if (n === 0) return [];
  if (n % 2 !== 0) return null;

  const used = new Set<number>();
  const result: Match[] = [];
  let backtracks = 0;

  function backtrack(index: number): boolean {
    // Find next unused player
    while (index < n && used.has(index)) index++;
    if (index >= n) return true; // All paired
    if (backtracks > MAX_BACKTRACK) return false;

    used.add(index);
    const player1 = players[index];

    // Try pairing with each remaining player
    for (let j = index + 1; j < n; j++) {
      if (used.has(j)) continue;

      const player2 = players[j];

      // Check rematch avoidance
      if (avoidRematches) {
        const opponents = opponentHistory.get(player1.id);
        if (opponents && opponents.has(player2.id)) {
          continue;
        }
      }

      used.add(j);
      result.push({
        id: generateMatchId(),
        player1Id: player1.id,
        player2Id: player2.id,
        games: { player1Wins: 0, player2Wins: 0, draws: 0 },
        winnerId: null,
        isBye: false,
        isDraw: false,
        isCompleted: false,
      });

      if (backtrack(index + 1)) return true;

      // Backtrack
      backtracks++;
      result.pop();
      used.delete(j);
    }

    used.delete(index);
    return false;
  }

  if (backtrack(0)) return result;
  return null;
}
