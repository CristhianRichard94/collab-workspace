import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

const CHARSET = '!<>-_\\/[]{}—=+*^?#';
const TYPE_CHAR_DELAY_MS = 50;
const HOLD_DELAY_MS = 1400;
const SCRAMBLE_FRAME_COUNT = 12;
const SCRAMBLE_FRAME_INTERVAL_MS = 35;

/**
 * Pure helper that resolves a single scramble animation frame.
 *
 * Each character in `target` resolves to its final value once `frame` reaches
 * that character's threshold (characters resolve left-to-right over the
 * course of `totalFrames`). Unresolved characters are replaced with a random
 * glyph from `charset`.
 */
export function resolveScrambleFrame(
  target: string,
  frame: number,
  totalFrames: number,
  charset: string,
  random: () => number = Math.random,
): string {
  let result = '';
  for (let i = 0; i < target.length; i++) {
    const threshold = Math.ceil(((i + 1) / target.length) * totalFrames);
    if (frame >= threshold) {
      result += target[i];
    } else {
      result += charset[Math.floor(random() * charset.length)];
    }
  }
  return result;
}

@Component({
  selector: 'app-hero-scramble',
  templateUrl: './hero-scramble.html',
  styleUrl: './hero-scramble.css',
  host: {
    '[style.min-width.ch]': 'maxWordLength()',
  },
})
export class HeroScramble {
  words = input<string[]>(['Organize', 'Ship', 'Collaborate', 'Focus']);

  // Initialized synchronously so server-rendered/pre-hydration HTML always
  // shows the first word instead of a blank gap.
  displayText = signal(this.words()[0] ?? '');

  // Reserves width for the longest word so the host never resizes as words
  // cycle, preventing wrap-driven layout shift in the hero heading.
  maxWordLength = computed(() =>
    this.words().reduce((max, word) => Math.max(max, word.length), 0),
  );

  private destroyRef = inject(DestroyRef);
  private timeoutId: ReturnType<typeof setTimeout> | undefined;
  private rafId: number | undefined;
  private destroyed = false;
  private reducedMotion = false;
  private started = false;
  private renderReady = false;

  constructor() {
    afterNextRender(() => {
      const media = matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion = media.matches;
      const onChange = (event: MediaQueryListEvent) => {
        this.reducedMotion = event.matches;
      };
      media.addEventListener('change', onChange);
      this.destroyRef.onDestroy(() => media.removeEventListener('change', onChange));

      this.renderReady = true;
      this.tryStart();
    });

    // Recover if `words` is initially empty and becomes non-empty later
    // (only takes effect once the reduced-motion preference is known).
    effect(() => {
      this.words();
      if (this.renderReady) this.tryStart();
    });

    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      if (this.timeoutId !== undefined) clearTimeout(this.timeoutId);
      if (this.rafId !== undefined) cancelAnimationFrame(this.rafId);
    });
  }

  private tryStart() {
    if (this.started || this.destroyed) return;
    if (this.words().length === 0) return;
    this.started = true;
    this.cycle(0);
  }

  private cycle(index: number) {
    if (this.destroyed) return;
    const words = this.words();
    if (words.length === 0) return;
    if (words.length === 1) {
      this.displayText.set(words[0]);
      return;
    }
    const word = words[index % words.length];

    if (this.reducedMotion) {
      this.displayText.set(word);
      this.timeoutId = setTimeout(() => this.cycle(index + 1), HOLD_DELAY_MS);
      return;
    }

    this.typeWord(word, () => {
      if (this.destroyed) return;
      this.timeoutId = setTimeout(() => {
        if (this.destroyed) return;
        const nextWord = words[(index + 1) % words.length];
        this.scramble(nextWord, () => {
          if (this.destroyed) return;
          this.timeoutId = setTimeout(() => this.cycle(index + 1), HOLD_DELAY_MS);
        });
      }, HOLD_DELAY_MS);
    });
  }

  private typeWord(word: string, onDone: () => void) {
    let i = 0;
    const step = () => {
      if (this.destroyed) return;
      i++;
      this.displayText.set(word.slice(0, i));
      if (i >= word.length) {
        onDone();
        return;
      }
      this.timeoutId = setTimeout(step, TYPE_CHAR_DELAY_MS);
    };
    step();
  }

  private scramble(target: string, onDone: () => void) {
    let frame = 0;
    let lastUpdate = 0;
    const step = (time: number) => {
      if (this.destroyed) return;
      if (time - lastUpdate >= SCRAMBLE_FRAME_INTERVAL_MS) {
        lastUpdate = time;
        frame++;
        if (frame >= SCRAMBLE_FRAME_COUNT) {
          this.displayText.set(target);
          onDone();
          return;
        }
        this.displayText.set(
          resolveScrambleFrame(target, frame, SCRAMBLE_FRAME_COUNT, CHARSET),
        );
      }
      this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  }
}
