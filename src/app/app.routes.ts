import { Routes } from '@angular/router';
import { InicioComponent } from './inicio/inicio.component';

export const routes: Routes = [
    { path: '', component: InicioComponent },
    // { path: 'menuonline/:cliente/carta', component: CartaComponent },
    // { path: 'menuonline/:cliente/carta/:categoria', component: CategoriaComponent },
    { path: '**', redirectTo: '' }
  ];