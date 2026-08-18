import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-editable-text',
  template: `
    @if (editing()) {
      <input
        class="title-edit-input"
        [value]="draft()"
        (input)="draft.set($any($event.target).value)"
        (keydown.enter)="confirm()"
        (keydown.escape)="cancel()"
        (blur)="confirm()"
      />
    } @else {
      <span [title]="value()">{{ value() }}</span>
      <button type="button" class="edit-btn" (click)="startEdit()" [attr.aria-label]="ariaLabel()">✎</button>
    }
  `,
  styleUrl: './editable-text.css'
})
export class EditableText {
  value = input.required<string>();
  ariaLabel = input('Edit text');
  save = output<string>();

  editing = signal(false);
  draft = signal('');

  startEdit() {
    this.draft.set(this.value());
    this.editing.set(true);
  }

  cancel() {
    this.editing.set(false);
  }

  confirm() {
    const value = this.draft().trim();
    this.editing.set(false);
    if (!value || value === this.value()) return;
    this.save.emit(value);
  }
}
