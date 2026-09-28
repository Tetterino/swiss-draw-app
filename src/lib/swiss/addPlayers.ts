import { Round, Match } from '@/types';
import { hasHadBye } from './standings';
import { createByeMatch } from './bye';
import { generateMatchId } from './pairing';

/** Fisher-Yates shuffle (in-place). */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createMatch(player1Id: string, player2Id: string): Match {
  return {
    id: generateMatchId(),
    player1Id,
    player2Id,
    games: { player1Wins: 0, player2Wins: 0, draws: 0 },
    winnerId: null,
    isBye: false,
    isDraw: false,
    isBothLoss: false,
    isCompleted: false,
  };
}

/**
 * Add players to round 1 without disturbing the pairings already decided.
 *
 * Only the BYE match is reconsidered: the player sitting out is pooled with the
 * newcomers and paired among them, so every already-decided head-to-head match
 * (results included) is carried over untouched. A BYE is created again only when
 * the pool ends up odd, and it goes to someone who is not already sitting out.
 *
 * Round 1 only — joining later would leave a player with fewer matches played
 * than everyone else, which makes the standings meaningless.
 */
export function addPlayersToRound(round: Round, newPlayerIds: string[]): Round {
  if (newPlayerIds.length === 0) return round;

  const byeMatch = round.matches.find((m) => m.isBye) ?? null;
  const keptMatches = round.matches.filter((m) => !m.isBye);

  const pool = shuffle([...(byeMatch ? [byeMatch.player1Id] : []), ...newPlayerIds]);

  // Pick who sits out when the pool is odd. The current BYE holder is already
  // sitting out, so hand it to a newcomer instead.
  let byePlayerId: string | null = null;
  if (pool.length % 2 === 1) {
    const fresh = pool.filter((id) => !hasHadBye(id, [round]));
    const candidates = fresh.length > 0 ? fresh : pool;
    byePlayerId = candidates[Math.floor(Math.random() * candidates.length)];
  }

  const toPair = pool.filter((id) => id !== byePlayerId);
  const newMatches: Match[] = [];
  for (let i = 0; i + 1 < toPair.length; i += 2) {
    newMatches.push(createMatch(toPair[i], toPair[i + 1]));
  }

  if (byePlayerId) {
    // Reuse the original BYE match when the same player keeps it, so its id stays stable.
    newMatches.push(
      byeMatch && byeMatch.player1Id === byePlayerId ? byeMatch : createByeMatch(byePlayerId)
    );
  }

  return { ...round, matches: [...keptMatches, ...newMatches] };
}
