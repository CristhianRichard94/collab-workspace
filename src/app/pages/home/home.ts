import { afterNextRender, Component, DestroyRef, ElementRef, inject, viewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Layout } from '../../layout/layout';
import { HeroScramble } from '../../components/hero-scramble/hero-scramble';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Step {
  title: string;
  description: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, Layout, HeroScramble],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  features: Feature[] = [
    {
      icon: '🗂️',
      title: 'Drag-and-drop boards',
      description:
        'Move tasks between custom columns with smooth, CDK-powered drag and drop — reorder work the moment priorities change.',
    },
    {
      icon: '🧱',
      title: 'Custom columns',
      description:
        'Shape every board around your own workflow. Add, rename, and rearrange columns to match how your team actually works.',
    },
    {
      icon: '🔗',
      title: 'Shareable board links',
      description:
        'Invite teammates in seconds with a shareable board link — no lengthy setup, just join and start collaborating.',
    },
    {
      icon: '⚡',
      title: 'Real-time sync',
      description:
        'Every change syncs instantly across the team via Firestore, so everyone always sees the current state of the board.',
    },
  ];

  steps: Step[] = [
    {
      title: 'Create a board',
      description: 'Spin up a new board in seconds, ready with default columns for your workflow.',
    },
    {
      title: 'Drag tasks through the workflow',
      description: 'Move tasks from Todo to Done, dragging them across columns as work progresses.',
    },
    {
      title: 'Invite your team',
      description: 'Share a link and bring collaborators in to work on the board together, live.',
    },
  ];

  private destroyRef = inject(DestroyRef);
  private sections = viewChildren<ElementRef<HTMLElement>>('revealSection');

  constructor() {
    afterNextRender(() => {
      const media = matchMedia('(prefers-reduced-motion: reduce)');

      const revealAll = () => {
        this.sections().forEach((ref) => ref.nativeElement.classList.add('is-visible'));
      };

      // Scroll events don't bubble, so listen on the capture phase at the
      // document root — this stays valid even if the scrollable ancestor
      // (e.g. <main>) gets replaced by hydration after this listener attaches.
      // Re-read `sections()` on every check rather than caching nativeElements
      // once: hydration can swap the underlying nodes after this callback runs,
      // and stale ElementRefs would silently never intersect anything.
      const checkReveal = () => {
        const threshold = window.innerHeight * 0.85;
        let remaining = false;
        for (const ref of this.sections()) {
          const el = ref.nativeElement;
          if (el.classList.contains('is-visible')) continue;
          if (el.getBoundingClientRect().top < threshold) {
            el.classList.add('is-visible');
          } else {
            remaining = true;
          }
        }
        if (!remaining) {
          document.removeEventListener('scroll', checkReveal, true);
        }
      };

      if (media.matches) {
        revealAll();
      } else {
        checkReveal();
        document.addEventListener('scroll', checkReveal, { capture: true, passive: true });
      }

      const onChange = (event: MediaQueryListEvent) => {
        if (event.matches) {
          document.removeEventListener('scroll', checkReveal, true);
          revealAll();
        }
      };
      media.addEventListener('change', onChange);

      this.destroyRef.onDestroy(() => {
        media.removeEventListener('change', onChange);
        document.removeEventListener('scroll', checkReveal, true);
      });
    });
  }
}
