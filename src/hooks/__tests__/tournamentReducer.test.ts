import { describe, it, expect } from 'vitest';
import { tournamentReducer, TournamentState } from '../useTournament';
import { Round, Match, Tournament } from '@/types';

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'm1',
    player1Id: 'p1',
    player2Id: 'p2',
    games: { player1Wins: 0, player2Wins: 0, draws: 0 },
    winnerId: null,
    isBye: false,
    isDraw: false,
    isBothLoss: false,
    isCompleted: false,
    ...overrides,
  };
}

function makeRound(roundNumber: number, matches: Match[], isCompleted = false): Round {
  return { roundNumber, matches, isCompleted };
}

function makeTournament(overrides: Partial<Tournament> = {}): Tournament {
  return {
    id: 't1',
    name: 'Test',
    bestOf: 3,
    totalRounds: 3,
    phase: 'rounds',
    players: [
      { id: 'p1', name: 'Alice', status: 'active' },
      { id: 'p2', name: 'Bob', status: 'active' },
      { id: 'p3', name: 'Carol', status: 'active' },
      { id: 'p4', name: 'Dave', status: 'active' },
    ],
    rounds: [],
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeState(tournaments: Tournament[]): TournamentState {
  return { tournaments, loaded: true };
}

describe('RESHUFFLE_ROUND', () => {
  it('replaces the matching round by roundNumber', () => {
    const oldRound = makeRound(1, [makeMatch({ id: 'old-m1' }), makeMatch({ id: 'old-m2' })]);
    const tournament = makeTournament({ rounds: [oldRound] });
    const state = makeState([tournament]);

    const newRound = makeRound(1, [makeMatch({ id: 'new-m1' }), makeMatch({ id: 'new-m2' })]);

    const result = tournamentReducer(state, {
      type: 'RESHUFFLE_ROUND',
      payload: { tournamentId: 't1', round: newRound },
    });

    const updatedRound = result.tournaments[0].rounds[0];
    expect(updatedRound.matches).toHaveLength(2);
    expect(updatedRound.matches[0].id).toBe('new-m1');
    expect(updatedRound.matches[1].id).toBe('new-m2');
  });

  it('does not affect other rounds', () => {
    const round1 = makeRound(1, [makeMatch({ id: 'r1-m1' })], true);
    const round2 = makeRound(2, [makeMatch({ id: 'r2-m1' })]);
    const tournament = makeTournament({ rounds: [round1, round2] });
    const state = makeState([tournament]);

    const newRound1 = makeRound(1, [makeMatch({ id: 'new-m1' })]);

    const result = tournamentReducer(state, {
      type: 'RESHUFFLE_ROUND',
      payload: { tournamentId: 't1', round: newRound1 },
    });

    expect(result.tournaments[0].rounds[0].matches[0].id).toBe('new-m1');
    expect(result.tournaments[0].rounds[1].matches[0].id).toBe('r2-m1');
  });

  it('does not affect other tournaments', () => {
    const t1 = makeTournament({ id: 't1', rounds: [makeRound(1, [makeMatch({ id: 'old' })])] });
    const t2 = makeTournament({ id: 't2', rounds: [makeRound(1, [makeMatch({ id: 'keep' })])] });
    const state = makeState([t1, t2]);

    const newRound = makeRound(1, [makeMatch({ id: 'new' })]);

    const result = tournamentReducer(state, {
      type: 'RESHUFFLE_ROUND',
      payload: { tournamentId: 't1', round: newRound },
    });

    expect(result.tournaments[0].rounds[0].matches[0].id).toBe('new');
    expect(result.tournaments[1].rounds[0].matches[0].id).toBe('keep');
  });
});
