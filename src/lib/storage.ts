import { Tournament } from '@/types';

const STORAGE_KEY = 'swiss-draw-tournaments';

export function loadTournaments(): Tournament[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveTournaments(tournaments: Tournament[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function loadTournament(id: string): Tournament | null {
  const tournaments = loadTournaments();
  return tournaments.find((t) => t.id === id) ?? null;
}

export function saveTournament(tournament: Tournament): void {
  const tournaments = loadTournaments();
  const index = tournaments.findIndex((t) => t.id === tournament.id);
  if (index >= 0) {
    tournaments[index] = tournament;
  } else {
    tournaments.push(tournament);
  }
  saveTournaments(tournaments);
}

export function deleteTournament(id: string): void {
  const tournaments = loadTournaments();
  saveTournaments(tournaments.filter((t) => t.id !== id));
}
