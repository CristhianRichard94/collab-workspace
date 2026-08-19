import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { InviteDialog } from './invite-dialog';

describe('InviteDialog', () => {
  let component: InviteDialog;
  let fixture: ComponentFixture<InviteDialog>;

  async function setup(platformId: 'browser' | 'server' = 'browser') {
    await TestBed.configureTestingModule({
      imports: [InviteDialog],
      providers: [{ provide: PLATFORM_ID, useValue: platformId }],
    }).compileComponents();

    fixture = TestBed.createComponent(InviteDialog);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('boardId', 'test-board-id');
    await fixture.whenStable();
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  describe('shareLink', () => {
    it('builds the join URL from the current origin and boardId on the browser', async () => {
      await setup('browser');
      expect(component.shareLink()).toBe(`${location.origin}/join/test-board-id`);
    });

    it('is empty when not running in a browser', async () => {
      await setup('server');
      expect(component.shareLink()).toBe('');
    });
  });

  describe('mailtoInviteLink', () => {
    it('encodes a mailto link with subject and body containing the share link', async () => {
      await setup('browser');
      const link = component.mailtoInviteLink();

      expect(link).toContain('mailto:?subject=Join%20my%20board');
      expect(link).toContain(encodeURIComponent(component.shareLink()));
    });
  });

  describe('copyShareLink', () => {
    it('writes the share link to the clipboard and marks it copied on success', async () => {
      await setup('browser');
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      await component.copyShareLink();

      expect(writeText).toHaveBeenCalledWith(component.shareLink());
      expect(component.linkCopied()).toBe(true);
    });

    it('logs and does not set linkCopied when the clipboard write rejects', async () => {
      await setup('browser');
      const error = new Error('denied');
      Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(error) } });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await component.copyShareLink();

      expect(component.linkCopied()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error copying share link'));
    });

    it('does nothing when not running in a browser', async () => {
      await setup('server');
      const writeText = vi.fn();
      Object.assign(navigator, { clipboard: { writeText } });

      await component.copyShareLink();

      expect(writeText).not.toHaveBeenCalled();
      expect(component.linkCopied()).toBe(false);
    });

    it('does nothing when the clipboard API is unavailable', async () => {
      await setup('browser');
      const original = (navigator as unknown as { clipboard?: unknown }).clipboard;
      Object.assign(navigator, { clipboard: undefined });

      await expect(component.copyShareLink()).resolves.toBeUndefined();
      expect(component.linkCopied()).toBe(false);

      Object.assign(navigator, { clipboard: original });
    });
  });

  describe('resetCopyState', () => {
    it('resets linkCopied back to false', async () => {
      await setup('browser');
      Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
      await component.copyShareLink();
      expect(component.linkCopied()).toBe(true);

      component.resetCopyState();

      expect(component.linkCopied()).toBe(false);
    });
  });

  describe('onCancel', () => {
    it('emits the cancel output with the source event', async () => {
      await setup();
      const emitted: Event[] = [];
      component.cancel.subscribe((event) => emitted.push(event));
      const cancelEvent = new Event('cancel');

      component.onCancel(cancelEvent);

      expect(emitted).toEqual([cancelEvent]);
    });
  });
});
