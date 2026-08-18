import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditableText } from './editable-text';

describe('EditableText', () => {
  let fixture: ComponentFixture<EditableText>;
  let component: EditableText;

  function mockMatchMedia(reduced: boolean) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('no-preference') ? !reduced : reduced,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })) as unknown as typeof window.matchMedia;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditableText],
    }).compileComponents();

    fixture = TestBed.createComponent(EditableText);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('value', 'Original title');
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.nativeElement.remove();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the value as text when not editing', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Original title');
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
  });

  describe('startEdit', () => {
    it('focuses the input immediately under prefers-reduced-motion, without waiting on a tween', async () => {
      mockMatchMedia(true);
      fixture.detectChanges();

      component.startEdit();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input).not.toBeNull();
      expect(document.activeElement).toBe(input);
    });

    it('focuses the input once it appears when motion is not reduced', async () => {
      mockMatchMedia(false);
      fixture.detectChanges();

      component.startEdit();
      // Wait for the gsap fade-out tween's onComplete to flip into edit mode.
      await new Promise((resolve) => setTimeout(resolve, 150));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input).not.toBeNull();
      expect(document.activeElement).toBe(input);
    });
  });

  describe('confirm/cancel', () => {
    it('emits save with the trimmed draft value on confirm', async () => {
      mockMatchMedia(true);
      fixture.detectChanges();
      const saveSpy = vi.fn();
      component.save.subscribe(saveSpy);

      component.startEdit();
      fixture.detectChanges();
      component.draft.set('  New title  ');
      component.confirm();

      expect(saveSpy).toHaveBeenCalledWith('New title');
      expect(component.editing()).toBe(false);
    });

    it('does not emit save when reverting to editing false via cancel', () => {
      mockMatchMedia(true);
      fixture.detectChanges();
      const saveSpy = vi.fn();
      component.save.subscribe(saveSpy);

      component.startEdit();
      component.draft.set('Something else');
      component.cancel();

      expect(saveSpy).not.toHaveBeenCalled();
      expect(component.editing()).toBe(false);
    });
  });
});
