import { TestBed } from '@angular/core/testing';
import { Auth, authState } from '@angular/fire/auth';
import { Router, UrlTree } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import * as authModule from '@angular/fire/auth';

import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const executeGuard = () =>
    TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    router.createUrlTree.and.returnValue({ redirected: true } as unknown as UrlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: {} },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('allows navigation when the user is authenticated', async () => {
    spyOn(authModule, 'authState').and.returnValue(of({ uid: 'user-1' } as any));

    const result = await firstValueFrom(executeGuard() as any);

    expect(result).toBeTrue();
  });

  it('redirects to the login page when the user is not authenticated', async () => {
    spyOn(authModule, 'authState').and.returnValue(of(null));

    const result = await firstValueFrom(executeGuard() as any);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    expect(result).toEqual(router.createUrlTree.calls.mostRecent().returnValue);
  });
});
