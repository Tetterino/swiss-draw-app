import { Tournament, PlayerStanding, Match, Round } from '@/types';

const WIN_POINTS = 3;
const DRAW_POINTS = 1;
const MIN_OMW_PERCENT = 0.33;

interface MatchRecord {
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  gameWins: number;
  gameLosses: number;
  gameDraws: number;
  opponents: string[];
  matchesPlayed: number;
}

function getMatchRecord(playerId: string, rounds: Round[]): MatchRecord {
  const record: MatchRecord = {
    matchWins: 0,
    matchLosses: 0,
    matchDraws: 0,
    gameWins: 0,
    gameLosses: 0,
    gameDraws: 0,
    opponents: [],
    matchesPlayed: 0,
  };

  for (const round of rounds) {
    if (!round.isCompleted) continue;
    for (const match of round.matches) {
      if (!match.isCompleted) continue;

      const isPlayer1 = match.player1Id === playerId;
      const isPlayer2 = match.player2Id === playerId;
      if (!isPlayer1 && !isPlayer2) continue;

      record.matchesPlayed++;

      if (match.isBye) {
        // BYE: count as 2-0 win
        record.matchWins++;
        record.gameWins += 2;
        continue;
      }

      const opponentId = isPlayer1 ? match.player2Id! : match.player1Id;
      record.opponents.push(opponentId);

      // Game wins/losses
      if (isPlayer1) {
        record.gameWins += match.games.player1Wins;
        record.gameLosses += match.games.player2Wins;
      } else {
        record.gameWins += match.games.player2Wins;
        record.gameLosses += match.games.player1Wins;
      }
      record.gameDraws += match.games.draws;

      // Match result
      if (match.isBothLoss) {
        record.matchLosses++;
      } else if (match.isDraw) {
        record.matchDraws++;
      } else if (match.winnerId === playerId) {
        record.matchWins++;
      } else {
        record.matchLosses++;
      }
    }
  }

  return record;
}

function getMatchPoints(record: MatchRecord): number {
  return record.matchWins * WIN_POINTS + record.matchDraws * DRAW_POINTS;
}

function getMatchWinPercent(record: MatchRecord): number {
  if (record.matchesPlayed === 0) return 0;
  const maxPoints = record.matchesPlayed * WIN_POINTS;
  return getMatchPoints(record) / maxPoints;
}

function getGameWinPercent(record: MatchRecord): number {
  const totalGames = record.gameWins + record.gameLosses + record.gameDraws;
  if (totalGames === 0) return 0;
  const gamePoints = record.gameWins * WIN_POINTS + record.gameDraws * DRAW_POINTS;
  const maxGamePoints = totalGames * WIN_POINTS;
  return gamePoints / maxGamePoints;
}

