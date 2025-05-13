import { Routes } from '@angular/router';
import { InicioComponent } from './inicio/inicio.component';
import { CartaComponent } from './menuonline/carta/carta.component';
import { CategoriaComponent } from './menuonline/categoria/categoria.component';
import { LoginComponent } from './auth/login/login.component';

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'menuonline/:cliente/carta', component: CartaComponent },
  {
    path: 'menuonline/:cliente/carta/:categoria', component: CategoriaComponent, runGuardsAndResolvers: 'always'
  },
  { path: 'auth/login', component: LoginComponent },
  { path: '**', component: InicioComponent }
];