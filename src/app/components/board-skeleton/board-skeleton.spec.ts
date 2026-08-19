import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardSkeleton } from './board-skeleton';

describe('BoardSkeleton', () => {
  let component: BoardSkeleton;
  let fixture: ComponentFixture<BoardSkeleton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardSkeleton],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardSkeleton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
