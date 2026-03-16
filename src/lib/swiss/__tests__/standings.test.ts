import { describe, it, expect } from 'vitest';
import { calculateStandings } from '../standings';
import { Tournament, Player, Round, Match } from '@/types';

// --- helpers ---

function mkPlayer(id: string, name?: string, status: 'active' | 'dropped' = 'active'): Player {
  return { id, name: name ?? id, status };
}

function mkMatch(
  p1: string,
  p2: string,
  p1Wins: number,
  p2Wins: number,
  draws = 0,
): Match {
  const isDraw = p1Wins === p2Wins;
  const winnerId = isDraw ? null : p1Wins > p2Wins ? p1 : p2;
  return {
    id: `m-${p1}-${p2}`,
    player1Id: p1,
    player2Id: p2,
    games: { player1Wins: p1Wins, player2Wins: p2Wins, draws },
    winnerId,
    isBye: false,
    isDraw,
    isCompleted: true,
  };
}

function mkByeMatch(playerId: string): Match {
  return {
    id: `bye-${playerId}`,
    player1Id: playerId,
    player2Id: null,
    games: { player1Wins: 2, player2Wins: 0, draws: 0 },
    winnerId: playerId,
    isBye: true,
    isDraw: false,
    isCompleted: true,
  };
}

function mkRound(roundNumber: number, matches: Match[], isCompleted = true): Round {
  return { roundNumber, matches, isCompleted };
}

function mkTournament(players: Player[], rounds: Round[]): Tournament {
  return {
    id: 't1',
    name: 'Test',
    bestOf: 3,
    totalRounds: 3,
    phase: 'rounds',
    players,
    rounds,
    createdAt: '',
  };
}

// --- tests ---

