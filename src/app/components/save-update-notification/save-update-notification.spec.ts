import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveUpdateNotification } from './save-update-notification';

describe('SaveUpdateNotification', () => {
  let component: SaveUpdateNotification;
  let fixture: ComponentFixture<SaveUpdateNotification>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveUpdateNotification],
    }).compileComponents();

    fixture = TestBed.createComponent(SaveUpdateNotification);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
