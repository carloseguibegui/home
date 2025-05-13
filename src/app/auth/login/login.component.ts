import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Importamos el servicio Auth y las funciones modulares necesarias
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { UserCredential } from 'firebase/auth'; // Útil para tipado


@Component({
  selector: 'app-login',
  // Si usas componentes standalone (recomendado con modular), descomenta la línea de abajo:
  standalone: true,
  imports: [CommonModule, FormsModule], // Esto funciona para standalone components o si lo importas en un NgModule
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  // Inyectamos los servicios usando 'inject'
  // Alternativa si no usas inject(): constructor(private auth: Auth, private router: Router) { }
  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);

  // Constructor (puede estar vacío si usas inject())
  constructor() { }

  // --- Métodos de Autenticación ---

  // Método para manejar el inicio de sesión (normalmente asociado a un botón de 'Login')
  async onLogin() {
    try {
      // Llamamos a la función signInWithEmailAndPassword del SDK modular
      const userCredential: UserCredential = await signInWithEmailAndPassword(this.auth, this.email, this.password);
      console.log('Usuario inició sesión con éxito:', userCredential.user);

      // Redirige al usuario a la página 'admin' tras el login exitoso
      this.router.navigate(['/admin']);

    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      // Manejo de errores básico. Puedes ser más específico según error.code
      // Por ejemplo: if (error.code === 'auth/user-not-found') { alert('Usuario no encontrado'); }
      // if (error.code === 'auth/wrong-password') { alert('Contraseña incorrecta'); }
      alert('Error al iniciar sesión: ' + error.message); // Mostrar un mensaje más informativo
    }
  }

  // Método para registrar un nuevo usuario (normalmente asociado a un botón de 'Registrar')
  // Nota: Si el registro se hace en otra página, este método debería estar allí.
  // Si está aquí, podrías llamarlo desde un botón de "Registrarse" o "Crear Cuenta".
  async onRegister() { // Renombrado a onRegister para consistencia con onLogin
    try {
      // Llamamos a la función createUserWithEmailAndPassword del SDK modular
      const userCredential: UserCredential = await createUserWithEmailAndPassword(this.auth, this.email, this.password);
      console.log('Usuario registrado con éxito:', userCredential.user);

      // Opciones después del registro:
      // 1. Redirigir al usuario a la página de admin inmediatamente:
      this.router.navigate(['/admin']);
      // 2. Mostrar un mensaje de éxito y no redirigir automáticamente:
      // alert('¡Usuario registrado con éxito! Ahora puedes iniciar sesión.');
      // 3. Redirigir a una página de confirmación o información:
      // this.router.navigate(['/registro-exitoso']);

    } catch (error: any) {
      console.error('Error al registrar usuario:', error);
      // Manejo de errores básico.
      // Por ejemplo: if (error.code === 'auth/email-already-in-use') { alert('El correo ya está registrado'); }
      alert('Error al registrar usuario: ' + error.message);
    }
  }


  // Método para cerrar la sesión del usuario
  async logoutUser() { // Este método quizás no lo necesites en la vista de login, sino en la vista de admin
    try {
      // Llamamos a la función signOut del SDK modular
      await signOut(this.auth);
      console.log('Usuario cerró sesión con éxito');
      // Redirige al usuario a la página de login después de cerrar sesión
      this.router.navigate(['/login']); // Asumiendo que tu ruta de login es '/login'
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      alert('Error al cerrar sesión: ' + error.message);
    }
  }

  // Método para navegar a la página de registro (si está en una ruta diferente)
  // Si el registro se maneja con el método onRegister en este mismo componente,
  // podrías no necesitar este método 'onGoToRegister'.
  onGoToRegisterPage() { // Nombre más descriptivo
    this.router.navigate(['/register']); // Asumiendo que tu ruta de registro es '/register'
  }
}
