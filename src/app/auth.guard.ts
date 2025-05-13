import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { from } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return from(new Promise<boolean>((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(true);
      } else {
        router.navigate(['/auth/login']);
        resolve(false);
      }
    });
  }));
};