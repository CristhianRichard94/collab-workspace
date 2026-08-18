import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Join } from './join';
import { BoardService } from '../../services/board';
import { provideFirebaseTestingMocks } from '../../testing/firebase-test-providers';

describe('Join', () => {
  let component: Join;
  let fixture: ComponentFixture<Join>;
  let joinBoardMock: ReturnType<typeof vi.fn>;
  let navigateSpy: ReturnType<typeof vi.spyOn>;

  async function setup() {
    joinBoardMock = vi.fn().mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [Join],
      providers: [
        provideFirebaseTestingMocks(),
        provideRouter([]),
        { provide: BoardService, useValue: { joinBoard: joinBoardMock } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Join);
    component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  }

  it('joins the board for the given route id and navigates to the board on success', async () => {
    await setup();
    fixture.componentRef.setInput('id', 'board-1');
    await fixture.whenStable();
    await Promise.resolve();

    expect(joinBoardMock).toHaveBeenCalledWith('board-1');
    expect(navigateSpy).toHaveBeenCalledWith(['boards', 'board-1']);
  });

  it('flags an error and stays on the join page without auto-redirecting when joining fails', async () => {
    await setup();
    joinBoardMock.mockRejectedValue(new Error('not found'));

    fixture.componentRef.setInput('id', 'missing-board');
    await fixture.whenStable();
    await Promise.resolve();
    await Promise.resolve();

    expect(component.error()).toBe(true);
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
