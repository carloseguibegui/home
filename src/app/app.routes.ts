import { Routes } from '@angular/router';
import { CartaComponent } from './menuonline/carta/carta.component';
import { CategoriaComponent } from './menuonline/categoria/categoria.component';
import { InicioComponent } from './inicio/inicio.component';

export const routes: Routes = [
    { path: '', component: InicioComponent },
    {
        path: 'menuonline/:cliente/carta',
        component: CartaComponent,
    },
    {
        path: 'menuonline/:cliente/carta/:categoria',
        component: CategoriaComponent,
    },
    { path: '**', redirectTo: '' }
];