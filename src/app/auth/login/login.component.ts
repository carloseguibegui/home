import { Component, OnInit } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, UserCredential, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

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
  isLogin: boolean = true;
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  currentUser: any = null;
  isLoading: boolean = false;

  constructor(private auth: Auth, private router: Router) { }

  ngOnInit() {
    // Persistencia automática de sesión (incluye Google)
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        console.log('Usuario persistido:', user);
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
  }

  clearFields() {
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
  }

  onLogin() {
    this.isLoading = true;
    signInWithEmailAndPassword(this.auth, this.email, this.password)
      .then((userCredential: UserCredential) => {
        this.isLoading = false;
        console.log('Usuario autenticado:', userCredential.user);
        this.router.navigate(['/admin']);
      })
      .catch((error) => {
        this.isLoading = false;
        console.error('Error al iniciar sesión:', error);
        alert('Error al iniciar sesión: ' + error.message);
      });
  }

  onRegister() {
    if (this.password !== this.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    createUserWithEmailAndPassword(this.auth, this.email, this.password)
      .then((userCredential: UserCredential) => {
        console.log('Usuario registrado:', userCredential.user);
        alert('Registro exitoso');
        this.toggleMode();
      })
      .catch((error) => {
        console.error('Error al registrarse:', error);
        alert('Error al registrarse: ' + error.message);
      });
  }

  onGoogleLogin() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(this.auth, provider)
      .then((result) => {
        console.log('Inicio de sesión con Google exitoso:', result.user);
        // alert('Inicio de sesión con Google exitoso');
        this.router.navigate(['/admin']); // Redirigir al componente Admin
      })
      .catch((error) => {
        console.error('Error al iniciar sesión con Google:', error);
        alert('Error al iniciar sesión con Google: ' + error.message);
      });
  }

  // Método para cerrar sesión
  logout() {
    signOut(this.auth)
      .then(() => {
        this.currentUser = null;
        this.router.navigate(['/auth/login']);
      })
      .catch((error) => {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión: ' + error.message);
      });
  }
}
