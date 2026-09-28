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

function mkByeMatch(id: string, playerId: string): Match {
  return makeMatch({
    id,
    player1Id: playerId,
    player2Id: null,
    games: { player1Wins: 2, player2Wins: 0, draws: 0 },
    winnerId: playerId,
    isBye: true,
    isCompleted: true,
  });
}

describe('ADD_PLAYERS_TO_ROUND', () => {
  it('プレイヤーを追加し、BYEを解消して対戦を組む', () => {
    const round = makeRound(1, [makeMatch({ id: 'm1' }), mkByeMatch('bye', 'p3')]);
    const tournament = makeTournament({
      players: [
        { id: 'p1', name: 'Alice', status: 'active' },
        { id: 'p2', name: 'Bob', status: 'active' },
        { id: 'p3', name: 'Carol', status: 'active' },
      ],
      rounds: [round],
    });

    const result = tournamentReducer(makeState([tournament]), {
      type: 'ADD_PLAYERS_TO_ROUND',
      payload: { tournamentId: 't1', roundNumber: 1, names: ['Dave'] },
    });

    const updated = result.tournaments[0];
    expect(updated.players).toHaveLength(4);
    expect(updated.players[3].name).toBe('Dave');
    expect(updated.players[3].status).toBe('active');

    const matches = updated.rounds[0].matches;
    expect(matches.filter((m) => m.isBye)).toHaveLength(0);
    expect(matches.find((m) => m.id === 'm1')).toEqual(makeMatch({ id: 'm1' }));
  });

  it('重複した名前は連番を付けて登録する', () => {
    const tournament = makeTournament({ rounds: [makeRound(1, [makeMatch({ id: 'm1' })])] });

    const result = tournamentReducer(makeState([tournament]), {
      type: 'ADD_PLAYERS_TO_ROUND',
      payload: { tournamentId: 't1', roundNumber: 1, names: ['Alice'] },
    });

    expect(result.tournaments[0].players[4].name).toBe('Alice (2)');
  });

  it('人数が増えて必要ラウンド数が増える場合は totalRounds を引き上げる', () => {
    // 4人 -> 2ラウンド。5人になると ceil(log2(5)) = 3ラウンド。
    const tournament = makeTournament({
      totalRounds: 2,
      rounds: [makeRound(1, [makeMatch({ id: 'm1' }), makeMatch({ id: 'm2', player1Id: 'p3', player2Id: 'p4' })])],
    });

    const result = tournamentReducer(makeState([tournament]), {
      type: 'ADD_PLAYERS_TO_ROUND',
      payload: { tournamentId: 't1', roundNumber: 1, names: ['Eve'] },
    });

    expect(result.tournaments[0].totalRounds).toBe(3);
  });

  it('totalRounds を減らすことはない', () => {
    const tournament = makeTournament({
      totalRounds: 5,
      rounds: [makeRound(1, [makeMatch({ id: 'm1' })])],
    });

    const result = tournamentReducer(makeState([tournament]), {
      type: 'ADD_PLAYERS_TO_ROUND',
      payload: { tournamentId: 't1', roundNumber: 1, names: ['Eve'] },
    });

    expect(result.tournaments[0].totalRounds).toBe(5);
  });

  it('確定済みのラウンドには追加しない', () => {
    const tournament = makeTournament({
      rounds: [makeRound(1, [makeMatch({ id: 'm1' })], true)],
    });

    const result = tournamentReducer(makeState([tournament]), {
      type: 'ADD_PLAYERS_TO_ROUND',
      payload: { tournamentId: 't1', roundNumber: 1, names: ['Eve'] },
    });

    expect(result.tournaments[0].players).toHaveLength(4);
    expect(result.tournaments[0].rounds[0].matches).toHaveLength(1);
  });

  it('空白だけの名前は無視する', () => {
    const tournament = makeTournament({ rounds: [makeRound(1, [makeMatch({ id: 'm1' })])] });

    const result = tournamentReducer(makeState([tournament]), {
      type: 'ADD_PLAYERS_TO_ROUND',
      payload: { tournamentId: 't1', roundNumber: 1, names: ['   ', ''] },
    });

    expect(result.tournaments[0].players).toHaveLength(4);
  });

  it('ラウンド2以降には追加しない', () => {
    const tournament = makeTournament({
      rounds: [
        makeRound(1, [makeMatch({ id: 'r1m1' })], true),
        makeRound(2, [makeMatch({ id: 'r2m1' })]),
      ],
    });

    const result = tournamentReducer(makeState([tournament]), {
      type: 'ADD_PLAYERS_TO_ROUND',
      payload: { tournamentId: 't1', roundNumber: 2, names: ['Eve'] },
    });

    expect(result.tournaments[0].players).toHaveLength(4);
    expect(result.tournaments[0].rounds[1].matches).toHaveLength(1);
  });

  it('存在しないラウンド番号は無視する', () => {
    const tournament = makeTournament({ rounds: [makeRound(1, [makeMatch({ id: 'm1' })])] });

    const result = tournamentReducer(makeState([tournament]), {
      type: 'ADD_PLAYERS_TO_ROUND',
      payload: { tournamentId: 't1', roundNumber: 1, names: ['Eve'] },
    });
    const missing = tournamentReducer(makeState([tournament]), {
      type: 'ADD_PLAYERS_TO_ROUND',
      payload: { tournamentId: 't1', roundNumber: 99, names: ['Eve'] },
    });

    expect(result.tournaments[0].players).toHaveLength(5);
    expect(missing.tournaments[0].players).toHaveLength(4);
  });

  it('複数人をまとめて追加できる', () => {
    const round = makeRound(1, [makeMatch({ id: 'm1' }), mkByeMatch('bye', 'p3')]);
    const tournament = makeTournament({
      players: [
        { id: 'p1', name: 'Alice', status: 'active' },
        { id: 'p2', name: 'Bob', status: 'active' },
        { id: 'p3', name: 'Carol', status: 'active' },
      ],
      rounds: [round],
    });

    const result = tournamentReducer(makeState([tournament]), {
      type: 'ADD_PLAYERS_TO_ROUND',
      payload: { tournamentId: 't1', roundNumber: 1, names: ['Dave', 'Eve', 'Frank'] },
    });

    const updated = result.tournaments[0];
    expect(updated.players.map((p) => p.name)).toEqual(['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank']);
    // 6人なのでBYEは出ない
    expect(updated.rounds[0].matches.filter((m) => m.isBye)).toHaveLength(0);
    expect(updated.rounds[0].matches).toHaveLength(3);
  });

  it('ドロップ済みのプレイヤーは必要ラウンド数の計算に含めない', () => {
    const tournament = makeTournament({
      totalRounds: 2,
      players: [
        { id: 'p1', name: 'Alice', status: 'active' },
        { id: 'p2', name: 'Bob', status: 'active' },
        { id: 'p3', name: 'Carol', status: 'dropped' },
        { id: 'p4', name: 'Dave', status: 'dropped' },
      ],
      rounds: [makeRound(1, [makeMatch({ id: 'm1' })])],
    });

    const result = tournamentReducer(makeState([tournament]), {
      type: 'ADD_PLAYERS_TO_ROUND',
      payload: { tournamentId: 't1', roundNumber: 1, names: ['Eve'] },
    });

    // アクティブは3人なので ceil(log2(3)) = 2。既存の 2 のまま
    expect(result.tournaments[0].totalRounds).toBe(2);
  });

  it('他の大会には影響しない', () => {
    const t1 = makeTournament({ id: 't1', rounds: [makeRound(1, [makeMatch({ id: 'm1' })])] });
    const t2 = makeTournament({ id: 't2', rounds: [makeRound(1, [makeMatch({ id: 'm1' })])] });

    const result = tournamentReducer(makeState([t1, t2]), {
      type: 'ADD_PLAYERS_TO_ROUND',
      payload: { tournamentId: 't1', roundNumber: 1, names: ['Eve'] },
    });

    expect(result.tournaments[0].players).toHaveLength(5);
    expect(result.tournaments[1].players).toHaveLength(4);
  });
});
