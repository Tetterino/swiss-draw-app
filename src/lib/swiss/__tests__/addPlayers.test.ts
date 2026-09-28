import { describe, it, expect } from 'vitest';
import { addPlayersToRound } from '../addPlayers';
import { generatePairings } from '../pairing';
import { calculateStandings } from '../standings';
import { Player, Tournament } from '@/types';
import { Round, Match } from '@/types';

// --- helpers ---

function mkMatch(id: string, p1: string, p2: string, overrides: Partial<Match> = {}): Match {
  return {
    id,
    player1Id: p1,
    player2Id: p2,
    games: { player1Wins: 0, player2Wins: 0, draws: 0 },
    winnerId: null,
    isBye: false,
    isDraw: false,
    isBothLoss: false,
    isCompleted: false,
    ...overrides,
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
    isBothLoss: false,
    isCompleted: true,
  };
}

function mkRound(matches: Match[]): Round {
  return { roundNumber: 1, matches, isCompleted: false };
}

function pairsOf(round: Round): string[][] {
  return round.matches
    .filter((m) => !m.isBye)
    .map((m) => [m.player1Id, m.player2Id!].sort());
}

// --- tests ---

describe('addPlayersToRound', () => {
  it('BYEがいるラウンドに1人追加するとBYEが解消される', () => {
    const round = mkRound([mkMatch('m1', 'p1', 'p2'), mkByeMatch('p3')]);

    const result = addPlayersToRound(round, ['new1']);

    expect(result.matches.filter((m) => m.isBye)).toHaveLength(0);
    expect(pairsOf(result)).toContainEqual(['new1', 'p3'].sort());
  });

  it('既存のマッチはid・対戦相手とも変更されない', () => {
    const round = mkRound([
      mkMatch('m1', 'p1', 'p2'),
      mkMatch('m2', 'p4', 'p5'),
      mkByeMatch('p3'),
    ]);

    const result = addPlayersToRound(round, ['new1']);

    const m1 = result.matches.find((m) => m.id === 'm1');
    const m2 = result.matches.find((m) => m.id === 'm2');
    expect(m1).toEqual(mkMatch('m1', 'p1', 'p2'));
    expect(m2).toEqual(mkMatch('m2', 'p4', 'p5'));
  });

  it('入力済みの結果を持つ既存マッチも保持される', () => {
    const played = mkMatch('m1', 'p1', 'p2', {
      games: { player1Wins: 2, player2Wins: 1, draws: 0 },
      winnerId: 'p1',
      isCompleted: true,
    });
    const round = mkRound([played, mkByeMatch('p3')]);

    const result = addPlayersToRound(round, ['new1']);

    expect(result.matches.find((m) => m.id === 'm1')).toEqual(played);
  });

  it('BYEがいないラウンドに1人追加するとその人がBYEになる', () => {
    const round = mkRound([mkMatch('m1', 'p1', 'p2')]);

    const result = addPlayersToRound(round, ['new1']);

    const byes = result.matches.filter((m) => m.isBye);
    expect(byes).toHaveLength(1);
    expect(byes[0].player1Id).toBe('new1');
    expect(result.matches.find((m) => m.id === 'm1')).toBeDefined();
  });

  it('BYEがいないラウンドに2人追加すると2人が対戦しBYEは出ない', () => {
    const round = mkRound([mkMatch('m1', 'p1', 'p2')]);

    const result = addPlayersToRound(round, ['new1', 'new2']);

    expect(result.matches.filter((m) => m.isBye)).toHaveLength(0);
    expect(pairsOf(result)).toContainEqual(['new1', 'new2'].sort());
  });

  it('BYEがいるラウンドに2人追加すると、BYEは既にBYEを受けた人以外に回る', () => {
    const round = mkRound([mkMatch('m1', 'p1', 'p2'), mkByeMatch('p3')]);

    // ランダム選択のため複数回試行する
    for (let i = 0; i < 30; i++) {
      const result = addPlayersToRound(round, ['new1', 'new2']);
      const byes = result.matches.filter((m) => m.isBye);
      expect(byes).toHaveLength(1);
      expect(byes[0].player1Id).not.toBe('p3');
    }
  });

  it('追加人数が0ならラウンドは変化しない', () => {
    const round = mkRound([mkMatch('m1', 'p1', 'p2'), mkByeMatch('p3')]);

    const result = addPlayersToRound(round, []);

    expect(result).toBe(round);
  });

  it('全員がちょうど1試合ずつに割り当てられる', () => {
    const round = mkRound([mkMatch('m1', 'p1', 'p2'), mkByeMatch('p3')]);

    const result = addPlayersToRound(round, ['new1', 'new2', 'new3']);

    const appearances = result.matches.flatMap((m) =>
      m.isBye ? [m.player1Id] : [m.player1Id, m.player2Id!]
    );
    expect(appearances.sort()).toEqual(['new1', 'new2', 'new3', 'p1', 'p2', 'p3'].sort());
  });
});

