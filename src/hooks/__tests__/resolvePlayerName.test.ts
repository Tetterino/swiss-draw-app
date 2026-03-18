import { describe, it, expect } from 'vitest';
import { resolvePlayerName } from '../useTournament';

describe('resolvePlayerName', () => {
  it('returns the name as-is when there are no duplicates', () => {
    expect(resolvePlayerName('田中', [])).toBe('田中');
    expect(resolvePlayerName('田中', ['佐藤', '鈴木'])).toBe('田中');
  });

  it('appends (2) when the name already exists', () => {
    expect(resolvePlayerName('田中', ['田中'])).toBe('田中 (2)');
  });

  it('increments the number when (2) is also taken', () => {
    expect(resolvePlayerName('田中', ['田中', '田中 (2)'])).toBe('田中 (3)');
  });

  it('finds the next available number with gaps', () => {
    expect(resolvePlayerName('田中', ['田中', '田中 (2)', '田中 (3)'])).toBe('田中 (4)');
  });

  it('handles bulk additions with duplicates within the batch', () => {
    const existing: string[] = [];
    const results: string[] = [];
    for (const name of ['田中', '田中', '田中']) {
      const resolved = resolvePlayerName(name, existing);
      existing.push(resolved);
      results.push(resolved);
    }
    expect(results).toEqual(['田中', '田中 (2)', '田中 (3)']);
  });

  it('handles bulk additions with pre-existing names', () => {
    const existing = ['田中', '佐藤'];
    const results: string[] = [];
    for (const name of ['田中', '佐藤', '田中']) {
      const resolved = resolvePlayerName(name, existing);
      existing.push(resolved);
      results.push(resolved);
    }
    expect(results).toEqual(['田中 (2)', '佐藤 (2)', '田中 (3)']);
  });
});
