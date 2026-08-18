import { TestBed } from '@angular/core/testing';
import gsap from 'gsap';

import { AnimationService } from './animation';

describe('AnimationService', () => {
  let service: AnimationService;
  let matchMediaSpy: ReturnType<typeof vi.fn>;

  function mockMatchMedia(matches: boolean) {
    matchMediaSpy = vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    window.matchMedia = matchMediaSpy as unknown as typeof window.matchMedia;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnimationService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('prefersReducedMotion', () => {
    it('returns true when the media query matches', () => {
      mockMatchMedia(true);
      expect(service.prefersReducedMotion()).toBe(true);
      expect(matchMediaSpy).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });

    it('returns false when the media query does not match', () => {
      mockMatchMedia(false);
      expect(service.prefersReducedMotion()).toBe(false);
    });
  });

  describe('run', () => {
    it('invokes fn() when reduced motion is not preferred', () => {
      mockMatchMedia(false);
      const fn = vi.fn();
      service.run(fn);
      expect(fn).toHaveBeenCalled();
    });

    it('skips fn() and applies the end state via gsap.set when reduced motion is preferred', () => {
      mockMatchMedia(true);
      const el = document.createElement('div');
      const fn = vi.fn();
      const gsapSetSpy = vi.spyOn(gsap, 'set');

      service.run(fn, { targets: el, endState: { opacity: 1 } });

      expect(fn).not.toHaveBeenCalled();
      expect(gsapSetSpy).toHaveBeenCalledWith(el, expect.objectContaining({ opacity: 1 }));
    });

    it('does nothing when reduced motion is preferred but no targets/endState are given', () => {
      mockMatchMedia(true);
      const fn = vi.fn();
      const gsapSetSpy = vi.spyOn(gsap, 'set');

      service.run(fn);

      expect(fn).not.toHaveBeenCalled();
      expect(gsapSetSpy).not.toHaveBeenCalled();
    });
  });

  describe('context', () => {
    it('returns a gsap.Context scoped to the given element', () => {
      const el = document.createElement('div');
      const ctx = service.context(el);
      expect(ctx).toBeDefined();
      ctx?.revert();
    });
  });
});
