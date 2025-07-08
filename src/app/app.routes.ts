import { Routes } from '@angular/router';
import { InicioComponent } from './inicio/inicio.component';
import { CartaComponent } from './menuonline/carta/carta.component';
import { CategoriaComponent } from './menuonline/categoria/categoria.component';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './auth.guard';
import { AdminComponent } from './admin/productos-admin/admin.component';
import { CategoriasAdminComponent } from './admin/categorias-admin/categorias-admin.component';
import { AdminLayoutComponent } from './admin/admin-layout/admin-layout.component';

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'menuonline/', pathMatch: 'full', component: InicioComponent },
  { path: 'menuonline/:cliente', pathMatch: 'full', redirectTo: 'menuonline/:cliente/carta'},
  { path: 'menuonline/:cliente/carta', component: CartaComponent },
  { path: 'menuonline/:cliente/carta/:categoria', component: CategoriaComponent, runGuardsAndResolvers: 'always'},
  { path: 'auth/login', component: LoginComponent },
  {
    path: 'admin',
    component: AdminLayoutComponent, // aquí va el wrapper
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'productos' }, // productos
      { path: 'productos', component: AdminComponent }, // productos
      { path: 'categorias', component: CategoriasAdminComponent },
      // otras rutas hijas...
    ]
  },
  { path: '**', component: InicioComponent }
];