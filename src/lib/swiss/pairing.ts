import { Player, Round, Match, PlayerStanding } from '@/types';
import { calculateStandings, getPlayerOpponents } from './standings';
import { selectByePlayer, createByeMatch } from './bye';

const MAX_BACKTRACK = 100;

function generateMatchId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/** Fisher-Yates shuffle (in-place). */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate pairings for the next round using Swiss system.
 * Pairs within the same match-point group first, floating a player
 * down to the next group only when within-group pairing is impossible.
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

  // Split into MP groups and shuffle each
  const groups: Player[][] = [];
  let i = 0;
  while (i < remainingPlayers.length) {
    const mp = standingMap.get(remainingPlayers[i].id)?.matchPoints ?? 0;
    let j = i + 1;
    while (j < remainingPlayers.length && (standingMap.get(remainingPlayers[j].id)?.matchPoints ?? 0) === mp) {
      j++;
    }
    groups.push(shuffle(remainingPlayers.slice(i, j)));
    i = j;
  }

  // Build opponent history
  const opponentHistory = new Map<string, Set<string>>();
  for (const p of remainingPlayers) {
    opponentHistory.set(p.id, getPlayerOpponents(p.id, rounds));
  }

  // Pair group-by-group, floating unpaired players to the next group
  matches.push(...pairByGroups(groups, opponentHistory));

  return {
    roundNumber,
    matches,
    isCompleted: false,
  };
}

/**
 * Pair each MP group independently, carrying unpaired "floaters" down
 * to the next group. This ensures within-group pairing is always
 * preferred over cross-group pairing.
 */
function pairByGroups(
  groups: Player[][],
  opponentHistory: Map<string, Set<string>>
): Match[] {
  const allMatches: Match[] = [];
  let floaters: Player[] = [];

  for (const group of groups) {
    const pool = [...floaters, ...group];
    floaters = [];

    if (pool.length === 0) continue;

    if (pool.length % 2 === 0) {
      let paired = tryPairing(pool, opponentHistory, true);
      if (!paired) paired = tryPairing(pool, opponentHistory, false);
      if (paired) {
        allMatches.push(...paired);
        continue;
      }
    }

    // Odd count, or even-count pairing failed — try each player as floater
    // Prefer floating the last player (lowest ranked / floater from above)
    let success = false;
    for (let fi = pool.length - 1; fi >= 0; fi--) {
      const remaining = [...pool.slice(0, fi), ...pool.slice(fi + 1)];
      let paired = tryPairing(remaining, opponentHistory, true);
      if (!paired) paired = tryPairing(remaining, opponentHistory, false);
      if (paired) {
        allMatches.push(...paired);
        floaters = [pool[fi]];
        success = true;
        break;
      }
    }
    if (!success) {
      // Last resort: float the last player
      floaters = [pool[pool.length - 1]];
    }
  }

  // Pair any remaining floaters (shouldn't happen with even total)
  if (floaters.length >= 2) {
    let paired = tryPairing(floaters, opponentHistory, true);
    if (!paired) paired = tryPairing(floaters, opponentHistory, false);
    if (paired) allMatches.push(...paired);
  }

  return allMatches;
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
        isBothLoss: false,
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
