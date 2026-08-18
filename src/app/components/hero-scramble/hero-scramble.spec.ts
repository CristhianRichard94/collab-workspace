import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroScramble, resolveScrambleFrame } from './hero-scramble';

const WORDS = ['Organize', 'Ship', 'Collaborate', 'Focus'];

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

describe('HeroScramble', () => {
  let component: HeroScramble;
  let fixture: ComponentFixture<HeroScramble>;

  beforeEach(() => {
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function createComponent() {
    await TestBed.configureTestingModule({
      imports: [HeroScramble],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroScramble);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('words', WORDS);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', async () => {
    await createComponent();
    expect(component).toBeTruthy();
  });

  it('renders the first word after the initial typing sequence', async () => {
    vi.useFakeTimers();
    await createComponent();

    await vi.advanceTimersByTimeAsync(WORDS[0].length * 60);

    expect(component.displayText()).toBe(WORDS[0]);
  });

  it('cycles to the next word after the hold and scramble duration', async () => {
    vi.useFakeTimers();
    await createComponent();

    // Finish typing the first word.
    await vi.advanceTimersByTimeAsync(WORDS[0].length * 60);
    expect(component.displayText()).toBe(WORDS[0]);

    // Hold + scramble transition to the second word.
    await vi.advanceTimersByTimeAsync(1400 + 14 * 40);

    expect(component.displayText()).toBe(WORDS[1]);
  });

  it('skips scramble/typing animation when prefers-reduced-motion is set', async () => {
    mockMatchMedia(true);
    vi.useFakeTimers();
    await createComponent();

    // With reduced motion, the first word should be shown immediately, no per-char typing.
    expect(component.displayText()).toBe(WORDS[0]);

    await vi.advanceTimersByTimeAsync(1400);

    expect(component.displayText()).toBe(WORDS[1]);
  });

  it('cleans up timers/rAF on destroy without throwing', async () => {
    vi.useFakeTimers();
    await createComponent();

    await vi.advanceTimersByTimeAsync(100);

    expect(() => fixture.destroy()).not.toThrow();
  });
});

describe('resolveScrambleFrame', () => {
  it('fully resolves the target word once the frame reaches the total frame count', () => {
    const result = resolveScrambleFrame('AB', 2, 2, 'X');
    expect(result).toBe('AB');
  });

  it('returns scrambled characters from the charset before a character is resolved', () => {
    const result = resolveScrambleFrame('AB', 0, 2, 'X');
    expect(result).toBe('XX');
  });

  it('partially resolves characters based on their position and the current frame', () => {
    const result = resolveScrambleFrame('ABCD', 2, 4, 'X');
    expect(result).toBe('ABXX');
  });

  it('preserves target length regardless of frame count', () => {
    const result = resolveScrambleFrame('HELLO', 1, 10, 'X');
    expect(result.length).toBe(5);
  });
});
