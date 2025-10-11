import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CopyrightComponent } from '../../shared/copyright/copyright.component';
import { HeaderComponent } from "../../shared/header/header.component";
import { BackgroundComponent } from "../../shared/background/background.component";
import { SpinnerComponent } from "../../shared/spinner/spinner.component";
import { Title } from '@angular/platform-browser';
import { MenuService } from '../../services/menu.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Subject } from 'rxjs';

@Component({
        selector: 'app-carta',
        standalone: true,
        imports: [RouterModule, CommonModule, CopyrightComponent, HeaderComponent, BackgroundComponent, SpinnerComponent],
        templateUrl: './carta.component.html',
        styleUrl: './carta.component.css',
        changeDetection: ChangeDetectionStrategy.OnPush,
        animations: [
                trigger('fadeInOut', [
                        transition(':enter', [
                                style({ opacity: 0 }),
                                animate('0ms ease-in', style({ opacity: 1 }))
                        ]),
                        transition(':leave', [
                                animate('300ms ease-out', style({ opacity: 0 }))
                        ])
                ]),
                trigger('fadeContent', [
                        transition(':enter', [
                                style({ opacity: 0 }),
                                animate('10ms ease-in', style({ opacity: 1 }))
                        ]),
                        transition(':leave', [
                                animate('0ms ease-out', style({ opacity: 0 }))
                        ])
                ])
        ]
})
export class CartaComponent implements OnInit, OnDestroy {
        categorias: any[] = [];
        cliente: string = '';
        nombreCliente: string = '';
        cardImage = '';
        logoImage = '';
        backgroundImage = '';
        visible = false;
        loading = true;

        private destroy$ = new Subject<void>();

        constructor(
                private menuService: MenuService,
                private route: ActivatedRoute,
                private router: Router,
                private titleService: Title,
                private firestore: Firestore,
                private cdr: ChangeDetectorRef
        ) { }

        get clienteClass(): string {
                return `cliente-${this.cliente.toLowerCase()}`;
        }

        async ngOnInit(): Promise<void> {
                try {
                        this.loading = true;
                        this.cdr.markForCheck();

                        // ✅ Obtén cliente de la ruta
                        this.cliente = this.route.snapshot.paramMap.get('cliente') || '';
                        if (!this.cliente) {
                                this.router.navigate(['/']);
                                return;
                        }

                        // ✅ Verifica que el cliente esté activo (en paralelo)
                        const isActive = await this.verificarClienteActivo();
                        if (!isActive) return;

                        // ✅ Configura imágenes
                        this.configurarImagenes();

                        // ✅ Obtiene el nombre del cliente
                        await this.obtenerNombreCliente();

                        // ✅ Carga categorías
                        await this.cargarCategorias();

                        this.loading = false;
                        this.visible = true;
                        this.cdr.markForCheck();
                } catch (error) {
                        console.error('Error en ngOnInit:', error);
                        this.loading = false;
                        this.router.navigate(['/']);
                }
        }

        /**
         * Verifica si el cliente está activo en Firestore
         */
        private async verificarClienteActivo(): Promise<boolean> {
                try {
                        const clienteRef = doc(this.firestore, `clientes/${this.cliente}`);
                        const clienteSnap = await getDoc(clienteRef);
                        if (!clienteSnap.exists() || clienteSnap.data()?.['esActivo'] === false) {
                                this.router.navigate(['/']);
                                return false;
                        }
                        return true;
                } catch {
                        this.router.navigate(['/']);
                        return false;
                }
        }

        /**
         * Configura las URLs de imágenes
         */
        private configurarImagenes(): void {
                const base = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.cliente}`;
                this.cardImage = `${base}%2Ffondo-claro.webp?alt=media`;
                this.logoImage = `${base}%2Flogo0.webp?alt=media`;
                this.backgroundImage = `${base}%2Fbackground_image.webp?alt=media`;
        }

        /**
         * Obtiene el nombre del cliente desde Firestore
         */
        private async obtenerNombreCliente(): Promise<void> {
                try {
                        const clienteRef = doc(this.firestore, `clientes/${this.cliente}`);
                        const clienteSnap = await getDoc(clienteRef);

                        if (clienteSnap.exists() && clienteSnap.data()?.['nombreCliente']) {
                                this.nombreCliente = clienteSnap.data()['nombreCliente'].toUpperCase();
                        } else {
                                this.nombreCliente = this.cliente.charAt(0).toUpperCase() + this.cliente.slice(1);
                        }

                        this.titleService.setTitle(`${this.nombreCliente} | Carta Digital`);
                } catch {
                        this.nombreCliente = this.cliente.charAt(0).toUpperCase() + this.cliente.slice(1);
                        this.titleService.setTitle(`${this.nombreCliente} | Carta Digital`);
                }
        }

        /**
         * Carga las categorías desde el servicio
         */
        private async cargarCategorias(): Promise<void> {
                try {
                        // ✅ Usa la promesa retornada por el servicio
                        const categorias = await this.menuService.loadCategorias(this.cliente, false, true);

                        if (categorias && categorias.length > 0) {
                                this.categorias = categorias;
                        }

                        this.cdr.markForCheck();
                } catch (error) {
                        console.error('Error al cargar categorías:', error);
                        this.categorias = [];
                }
        }

        ngOnDestroy(): void {
                this.destroy$.next();
                this.destroy$.complete();
        }
}