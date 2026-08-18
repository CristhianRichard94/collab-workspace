import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Boards, extractBoardIdFromLink } from './boards';
import { provideFirebaseTestingMocks } from '../../testing/firebase-test-providers';

describe('Boards', () => {
  let component: Boards;
  let fixture: ComponentFixture<Boards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Boards],
      providers: [provideFirebaseTestingMocks(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Boards);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('joinBoard', () => {
    it('navigates to /join/:id when the pasted input parses to an id', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.joinLinkInput.set('https://example.com/join/abc123');
      component.joinBoard();

      expect(navigateSpy).toHaveBeenCalledWith(['join', 'abc123']);
    });

    it('does not navigate when the pasted input cannot be parsed', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.joinLinkInput.set('   ');
      component.joinBoard();

      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });
});

describe('extractBoardIdFromLink', () => {
  it('parses a /join/:id URL', () => {
    expect(extractBoardIdFromLink('https://app.example.com/join/board-42')).toBe('board-42');
  });

  it('parses a /boards/:id URL', () => {
    expect(extractBoardIdFromLink('https://app.example.com/boards/board-42?x=1')).toBe('board-42');
  });

  it('parses a bare id', () => {
    expect(extractBoardIdFromLink('board-42')).toBe('board-42');
  });

  it('returns null for empty input', () => {
    expect(extractBoardIdFromLink('   ')).toBeNull();
  });

  it('returns null for unparseable input', () => {
    expect(extractBoardIdFromLink('not a valid link at all!')).toBeNull();
  });
});
