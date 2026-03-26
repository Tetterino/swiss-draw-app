import { describe, it, expect } from 'vitest';
import { generatePairings } from '../pairing';
import { Player, Round, Match } from '@/types';

// --- helpers ---

function mkPlayer(id: string): Player {
  return { id, name: id, status: 'active' };
}

function mkMatch(
  p1: string,
  p2: string,
  p1Wins: number,
  p2Wins: number,
): Match {
  const isDraw = p1Wins === p2Wins;
  const winnerId = isDraw ? null : p1Wins > p2Wins ? p1 : p2;
  return {
    id: `m-${p1}-${p2}`,
    player1Id: p1,
    player2Id: p2,
    games: { player1Wins: p1Wins, player2Wins: p2Wins, draws: 0 },
    winnerId,
    isBye: false,
    isDraw,
    isBothLoss: false,
    isCompleted: true,
  };
}

function mkRound(roundNumber: number, matches: Match[]): Round {
  return { roundNumber, matches, isCompleted: true };
}

function allPlayerIds(round: Round): string[] {
  const ids: string[] = [];
  for (const m of round.matches) {
    ids.push(m.player1Id);
    if (m.player2Id) ids.push(m.player2Id);
  }
  return ids;
}

// --- tests ---

describe('generatePairings', () => {
  it('pairs all players when even number', () => {
    const players = [mkPlayer('A'), mkPlayer('B'), mkPlayer('C'), mkPlayer('D')];
    const round = generatePairings(players, [], 3, players);

    // Should have 2 matches, no BYE
    expect(round.matches.length).toBe(2);
    expect(round.matches.every((m) => !m.isBye)).toBe(true);

    // Each player appears exactly once
    const ids = allPlayerIds(round);
    expect(ids.sort()).toEqual(['A', 'B', 'C', 'D']);
  });

  it('generates exactly one BYE for odd number of players', () => {
    const players = [mkPlayer('A'), mkPlayer('B'), mkPlayer('C')];
    const round = generatePairings(players, [], 3, players);

    const byeMatches = round.matches.filter((m) => m.isBye);
    expect(byeMatches.length).toBe(1);

    // BYE match should be completed with 2-0
    const bye = byeMatches[0];
    expect(bye.isCompleted).toBe(true);
    expect(bye.games.player1Wins).toBe(2);
    expect(bye.games.player2Wins).toBe(0);

    // All 3 players appear exactly once
    const ids = allPlayerIds(round);
    expect(ids.sort()).toEqual(['A', 'B', 'C']);
  });

  it('does not duplicate any player within a round', () => {
    const players = Array.from({ length: 8 }, (_, i) => mkPlayer(`P${i}`));
    const round = generatePairings(players, [], 3, players);

    const ids = allPlayerIds(round);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('avoids rematches when possible', () => {
    const players = [mkPlayer('A'), mkPlayer('B'), mkPlayer('C'), mkPlayer('D')];
    // Round 1: A vs B, C vs D
    const prevRounds = [
      mkRound(1, [mkMatch('A', 'B', 2, 0), mkMatch('C', 'D', 2, 0)]),
    ];

    const round = generatePairings(players, prevRounds, 3, players);

    // A should not be paired with B, C should not be paired with D
    for (const m of round.matches) {
      if (m.isBye) continue;
      const pair = [m.player1Id, m.player2Id].sort().join('-');
      expect(pair).not.toBe('A-B');
      expect(pair).not.toBe('C-D');
    }
  });

  it('excludes dropped players from pairing', () => {
    const active = [mkPlayer('A'), mkPlayer('B')];
    const dropped: Player = { id: 'X', name: 'X', status: 'dropped' };
    const allPlayers = [...active, dropped];

    const round = generatePairings(active, [], 3, allPlayers);

    const ids = allPlayerIds(round);
    expect(ids).not.toContain('X');
  });

  it('assigns correct roundNumber', () => {
    const players = [mkPlayer('A'), mkPlayer('B')];
    const prevRounds = [mkRound(1, [mkMatch('A', 'B', 2, 0)])];

    const round = generatePairings(players, prevRounds, 3, players);
    expect(round.roundNumber).toBe(2);
  });

  it('returns round with isCompleted = false', () => {
    const players = [mkPlayer('A'), mkPlayer('B')];
    const round = generatePairings(players, [], 3, players);
    expect(round.isCompleted).toBe(false);
  });

  it('generated matches include isBothLoss: false', () => {
    const players = [mkPlayer('A'), mkPlayer('B'), mkPlayer('C')];
    const round = generatePairings(players, [], 3, players);

    for (const match of round.matches) {
      expect(match.isBothLoss).toBe(false);
    }
  });
});
