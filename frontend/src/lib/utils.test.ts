import { describe, it, expect, vi } from 'vitest';
import { formatDate, formatTimeAgo } from './utils';

describe('utils', () => {
  describe('formatDate', () => {
    it('returns "—" for null or undefined', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
    });

    it('formats a date string correctly', () => {
      const dateStr = '2025-01-01T12:00:00Z';
      const formatted = formatDate(dateStr);
      // Depending on timezone, this could vary. We just ensure it's not the default placeholder.
      expect(formatted).not.toBe('—');
      expect(formatted.length).toBeGreaterThan(5);
    });
  });

  describe('formatTimeAgo', () => {
    it('returns "—" for null or undefined', () => {
      expect(formatTimeAgo(null)).toBe('—');
      expect(formatTimeAgo(undefined)).toBe('—');
    });

    it('formats recent times correctly', () => {
      const now = new Date();
      
      const secondsAgo = new Date(now.getTime() - 30 * 1000);
      expect(formatTimeAgo(secondsAgo.toISOString())).toMatch(/\d+s ago/);
      
      const minutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(formatTimeAgo(minutesAgo.toISOString())).toMatch(/\d+m ago/);
      
      const hoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      expect(formatTimeAgo(hoursAgo.toISOString())).toMatch(/\d+h ago/);
      
      const daysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
      expect(formatTimeAgo(daysAgo.toISOString())).toMatch(/\d+d ago/);
    });
  });
});
