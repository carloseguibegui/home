import { Component, OnInit } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { Router } from '@angular/router'; // Importar Router
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  isLogin: boolean = true; // Estado para alternar entre login y registro
  email: string = '';
  password: string = '';
  confirmPassword: string = ''; // Solo para registro
  currentUser: any = null; // Almacena el usuario autenticado

  constructor(private auth: Auth, private router: Router) { } // Inyectar Router

  ngOnInit() {
    // Escuchar cambios en el estado de autenticación
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        console.log('Usuario persistido:', user);
        this.currentUser = user; // Guardar el usuario autenticado
        this.router.navigate(['/admin']); // Redirigir al componente Admin si está autenticado
      } else {
        console.log('No hay usuario autenticado');
        this.currentUser = null;
      }
    });
  }

  // Alternar entre login y registro
  toggleMode() {
    this.isLogin = !this.isLogin;
    this.clearFields();
  }

  // Limpiar los campos del formulario
  clearFields() {
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
  }

  // Manejar el login
  onLogin() {
    signInWithEmailAndPassword(this.auth, this.email, this.password)
      .then((userCredential) => {
        console.log('Usuario autenticado:', userCredential.user);
        alert('Inicio de sesión exitoso');
        this.router.navigate(['/admin']); // Redirigir al componente Admin
      })
      .catch((error) => {
        console.error('Error al iniciar sesión:', error);
        alert('Error al iniciar sesión: ' + error.message);
      });
  }

  // Manejar el registro
  onRegister() {
    if (this.password !== this.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    createUserWithEmailAndPassword(this.auth, this.email, this.password)
      .then((userCredential) => {
        console.log('Usuario registrado:', userCredential.user);
        alert('Registro exitoso');
        this.toggleMode(); // Cambiar a la vista de login después del registro
      })
      .catch((error) => {
        console.error('Error al registrarse:', error);
        alert('Error al registrarse: ' + error.message);
      });
  }

  // Manejar el inicio de sesión con Google
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
}
