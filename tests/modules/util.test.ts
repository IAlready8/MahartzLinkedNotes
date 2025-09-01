// Tests for utility functions
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  ULID, 
  nowISO, 
  debounce, 
  throttle, 
  uniq, 
  tokenize, 
  parseTags, 
  extractWikiLinks,
  hexToRgb,
  rgbToHex,
  getContrastColor
} from '@/modules/util';

describe('Utility Functions', () => {
  describe('ULID', () => {
    it('should generate unique IDs', () => {
      const id1 = ULID();
      const id2 = ULID();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(id1.length).toBe(16);
    });
  });

  describe('nowISO', () => {
    it('should return valid ISO date string', () => {
      const date = nowISO();
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(date).toISOString()).toBe(date);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn('call1');
      debouncedFn('call2');
      debouncedFn('call3');
      
      expect(mockFn).not.toHaveBeenCalled();
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call3');
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);
      
      throttledFn('call1');
      throttledFn('call2');
      throttledFn('call3');
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call1');
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      throttledFn('call4');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('call4');
    });
  });

  describe('uniq', () => {
    it('should remove duplicates from array', () => {
      expect(uniq([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(uniq(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
      expect(uniq([])).toEqual([]);
    });
  });

  describe('tokenize', () => {
    it('should tokenize strings correctly', () => {
      expect(tokenize('Hello world')).toEqual(['hello', 'world']);
      expect(tokenize('test-string_with#symbols')).toEqual(['test', 'string_with#symbols']);
      expect(tokenize('')).toEqual([]);
      expect(tokenize('123 abc')).toEqual(['123', 'abc']);
    });
  });

  describe('parseTags', () => {
    it('should parse tag strings correctly', () => {
      expect(parseTags('tag1, tag2, #tag3')).toEqual(['#tag1', '#tag2', '#tag3']);
      expect(parseTags('#test #another')).toEqual(['#test', '#another']);
      expect(parseTags('')).toEqual([]);
      expect(parseTags('duplicate, duplicate')).toEqual(['#duplicate']);
    });
  });

  describe('extractWikiLinks', () => {
    it('should extract wiki links from markdown', () => {
      const markdown = 'This has [[Link One]] and [[ID:abc123]] links.';
      expect(extractWikiLinks(markdown)).toEqual(['Link One', 'ID:abc123']);
      
      expect(extractWikiLinks('No links here')).toEqual([]);
      expect(extractWikiLinks('[[Single Link]]')).toEqual(['Single Link']);
    });
  });

  describe('Color utilities', () => {
    describe('hexToRgb', () => {
      it('should convert hex to RGB', () => {
        expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
        expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
        expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
        expect(hexToRgb('invalid')).toBe(null);
      });
    });

    describe('rgbToHex', () => {
      it('should convert RGB to hex', () => {
        expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
        expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
        expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
      });
    });

    describe('getContrastColor', () => {
      it('should return appropriate contrast colors', () => {
        expect(getContrastColor('#ffffff')).toBe('#000000'); // white -> black
        expect(getContrastColor('#000000')).toBe('#ffffff'); // black -> white
        expect(getContrastColor('#ff0000')).toBe('#ffffff'); // red -> white
      });
    });
  });
});