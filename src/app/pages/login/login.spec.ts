import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, Subject } from 'rxjs';

import { Login } from './login';
import { Auth } from '@angular/fire/auth';
import { AuthService } from '../../services/auth';
import { BoardService } from '../../services/board';

const userMock = vi.fn();
const signInWithPopupMock = vi.fn();

vi.mock('@angular/fire/auth', () => ({
  Auth: class {},
  GoogleAuthProvider: class {},
  signInWithPopup: (...args: unknown[]) => signInWithPopupMock(...args),
  user: (...args: unknown[]) => userMock(...args),
}));

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let router: Router;

  async function setup(options: { platform?: 'browser' | 'server'; redirectTo?: string | null } = {}) {
    const { platform = 'browser', redirectTo = null } = options;

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: platform },
        { provide: Auth, useValue: {} },
        // Login renders Layout -> SaveUpdateNotification, which inject the
        // real AuthService/BoardService (both Firestore-backed). Stub them
        // out so this file only exercises Login's own logic.
        { provide: AuthService, useValue: { currentUser: signal(undefined), logout: vi.fn() } },
        {
          provide: BoardService,
          useValue: { isSaving: signal(false), hasUpdated: signal(false) },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(redirectTo ? { redirectTo } : {}) },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', async () => {
    userMock.mockReturnValue(of(null));
    await setup();
    await fixture.whenStable();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('navigates to the default redirect when a user is already signed in', async () => {
      userMock.mockReturnValue(of({ uid: 'u1' }));
      await setup();
      const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

      await fixture.whenStable();

      expect(navigateSpy).toHaveBeenCalledWith('/boards');
    });

    it('navigates to the redirectTo query param when present', async () => {
      userMock.mockReturnValue(of({ uid: 'u1' }));
      await setup({ redirectTo: '/board/123' });
      const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

      await fixture.whenStable();

      expect(navigateSpy).toHaveBeenCalledWith('/board/123');
    });

    it('does not navigate when no user is signed in', async () => {
      userMock.mockReturnValue(of(null));
      await setup();
      const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

      await fixture.whenStable();

      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('does not subscribe to auth state when not running in a browser', async () => {
      const subject = new Subject();
      userMock.mockReturnValue(subject);
      await setup({ platform: 'server' });
      const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

      await fixture.whenStable();
      subject.next({ uid: 'u1' });

      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  describe('signInWithGoogle', () => {
    it('signs in and navigates to the default redirect on success', async () => {
      userMock.mockReturnValue(of(null));
      signInWithPopupMock.mockResolvedValue({ user: { uid: 'u1' } });
      await setup();
      await fixture.whenStable();
      const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

      await component.signInWithGoogle();

      expect(signInWithPopupMock).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith('/boards');
    });

    it('navigates to the redirectTo query param on success', async () => {
      userMock.mockReturnValue(of(null));
      signInWithPopupMock.mockResolvedValue({ user: { uid: 'u1' } });
      await setup({ redirectTo: '/board/123' });
      await fixture.whenStable();
      const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

      await component.signInWithGoogle();

      expect(navigateSpy).toHaveBeenCalledWith('/board/123');
    });

    it('logs the error and does not navigate when sign-in fails', async () => {
      userMock.mockReturnValue(of(null));
      signInWithPopupMock.mockRejectedValue(new Error('popup closed'));
      await setup();
      await fixture.whenStable();
      const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await component.signInWithGoogle();

      expect(navigateSpy).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Authentication failed:', expect.any(Error));
    });
  });
});
