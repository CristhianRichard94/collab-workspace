import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InviteDialog } from './invite-dialog';

describe('InviteDialog', () => {
  let component: InviteDialog;
  let fixture: ComponentFixture<InviteDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InviteDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(InviteDialog);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('boardId', 'test-board-id');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
