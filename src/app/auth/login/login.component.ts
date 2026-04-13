import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, authState, GoogleAuthProvider, signInWithPopup, UserCredential, signOut, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class LoginComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  isLogin: boolean = true;
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  currentUser: User | null = null;
  isLoading: boolean = false;
  errorMessage = '';
  successMessage = '';

  constructor(private auth: Auth, private router: Router) { }

  ngOnInit() {
    authState(this.auth)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (user) {
          this.currentUser = user;
          this.router.navigate(['/admin']);
        } else {
          this.currentUser = null;
        }
      });
  }

  toggleMode() {
    this.isLogin = !this.isLogin;
    this.clearFields();
    this.clearMessages();
  }

  clearFields() {
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
  }

  private clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private setError(message: string) {
    this.errorMessage = message;
    this.successMessage = '';
  }

  private setSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = '';
  }

  onLogin() {
    this.clearMessages();
    this.isLoading = true;
    signInWithEmailAndPassword(this.auth, this.email, this.password)
      .then((userCredential: UserCredential) => {
        this.isLoading = false;
        this.router.navigate(['/admin']);
      })
      .catch((error) => {
        this.isLoading = false;
        this.setError('No se pudo iniciar sesión. Verifica tu correo y contraseña.');
      });
  }

  onRegister() {
    this.clearMessages();
    if (this.password !== this.confirmPassword) {
      this.setError('Las contraseñas no coinciden.');
      return;
    }

    createUserWithEmailAndPassword(this.auth, this.email, this.password)
      .then((_userCredential: UserCredential) => {
        this.toggleMode();
        this.setSuccess('Registro exitoso. Ahora puedes iniciar sesión.');
      })
      .catch((error) => {
        this.setError('No se pudo completar el registro.');
      });
  }

  onGoogleLogin() {
    this.clearMessages();
    const provider = new GoogleAuthProvider();
    signInWithPopup(this.auth, provider)
      .then((_result) => {
        this.router.navigate(['/admin']); // Redirigir al componente Admin
      })
      .catch((error) => {
        this.setError('No se pudo iniciar sesión con Google.');
      });
  }

  // Método para cerrar sesión
  logout() {
    this.clearMessages();
    signOut(this.auth)
      .then(() => {
        this.currentUser = null;
        this.router.navigate(['/auth/login']);
      })
      .catch((error) => {
        this.setError('No se pudo cerrar la sesión.');
      });
  }
}