export function calculateStandings(tournament: Tournament): PlayerStanding[] {
  const completedRounds = tournament.rounds.filter((r) => r.isCompleted);

  // Build records for all players
  const records = new Map<string, MatchRecord>();
  for (const player of tournament.players) {
    records.set(player.id, getMatchRecord(player.id, completedRounds));
  }

  // Calculate OMW% for each player
  function calcOMWPercent(playerId: string): number {
    const record = records.get(playerId)!;
    if (record.opponents.length === 0) return MIN_OMW_PERCENT;

    const opponentMWPs = record.opponents.map((oppId) => {
      const oppRecord = records.get(oppId);
      if (!oppRecord) return MIN_OMW_PERCENT;
      return Math.max(getMatchWinPercent(oppRecord), MIN_OMW_PERCENT);
    });

    return opponentMWPs.reduce((sum, v) => sum + v, 0) / opponentMWPs.length;
  }

  // Calculate OGW% for each player
  function calcOGWPercent(playerId: string): number {
    const record = records.get(playerId)!;
    if (record.opponents.length === 0) return 0;

    const opponentGWPs = record.opponents.map((oppId) => {
      const oppRecord = records.get(oppId);
      if (!oppRecord) return 0;
      return getGameWinPercent(oppRecord);
    });

    return opponentGWPs.reduce((sum, v) => sum + v, 0) / opponentGWPs.length;
  }

  /** Opponent Total Point（対手累点）: 各対戦相手の現在のマッチポイントを合計 */
  function calcOpponentTotalPoint(playerId: string): number {
    const record = records.get(playerId)!;
    let sum = 0;
    for (const oppId of record.opponents) {
      const oppRecord = records.get(oppId);
      if (oppRecord) sum += getMatchPoints(oppRecord);
    }
    return sum;
  }

  /** Win Total Point（勝手累点）: 対戦して勝利した相手の、現在のマッチポイントを合計（BYE・引き分け・両敗は含めない） */
  function calcWinTotalPoint(playerId: string): number {
    let sum = 0;
    for (const round of completedRounds) {
      for (const match of round.matches) {
        if (!match.isCompleted) continue;

        const isPlayer1 = match.player1Id === playerId;
        const isPlayer2 = match.player2Id === playerId;
        if (!isPlayer1 && !isPlayer2) continue;
        if (match.isBye) continue;
        if (match.isBothLoss || match.isDraw) continue;
        if (match.winnerId !== playerId) continue;

        const opponentId = isPlayer1 ? match.player2Id! : match.player1Id;
        const oppRecord = records.get(opponentId);
        if (oppRecord) sum += getMatchPoints(oppRecord);
      }
    }
    return sum;
  }

  // Build standings
  const standings: PlayerStanding[] = tournament.players.map((player) => {
    const record = records.get(player.id)!;
    return {
      playerId: player.id,
      playerName: player.name,
      rank: 0,
      matchPoints: getMatchPoints(record),
      matchWins: record.matchWins,
      matchLosses: record.matchLosses,
      matchDraws: record.matchDraws,
      gameWins: record.gameWins,
      gameLosses: record.gameLosses,
      gameDraws: record.gameDraws,
      omwPercent: calcOMWPercent(player.id),
      gwPercent: getGameWinPercent(record),
      ogwPercent: calcOGWPercent(player.id),
      winTotalPoint: calcWinTotalPoint(player.id),
      opponentTotalPoint: calcOpponentTotalPoint(player.id),
      isDropped: player.status === 'dropped',
    };
  });

  // Sort: MP desc → OMW% desc → GW% desc → OGW% desc → Win Total Point desc → Opponent Total Point desc
  standings.sort((a, b) => {
    if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
    if (b.omwPercent !== a.omwPercent) return b.omwPercent - a.omwPercent;
    if (b.gwPercent !== a.gwPercent) return b.gwPercent - a.gwPercent;
    if (b.ogwPercent !== a.ogwPercent) return b.ogwPercent - a.ogwPercent;
    if (b.winTotalPoint !== a.winTotalPoint) {
      return b.winTotalPoint - a.winTotalPoint;
    }
    return b.opponentTotalPoint - a.opponentTotalPoint;
  });

  // Assign ranks (tied players share the same rank)
  standings.forEach((s, i) => {
    if (i === 0) {
      s.rank = 1;
    } else {
      const prev = standings[i - 1];
      const isTied =
        s.matchPoints === prev.matchPoints &&
        s.omwPercent === prev.omwPercent &&
        s.gwPercent === prev.gwPercent &&
        s.ogwPercent === prev.ogwPercent &&
        s.winTotalPoint === prev.winTotalPoint &&
        s.opponentTotalPoint === prev.opponentTotalPoint;
      s.rank = isTied ? prev.rank : i + 1;
    }
  });

  return standings;
}

export function getPlayerOpponents(playerId: string, rounds: Round[]): Set<string> {
  const opponents = new Set<string>();
  for (const round of rounds) {
    for (const match of round.matches) {
      if (match.player1Id === playerId && match.player2Id) {
        opponents.add(match.player2Id);
      } else if (match.player2Id === playerId) {
        opponents.add(match.player1Id);
      }
    }
  }
  return opponents;
}

export function hasHadBye(playerId: string, rounds: Round[]): boolean {
  for (const round of rounds) {
    for (const match of round.matches) {
      if (match.isBye && match.player1Id === playerId) {
        return true;
      }
    }
  }
  return false;
}