describe('addPlayersToRound で追加した後のラウンド2以降', () => {
  function mkPlayer(id: string): Player {
    return { id, name: id, status: 'active' };
  }

  function completeRound(round: Round): Round {
    return {
      ...round,
      isCompleted: true,
      matches: round.matches.map((m) =>
        m.isCompleted
          ? m
          : {
              ...m,
              games: { player1Wins: 2, player2Wins: 0, draws: 0 },
              winnerId: m.player1Id,
              isCompleted: true,
            }
      ),
    };
  }

  it('追加したプレイヤーもラウンド2のペアリングに含まれる', () => {
    const round1 = addPlayersToRound(
      mkRound([mkMatch('m1', 'p1', 'p2'), mkByeMatch('p3')]),
      ['new1']
    );
    const players = ['p1', 'p2', 'p3', 'new1'].map(mkPlayer);

    const round2 = generatePairings(players, [completeRound(round1)], 3, players);

    const appearances = round2.matches.flatMap((m) =>
      m.isBye ? [m.player1Id] : [m.player1Id, m.player2Id!]
    );
    expect(appearances.sort()).toEqual(['new1', 'p1', 'p2', 'p3']);
  });

  it('ラウンド1で当たった相手とはラウンド2で再戦しない', () => {
    const round1 = addPlayersToRound(
      mkRound([mkMatch('m1', 'p1', 'p2'), mkByeMatch('p3')]),
      ['new1']
    );
    const players = ['p1', 'p2', 'p3', 'new1'].map(mkPlayer);
    const completed = completeRound(round1);

    // 追加分のマッチ(new1 vs p3)の顔ぶれを控えておく
    const r1Pairs = new Set(
      completed.matches.filter((m) => !m.isBye).map((m) => [m.player1Id, m.player2Id!].sort().join('-'))
    );

    for (let i = 0; i < 20; i++) {
      const round2 = generatePairings(players, [completed], 3, players);
      for (const m of round2.matches) {
        if (m.isBye) continue;
        expect(r1Pairs.has([m.player1Id, m.player2Id!].sort().join('-'))).toBe(false);
      }
    }
  });

  it('追加したプレイヤーの成績が順位表に反映される', () => {
    const round1 = addPlayersToRound(
      mkRound([mkMatch('m1', 'p1', 'p2'), mkByeMatch('p3')]),
      ['new1']
    );
    const players = ['p1', 'p2', 'p3', 'new1'].map(mkPlayer);
    const tournament: Tournament = {
      id: 't1',
      name: 'Test',
      bestOf: 3,
      totalRounds: 2,
      phase: 'rounds',
      players,
      rounds: [completeRound(round1)],
      createdAt: '2026-01-01T00:00:00Z',
    };

    const standings = calculateStandings(tournament);

    expect(standings).toHaveLength(4);
    // 全員が1試合ずつ消化しているので、勝敗数の合計は 4 になる
    const played = standings.reduce((n, s) => n + s.matchWins + s.matchLosses + s.matchDraws, 0);
    expect(played).toBe(4);
    // 追加したプレイヤーも他と同じく1試合分の成績を持つ
    const added = standings.find((s) => s.playerId === 'new1')!;
    expect(added.matchWins + added.matchLosses + added.matchDraws).toBe(1);
  });
});
