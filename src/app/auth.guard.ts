import { CanActivateFn,Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { map } from 'rxjs/operators';
import { inject } from '@angular/core';


export const authGuard: CanActivateFn = (route, state) => {
  const afAuth = inject(AngularFireAuth); // Inyectar AngularFireAuth
  const router = inject(Router); // Inyectar Router

  return afAuth.authState.pipe(
    map((user) => {
      if (user) {
        return true; // Usuario autenticado, permitir acceso
      } else {
        router.navigate(['/auth/login']); // Redirigir al login si no está autenticado
        return false;
      }
    })
  );
};