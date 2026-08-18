import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskForm } from './task-form';
import { provideFirebaseTestingMocks } from '../../testing/firebase-test-providers';

describe('TaskForm', () => {
  let component: TaskForm;
  let fixture: ComponentFixture<TaskForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskForm],
      providers: [provideFirebaseTestingMocks()],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
