import { describe, it, expect } from 'vitest';
import { selectByePlayer, createByeMatch } from '../bye';
import { Player, Round, Match, PlayerStanding } from '@/types';

// --- helpers ---

function mkPlayer(id: string): Player {
  return { id, name: id, status: 'active' };
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

function mkStanding(playerId: string, matchPoints: number): PlayerStanding {
  return {
    playerId,
    playerName: playerId,
    rank: 0,
    matchPoints,
    matchWins: 0,
    matchLosses: 0,
    matchDraws: 0,
    gameWins: 0,
    gameLosses: 0,
    gameDraws: 0,
    omwPercent: 0,
    gwPercent: 0,
    ogwPercent: 0,
    isDropped: false,
  };
}

// --- tests ---

describe('selectByePlayer', () => {
  it('selects the player with lowest match points', () => {
    const players = [mkPlayer('A'), mkPlayer('B'), mkPlayer('C')];
    const standings = [
      mkStanding('A', 6),
      mkStanding('B', 3),
      mkStanding('C', 0),
    ];

    const selected = selectByePlayer(players, [], standings);
    expect(selected!.id).toBe('C');
  });

  it('avoids player who already had a BYE', () => {
    const players = [mkPlayer('A'), mkPlayer('B'), mkPlayer('C')];
    const standings = [
      mkStanding('A', 6),
      mkStanding('B', 3),
      mkStanding('C', 3), // C already had BYE → 3 MP from BYE
    ];
    const rounds: Round[] = [
      { roundNumber: 1, matches: [mkByeMatch('C')], isCompleted: true },
    ];

    const selected = selectByePlayer(players, rounds, standings);
    // C had BYE already, so pick lowest MP among A & B → B (3 MP)
    expect(selected!.id).toBe('B');
  });

  it('falls back to all players when everyone has had BYE', () => {
    const players = [mkPlayer('A'), mkPlayer('B')];
    const standings = [
      mkStanding('A', 6),
      mkStanding('B', 3),
    ];
    const rounds: Round[] = [
      { roundNumber: 1, matches: [mkByeMatch('A')], isCompleted: true },
      { roundNumber: 2, matches: [mkByeMatch('B')], isCompleted: true },
    ];

    const selected = selectByePlayer(players, rounds, standings);
    // All have BYE → pick lowest MP → B
    expect(selected!.id).toBe('B');
  });

  it('returns null for empty player list', () => {
    const selected = selectByePlayer([], [], []);
    expect(selected).toBeNull();
  });
});

describe('createByeMatch', () => {
  it('creates a completed 2-0 BYE match', () => {
    const match = createByeMatch('P1');

    expect(match.player1Id).toBe('P1');
    expect(match.player2Id).toBeNull();
    expect(match.isBye).toBe(true);
    expect(match.isCompleted).toBe(true);
    expect(match.isDraw).toBe(false);
    expect(match.winnerId).toBe('P1');
    expect(match.games.player1Wins).toBe(2);
    expect(match.games.player2Wins).toBe(0);
    expect(match.games.draws).toBe(0);
  });

  it('generates a unique id', () => {
    const m1 = createByeMatch('P1');
    const m2 = createByeMatch('P1');
    expect(m1.id).not.toBe(m2.id);
  });
});
