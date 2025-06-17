import { Routes } from '@angular/router';
import { InicioComponent } from './inicio/inicio.component';
import { CartaComponent } from './menuonline/carta/carta.component';
import { CategoriaComponent } from './menuonline/categoria/categoria.component';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './auth.guard';
import { AdminComponent } from './admin/admin.component';

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'menuonline/:cliente', pathMatch: 'full', redirectTo: 'menuonline/:cliente/carta'},
  { path: 'menuonline/:cliente/carta', component: CartaComponent },
  { path: 'menuonline/:cliente/carta/:categoria', component: CategoriaComponent, runGuardsAndResolvers: 'always'},
  { path: 'auth/login', component: LoginComponent },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] }, // Ruta protegida
  { path: '**', component: InicioComponent }
];