'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { Tournament, Player, Round, Match, GameResult, TournamentPhase } from '@/types';
import { loadTournaments, saveTournaments } from '@/lib/storage';

// Actions
type TournamentAction =
  | { type: 'LOAD_TOURNAMENTS'; payload: Tournament[] }
  | { type: 'CREATE_TOURNAMENT'; payload: { name: string; bestOf: number } }
  | { type: 'DELETE_TOURNAMENT'; payload: string }
  | { type: 'ADD_PLAYER'; payload: { tournamentId: string; name: string } }
  | { type: 'ADD_PLAYERS_BULK'; payload: { tournamentId: string; names: string[] } }
  | { type: 'REMOVE_PLAYER'; payload: { tournamentId: string; playerId: string } }
  | { type: 'DROP_PLAYER'; payload: { tournamentId: string; playerId: string } }
  | { type: 'START_TOURNAMENT'; payload: { tournamentId: string; rounds: Round[] } }
  | { type: 'UPDATE_MATCH_RESULT'; payload: { tournamentId: string; roundNumber: number; matchId: string; games: GameResult; winnerId: string | null; isDraw: boolean } }
  | { type: 'COMPLETE_ROUND'; payload: { tournamentId: string; roundNumber: number } }
  | { type: 'ADD_ROUND'; payload: { tournamentId: string; round: Round } }
  | { type: 'FINISH_TOURNAMENT'; payload: string }
  | { type: 'UNDO_LAST_ROUND'; payload: { tournamentId: string } };

interface TournamentState {
  tournaments: Tournament[];
  loaded: boolean;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function calculateTotalRounds(playerCount: number): number {
  if (playerCount <= 1) return 1;
  return Math.ceil(Math.log2(playerCount));
}

export function resolvePlayerName(name: string, existingNames: string[]): string {
  if (!existingNames.includes(name)) return name;
  let n = 2;
  while (existingNames.includes(`${name} (${n})`)) n++;
  return `${name} (${n})`;
}

function tournamentReducer(state: TournamentState, action: TournamentAction): TournamentState {
  switch (action.type) {
    case 'LOAD_TOURNAMENTS':
      return { ...state, tournaments: action.payload, loaded: true };

    case 'CREATE_TOURNAMENT': {
      const newTournament: Tournament = {
        id: generateId(),
        name: action.payload.name,
        bestOf: action.payload.bestOf,
        totalRounds: 0,
        phase: 'registration',
        players: [],
        rounds: [],
        createdAt: new Date().toISOString(),
      };
      return { ...state, tournaments: [...state.tournaments, newTournament] };
    }

    case 'DELETE_TOURNAMENT':
      return { ...state, tournaments: state.tournaments.filter((t) => t.id !== action.payload) };

    case 'ADD_PLAYER': {
      return {
        ...state,
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.payload.tournamentId) return t;
          const resolvedName = resolvePlayerName(action.payload.name, t.players.map((p) => p.name));
          const newPlayer: Player = { id: generateId(), name: resolvedName, status: 'active' };
          return { ...t, players: [...t.players, newPlayer] };
        }),
      };
    }

    case 'ADD_PLAYERS_BULK': {
      return {
        ...state,
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.payload.tournamentId) return t;
          const allNames = t.players.map((p) => p.name);
          const newPlayers: Player[] = action.payload.names.map((name) => {
            const resolvedName = resolvePlayerName(name, allNames);
            allNames.push(resolvedName);
            return { id: generateId(), name: resolvedName, status: 'active' as const };
          });
          return { ...t, players: [...t.players, ...newPlayers] };
        }),
      };
    }

    case 'REMOVE_PLAYER': {
      return {
        ...state,
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.payload.tournamentId) return t;
          return { ...t, players: t.players.filter((p) => p.id !== action.payload.playerId) };
        }),
      };
    }

    case 'DROP_PLAYER': {
      return {
        ...state,
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.payload.tournamentId) return t;
          return {
            ...t,
            players: t.players.map((p) =>
              p.id === action.payload.playerId ? { ...p, status: 'dropped' as const } : p
            ),
          };
        }),
      };
    }

    case 'START_TOURNAMENT': {
      return {
        ...state,
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.payload.tournamentId) return t;
          const activePlayers = t.players.filter((p) => p.status === 'active').length;
          return {
            ...t,
            phase: 'rounds' as TournamentPhase,
            totalRounds: calculateTotalRounds(activePlayers),
            rounds: action.payload.rounds,
          };
        }),
      };
    }

    case 'UPDATE_MATCH_RESULT': {
      return {
        ...state,
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.payload.tournamentId) return t;
          return {
            ...t,
            rounds: t.rounds.map((r) => {
              if (r.roundNumber !== action.payload.roundNumber) return r;
              return {
                ...r,
                matches: r.matches.map((m) => {
                  if (m.id !== action.payload.matchId) return m;
                  return {
                    ...m,
                    games: action.payload.games,
                    winnerId: action.payload.winnerId,
                    isDraw: action.payload.isDraw,
                    isCompleted: true,
                  };
                }),
              };
            }),
          };
        }),
      };
    }

    case 'COMPLETE_ROUND': {
      return {
        ...state,
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.payload.tournamentId) return t;
          return {
            ...t,
            rounds: t.rounds.map((r) => {
              if (r.roundNumber !== action.payload.roundNumber) return r;
              return { ...r, isCompleted: true };
            }),
          };
        }),
      };
    }

    case 'ADD_ROUND': {
      return {
        ...state,
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.payload.tournamentId) return t;
          return { ...t, rounds: [...t.rounds, action.payload.round] };
        }),
      };
    }

    case 'FINISH_TOURNAMENT': {
      return {
        ...state,
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.payload) return t;
          return { ...t, phase: 'finished' as TournamentPhase };
        }),
      };
    }

    case 'UNDO_LAST_ROUND': {
      return {
        ...state,
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.payload.tournamentId) return t;
          if (t.phase === 'finished') {
            // Re-open the last round
            return {
              ...t,
              phase: 'rounds' as TournamentPhase,
              rounds: t.rounds.map((r, i) =>
                i === t.rounds.length - 1 ? { ...r, isCompleted: false } : r
              ),
            };
          }
          // Remove the latest round and re-open the previous one
          const newRounds = t.rounds.slice(0, -1).map((r, i, arr) =>
            i === arr.length - 1 ? { ...r, isCompleted: false } : r
          );
          return { ...t, rounds: newRounds };
        }),
      };
    }

    default:
      return state;
  }
}

interface TournamentContextType {
  state: TournamentState;
  dispatch: React.Dispatch<TournamentAction>;
  getTournament: (id: string) => Tournament | undefined;
}

const TournamentContext = createContext<TournamentContextType | null>(null);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tournamentReducer, { tournaments: [], loaded: false });

  // Load from localStorage on mount
  useEffect(() => {
    const tournaments = loadTournaments();
    dispatch({ type: 'LOAD_TOURNAMENTS', payload: tournaments });
  }, []);

  // Save to localStorage on every state change
  useEffect(() => {
    if (state.loaded) {
      saveTournaments(state.tournaments);
    }
  }, [state.tournaments, state.loaded]);

  const getTournament = useCallback(
    (id: string) => state.tournaments.find((t) => t.id === id),
    [state.tournaments]
  );

  return (
    <TournamentContext.Provider value={{ state, dispatch, getTournament }}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
}
