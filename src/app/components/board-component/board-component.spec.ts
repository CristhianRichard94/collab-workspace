import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardComponent } from './board-component';
import { provideFirebaseTestingMocks } from '../../testing/firebase-test-providers';

describe('BoardComponent', () => {
  let component: BoardComponent;
  let fixture: ComponentFixture<BoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardComponent],
      providers: [provideFirebaseTestingMocks()],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
