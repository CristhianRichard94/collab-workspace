import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Board } from './board';
import { provideFirebaseTestingMocks } from '../../testing/firebase-test-providers';
import { AnimationService } from '../../services/animation';

describe('Board', () => {
  let component: Board;
  let fixture: ComponentFixture<Board>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Board],
      providers: [provideFirebaseTestingMocks(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Board);
    component = fixture.componentInstance;
    // Empty id keeps BoardService's board$ resource from ever touching the
    // (mocked) Firestore instance while still satisfying the required input.
    fixture.componentRef.setInput('id', '');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('dialog open/close', () => {
    let dialog: HTMLDialogElement;

    beforeEach(() => {
      // jsdom does not implement <dialog> behavior, so stub what we rely on
      // directly on the dialog the component template actually renders.
      dialog = document.getElementById('task-form-dialog') as HTMLDialogElement;
      if (!dialog) throw new Error('expected the task-form dialog to be rendered');
      dialog.showModal = vi.fn(() => {
        Object.defineProperty(dialog, 'open', { value: true, configurable: true });
      });
      dialog.close = vi.fn(() => {
        Object.defineProperty(dialog, 'open', { value: false, configurable: true });
      });
      Object.defineProperty(dialog, 'open', { value: false, configurable: true });

      // Force the synchronous, non-animated path so state settles immediately.
      const animationService = TestBed.inject(AnimationService);
      vi.spyOn(animationService, 'prefersReducedMotion').mockReturnValue(true);
    });

    afterEach(() => {
      delete (document as unknown as Record<string, unknown>)['activeElement'];
      vi.restoreAllMocks();
    });

    it('does not call showModal again when the dialog is already open', () => {
      component.createOrEditTask(0);
      expect(dialog.showModal).toHaveBeenCalledTimes(1);

      component.createOrEditTask(0);
      expect(dialog.showModal).toHaveBeenCalledTimes(1);
    });

    it('returns focus to the invoking element once the dialog closes', () => {
      const invoker = document.createElement('button');
      document.body.appendChild(invoker);
      vi.spyOn(invoker, 'focus');

      Object.defineProperty(document, 'activeElement', { value: invoker, configurable: true });

      component.createOrEditTask(0);
      expect(dialog.showModal).toHaveBeenCalledTimes(1);

      component.closeModal();

      expect(dialog.close).toHaveBeenCalledTimes(1);
      expect(invoker.focus).toHaveBeenCalledTimes(1);

      invoker.remove();
    });

    it('handles the Esc/cancel path by preventing default and closing the dialog', () => {
      component.createOrEditTask(0);
      expect(dialog.showModal).toHaveBeenCalledTimes(1);

      const cancelEvent = new Event('cancel', { cancelable: true });
      vi.spyOn(cancelEvent, 'preventDefault');

      component.onDialogCancel(cancelEvent, 'task-form');

      expect(cancelEvent.preventDefault).toHaveBeenCalled();
      expect(dialog.close).toHaveBeenCalledTimes(1);
      expect(component.editTask()).toBeNull();
    });
  });
});
