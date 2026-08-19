import { Component, computed, inject, input, output, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-invite-dialog',
  imports: [],
  templateUrl: './invite-dialog.html',
  styleUrl: './invite-dialog.css',
})
export class InviteDialog {
  private platformId = inject(PLATFORM_ID);

  boardId = input.required<string>();
  cancel = output<Event>();
  close = output<void>();

  linkCopied = signal(false);

  shareLink = computed(() => {
    if (!isPlatformBrowser(this.platformId)) return '';
    return `${location.origin}/join/${this.boardId()}`;
  });

  mailtoInviteLink = computed(() => {
    const subject = encodeURIComponent('Join my board');
    const body = encodeURIComponent(`Join my board here: ${this.shareLink()}`);
    return `mailto:?subject=${subject}&body=${body}`;
  });

  onCancel(event: Event) {
    this.cancel.emit(event);
  }

  async copyShareLink() {
    if (!isPlatformBrowser(this.platformId) || !navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(this.shareLink());
      this.linkCopied.set(true);
    } catch (e) {
      console.error(`Error copying share link: ${e}`);
    }
  }

  resetCopyState() {
    this.linkCopied.set(false);
  }
}
