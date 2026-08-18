import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Board } from './board';
import { provideFirebaseTestingMocks } from '../../testing/firebase-test-providers';

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
});