describe('calculateStandings', () => {
  it('returns empty array for zero players', () => {
    const t = mkTournament([], []);
    expect(calculateStandings(t)).toEqual([]);
  });

  it('ranks players by match wins (match points descending)', () => {
    const players = [mkPlayer('A'), mkPlayer('B'), mkPlayer('C')];
    // A beats B, A beats C, B beats C → A 2-0, B 1-1, C 0-2
    const rounds = [
      mkRound(1, [mkMatch('A', 'B', 2, 0)]),
      mkRound(2, [mkMatch('A', 'C', 2, 0), mkMatch('B', 'C', 2, 1)]),
    ];
    const t = mkTournament(players, rounds);
    const standings = calculateStandings(t);

    expect(standings[0].playerId).toBe('A');
    expect(standings[1].playerId).toBe('B');
    expect(standings[2].playerId).toBe('C');

    expect(standings[0].matchPoints).toBe(6); // 2 wins × 3
    expect(standings[1].matchPoints).toBe(3); // 1 win × 3
    expect(standings[2].matchPoints).toBe(0);
  });

  it('assigns same rank to players with identical tiebreakers', () => {
    // Two players with no matches → both 0 MP, same OMW/GW/OGW → tied rank 1
    const players = [mkPlayer('A'), mkPlayer('B')];
    const t = mkTournament(players, []);
    const standings = calculateStandings(t);

    expect(standings[0].rank).toBe(1);
    expect(standings[1].rank).toBe(1);
  });

  it('assigns same rank when MP equal but tiebreakers also equal', () => {
    // A beats C, B beats D → A and B both 1-0, symmetric opponents
    const players = [mkPlayer('A'), mkPlayer('B'), mkPlayer('C'), mkPlayer('D')];
    const rounds = [
      mkRound(1, [mkMatch('A', 'C', 2, 0), mkMatch('B', 'D', 2, 0)]),
    ];
    const t = mkTournament(players, rounds);
    const standings = calculateStandings(t);

    const rankA = standings.find((s) => s.playerId === 'A')!.rank;
    const rankB = standings.find((s) => s.playerId === 'B')!.rank;
    expect(rankA).toBe(rankB);

    const rankC = standings.find((s) => s.playerId === 'C')!.rank;
    const rankD = standings.find((s) => s.playerId === 'D')!.rank;
    expect(rankC).toBe(rankD);
  });

  it('separates rank by tiebreaker (OMW%) when match points are equal', () => {
    // Setup: A and B both 1-0, but A's opponent (C) won another match, so A has higher OMW%
    const players = [mkPlayer('A'), mkPlayer('B'), mkPlayer('C'), mkPlayer('D')];
    const rounds = [
      mkRound(1, [
        mkMatch('A', 'C', 2, 0),
        mkMatch('B', 'D', 2, 0),
      ]),
      mkRound(2, [
        mkMatch('C', 'D', 2, 0), // C wins → C has 1-1, D has 0-2
      ]),
    ];
    const t = mkTournament(players, rounds);
    const standings = calculateStandings(t);

    const sA = standings.find((s) => s.playerId === 'A')!;
    const sB = standings.find((s) => s.playerId === 'B')!;
    // Both 1-0 (3 MP). A's opp C is 1-1 (50%), B's opp D is 0-2 (33% floor)
    expect(sA.matchPoints).toBe(sB.matchPoints);
    expect(sA.omwPercent).toBeGreaterThan(sB.omwPercent);
    // A should rank higher
    expect(sA.rank).toBeLessThan(sB.rank);
  });

  it('counts BYE as 2-0 match win', () => {
    const players = [mkPlayer('A')];
    const rounds = [mkRound(1, [mkByeMatch('A')])];
    const t = mkTournament(players, rounds);
    const standings = calculateStandings(t);

    expect(standings[0].matchWins).toBe(1);
    expect(standings[0].matchPoints).toBe(3);
    expect(standings[0].gameWins).toBe(2);
    expect(standings[0].gameLosses).toBe(0);
  });

  it('marks dropped players with isDropped flag', () => {
    const players = [mkPlayer('A'), mkPlayer('B', 'B', 'dropped')];
    const t = mkTournament(players, []);
    const standings = calculateStandings(t);

    const sA = standings.find((s) => s.playerId === 'A')!;
    const sB = standings.find((s) => s.playerId === 'B')!;
    expect(sA.isDropped).toBe(false);
    expect(sB.isDropped).toBe(true);
  });

  it('excludes incomplete rounds from calculation', () => {
    const players = [mkPlayer('A'), mkPlayer('B')];
    const incompleteRound = mkRound(1, [mkMatch('A', 'B', 2, 0)], false);
    const t = mkTournament(players, [incompleteRound]);
    const standings = calculateStandings(t);

    // No completed rounds → everyone 0 MP
    expect(standings[0].matchPoints).toBe(0);
    expect(standings[1].matchPoints).toBe(0);
  });

  it('handles draws correctly', () => {
    const players = [mkPlayer('A'), mkPlayer('B')];
    const drawMatch: Match = {
      id: 'draw-1',
      player1Id: 'A',
      player2Id: 'B',
      games: { player1Wins: 1, player2Wins: 1, draws: 1 },
      winnerId: null,
      isBye: false,
      isDraw: true,
      isCompleted: true,
    };
    const rounds = [mkRound(1, [drawMatch])];
    const t = mkTournament(players, rounds);
    const standings = calculateStandings(t);

    expect(standings[0].matchPoints).toBe(1); // draw = 1 point
    expect(standings[1].matchPoints).toBe(1);
    expect(standings[0].matchDraws).toBe(1);
  });

  it('computes OMW% with floor of 0.33', () => {
    // A beats B, B has 0 wins → B's MWP = 0, but OMW floor = 0.33
    const players = [mkPlayer('A'), mkPlayer('B')];
    const rounds = [mkRound(1, [mkMatch('A', 'B', 2, 0)])];
    const t = mkTournament(players, rounds);
    const standings = calculateStandings(t);

    const sA = standings.find((s) => s.playerId === 'A')!;
    expect(sA.omwPercent).toBeCloseTo(0.33, 2);
  });

  it('computes GW% correctly', () => {
    const players = [mkPlayer('A'), mkPlayer('B')];
    // A wins 2-1 → A: 2 game wins, 1 loss → GW% = (2*3)/(3*3) = 6/9
    const rounds = [mkRound(1, [mkMatch('A', 'B', 2, 1)])];
    const t = mkTournament(players, rounds);
    const standings = calculateStandings(t);

    const sA = standings.find((s) => s.playerId === 'A')!;
    expect(sA.gwPercent).toBeCloseTo(6 / 9, 5);

    const sB = standings.find((s) => s.playerId === 'B')!;
    expect(sB.gwPercent).toBeCloseTo(3 / 9, 5);
  });
});
