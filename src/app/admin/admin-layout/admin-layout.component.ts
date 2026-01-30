import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SpinnerComponent } from "../../shared/spinner/spinner.component";
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { ClienteService } from '../../services/cliente.service';
import { MenuService } from '../../services/menu.service';

@Component({
        selector: 'app-admin-layout',
        imports: [RouterModule, SpinnerComponent, CommonModule],
        templateUrl: './admin-layout.component.html',
        styleUrls: ['./admin-layout.component.css', './sb-admin-2.min.css'],
        animations: [
                trigger('fadeInOut', [
                        transition(':enter', [
                                style({ opacity: 0 }),
                                animate('0ms ease-in', style({ opacity: 1 }))
                        ]),
                        transition(':leave', [
                                animate('500ms ease-out', style({ opacity: 0 }))
                        ])
                ]),
                trigger('fadeContent', [
                        transition(':enter', [
                                // style({ opacity: 0, transform: 'translateY(30px)' }),
                                style({ opacity: 0 }),
                                // animate('600ms 100ms cubic-bezier(0.23, 1, 0.32, 1)', style({ opacity: 1, transform: 'none' }))
                                animate('0ms ease-in', style({ opacity: 1 }))
                        ]),
                        transition(':leave', [
                                animate('0ms ease-out', style({ opacity: 0 }))
                        ])
                ])
        ]
})
export class AdminLayoutComponent implements OnInit {
        clienteId: string | null = null;
        nombreCliente: string | null = null;
        logoImage: string = '';
        loading = true;
        productosCount: number = 0;
        categoriasCount: number = 0;

        constructor(
                private authService: AuthService,
                private router: Router,
                private clienteService: ClienteService,
                private menuService: MenuService
        ) { }

        ngOnInit(): void {
                this.authService.getUsuarioActivo().then(async usuario => {
                        if (usuario && usuario.clienteId) {
                                this.clienteId = usuario.clienteId;
                                this.nombreCliente = await this.clienteService.getNombreCliente(this.clienteId);
                                this.logoImage = await this.clienteService.getLogoImage(this.clienteId);
                                await this.loadStats();
                        } else {
                                this.router.navigate(['/login']);
                        }
                });
                this.loading = false;
        }

        async loadStats(): Promise<void> {
                if (this.clienteId) {
                        try {
                                // Cargar estadísticas
                                const menu = await this.menuService.loadMenuFirestore(this.clienteId);
                                const categorias = await this.menuService.loadCategorias(this.clienteId);

                                // Contar productos
                                this.productosCount = menu.reduce((total, categoria) => {
                                        return total + (categoria.productos ? categoria.productos.length : 0);
                                }, 0);

                                // Contar categorías
                                this.categoriasCount = categorias.length;
                        } catch (error) {
                                console.error('Error al cargar estadísticas:', error);
                        }
                }
        }

        getProductosCount(): number {
                return this.productosCount;
        }

        getCategoriasCount(): number {
                return this.categoriasCount;
        }

        logout() {
                this.authService.logout();
        }
}