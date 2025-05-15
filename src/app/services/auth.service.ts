import { Injectable } from '@angular/core';
import { Auth, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private auth: Auth, private router: Router) { }

  logout() {
    return signOut(this.auth).then(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}