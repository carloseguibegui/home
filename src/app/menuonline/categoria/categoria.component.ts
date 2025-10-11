import {
        Component,
        OnInit,
        OnDestroy,
        Renderer2,
        ChangeDetectionStrategy,
        ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CopyrightComponent } from '../../shared/copyright/copyright.component';
import { HeaderComponent } from "../../shared/header/header.component";
import { BackgroundComponent } from "../../shared/background/background.component";
import { SearchBarComponent } from "../../shared/search-bar/search-bar.component";
import { ScrollToTopComponent } from "../../shared/scroll-to-top/scroll-to-top.component";
import { SliderComponent } from "../../shared/slider/slider.component";
import { SpinnerComponent } from "../../shared/spinner/spinner.component";
import { MenuService } from '../../services/menu.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil, filter } from 'rxjs/operators';

@Component({
        selector: 'app-categoria',
        standalone: true,
        imports: [
                CommonModule,
                RouterModule,
                CopyrightComponent,
                HeaderComponent,
                BackgroundComponent,
                SearchBarComponent,
                ScrollToTopComponent,
                SliderComponent,
                SpinnerComponent
        ],
        templateUrl: './categoria.component.html',
        styleUrls: ['./categoria.component.css'],
        changeDetection: ChangeDetectionStrategy.OnPush,
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
                                style({ opacity: 0 }),
                                animate('0ms ease-in', style({ opacity: 1 }))
                        ]),
                        transition(':leave', [
                                animate('0ms ease-out', style({ opacity: 0 }))
                        ])
                ])
        ]
})
export class CategoriaComponent implements OnInit, OnDestroy {
        // Propiedades públicas
        categorias: any[] = [];
        items: any[] = [];
        itemsOriginales: any[] = [];

        cliente: string = '';
        categoria: string = '';
        nombreCliente: string = '';
        nombreCategoria: string = '';
        item_placeholder: string = '';
        searchTerm: string = '';

        cardImage = '';
        logoImage = '';
        backgroundImage = '';

        lightboxVisible = false;
        lightboxImage = '';
        loading = true;
        visible = false;

        zoomLevel: number = 1;
        zoomTransform: string = 'scale(1)';

        // Propiedades privadas
        private destroy$ = new Subject<void>();
        private search$ = new Subject<string>();
        private isDragging = false;
        private startX = 0;
        private startY = 0;
        private offsetX = 0;
        private offsetY = 0;
        private lastTap = 0;
        private menuCache: any[] | null = null;
        private rafPending = false;
        private unlistenKeydown?: () => void;
        private openerEl: Element | null = null;

        constructor(
                private menuService: MenuService,
                private route: ActivatedRoute,
                private router: Router,
                private renderer: Renderer2,
                private firestore: Firestore,
                private titleService: Title,
                private cdr: ChangeDetectorRef
        ) { }

        get clienteClass(): string {
                return `cliente-${this.cliente.toLowerCase()}`;
        }

        async ngOnInit(): Promise<void> {
                try {
                        this.loading = true;
                        this.cdr.markForCheck();

                        // ✅ Limpia caché periódicamente
                        this.limpiarCachePeriodicamente();

                        // ✅ Debounce de búsqueda para evitar filtros en cada tecla
                        this.search$
                                .pipe(debounceTime(200), takeUntil(this.destroy$))
                                .subscribe((term) => {
                                        this.searchTerm = term;
                                        this.buscarProducto();
                                        this.cdr.markForCheck();
                                });

                        // ✅ Cerrar lightbox con ESC
                        this.unlistenKeydown = this.renderer.listen('window', 'keydown', (e: KeyboardEvent) => {
                                if (this.lightboxVisible && e.key === 'Escape') {
                                        this.closeLightbox();
                                }
                        });

                        // ✅ Escucha cambios en la URL
                        this.route.paramMap
                                .pipe(takeUntil(this.destroy$))
                                .subscribe(async (params) => {
                                        const nuevoCliente = params.get('cliente') || '';
                                        const nuevaCategoria = params.get('categoria') || '';

                                        if (!nuevoCliente) return;

                                        // ✅ Si cambió el cliente
                                        if (this.cliente !== nuevoCliente) {
                                                this.cliente = nuevoCliente;

                                                if (!(await this.verificarClienteActivo())) return;

                                                await this.obtenerNombreCliente();
                                                this.configurarImagenes();
                                                await this.cargarMenuCliente();

                                                this.cdr.markForCheck();
                                        }

                                        // ✅ Si cambió la categoría
                                        if (this.categoria !== nuevaCategoria) {
                                                this.categoria = nuevaCategoria;
                                                await this.cargarProductosPorCategoria();
                                                this.cdr.markForCheck();
                                        }

                                        this.loading = false;
                                        this.visible = true;
                                        this.cdr.markForCheck();
                                });

                        // ✅ Reinicia animaciones al navegar
                        this.router.events
                                .pipe(
                                        filter(event => event instanceof NavigationEnd),
                                        takeUntil(this.destroy$)
                                )
                                .subscribe(() => {
                                        const content = document.querySelector('.fade-in');
                                        if (content) {
                                                content.classList.remove('show');
                                                void (content as HTMLElement).offsetWidth;
                                                this.renderer.addClass(content, 'show');
                                        }
                                });
                } catch (error) {
                        console.error('Error en ngOnInit:', error);
                        this.loading = false;
                        this.router.navigate(['/']);
                }
        }

        /**
         * Carga y cachea el menú del cliente y deriva categorías
         */
        private async cargarMenuCliente(): Promise<void> {
                try {
                        const menu = await this.menuService.loadMenuFirestore(this.cliente);
                        this.menuCache = menu || [];
                        this.categorias = (this.menuCache || []).map((item: any) => ({
                                nombre: item.nombre,
                                route: item.route,
                                icon: item.icon
                        }));
                        this.cdr.markForCheck();
                } catch (error) {
                        console.error('Error al cargar menú del cliente:', error);
                        this.menuCache = [];
                        this.categorias = [];
                }
        }

        /**
         * Verifica si el cliente está activo
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
         * Obtiene el nombre del cliente
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
         * Configura las URLs de imágenes
         */
        private configurarImagenes(): void {
                const base = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.cliente}`;
                this.cardImage = `${base}%2Ffondo-claro.webp?alt=media`;
                this.logoImage = `${base}%2Flogo0.webp?alt=media`;
                this.backgroundImage = `${base}%2Fbackground_image.webp?alt=media`;
        }

        /**
         * Carga las categorías disponibles
         */
        private async cargarCategorias(): Promise<void> {
                try {
                        if (!this.menuCache) {
                                await this.cargarMenuCliente();
                                return;
                        }
                        this.categorias = this.menuCache.map((item: any) => ({
                                nombre: item.nombre,
                                route: item.route,
                                icon: item.icon
                        }));
                        this.cdr.markForCheck();
                } catch (error) {
                        console.error('Error al cargar categorías:', error);
                        this.categorias = [];
                }
        }

        /**
         * Carga los productos de la categoría seleccionada
         */
        private async cargarProductosPorCategoria(): Promise<void> {
                try {
                        if (!this.menuCache) {
                                await this.cargarMenuCliente();
                        }
                        const data = this.menuCache || [];
                        const objetoCategoria = data.find((item: any) => item.route === this.categoria);

                        if (objetoCategoria) {
                                this.nombreCategoria = objetoCategoria.nombre;
                                let productos = objetoCategoria.productos || [];

                                // ✅ Lógica especial para Requeterico
                                if (
                                        this.cliente.toLowerCase() === 'requeterico' &&
                                        this.categoria.toLowerCase() === 'tostados-sandwiches'
                                ) {
                                        const tostados = productos.filter((p: any) =>
                                                p.nombre.toLowerCase().includes('tostado')
                                        );
                                        const otros = productos.filter((p: any) =>
                                                !p.nombre.toLowerCase().includes('tostado')
                                        );
                                        productos = [...tostados, ...otros];
                                }

                                this.items = productos;
                                this.itemsOriginales = [...productos];

                                // ✅ Placeholder aleatorio
                                const randomIndex = Math.floor(Math.random() * this.items.length);
                                this.item_placeholder = this.items[randomIndex]?.nombre || '';
                        } else {
                                this.items = [];
                                this.itemsOriginales = [];
                        }

                        this.cdr.markForCheck();
                } catch (error) {
                        console.error('Error al cargar productos:', error);
                        this.items = [];
                        this.itemsOriginales = [];
                }
        }

        /**
         * Limpia el caché periódicamente
         */
        private limpiarCachePeriodicamente(): void {
                const now = Date.now();
                const lastCache = Number(localStorage.getItem('lastCacheClear') || '0');
                const onceDay = 24 * 60 * 60 * 1000;

                if (!lastCache || now - lastCache > onceDay) {
                        Object.keys(localStorage).forEach(key => {
                                if (key.startsWith('categorias_') || key.startsWith('data_')) {
                                        localStorage.removeItem(key);
                                }
                        });
                        localStorage.setItem('lastCacheClear', now.toString());
                }
        }

        /**
         * Búsqueda de productos
         */
        onSearch(term: string): void {
                this.search$.next(term);
        }

        private buscarProducto(): void {
                const termino = this.searchTerm.trim().toLowerCase();
                const normalizado = termino.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

                if (!normalizado) {
                        this.items = [...this.itemsOriginales];
                        this.cdr.markForCheck();
                        return;
                }

                const palabras = termino.split(' ');
                this.items = this.itemsOriginales.filter((producto: any) => {
                        const texto = `${producto.nombre} ${producto.descripcion}`.toLowerCase();
                        const textoNorm = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                        return palabras.every(p => textoNorm.includes(p));
                });

                this.cdr.markForCheck();
        }

        /**
         * Manejo de categoría seleccionada
         */
        onCategoriaSeleccionada(categoriaRoute: string): void {
                if (categoriaRoute === this.categoria) return;

                this.loading = true;
                this.cdr.markForCheck();
                this.router.navigate(['/menuonline', this.cliente, 'carta', categoriaRoute]);
        }

        /**
         * Lightbox - Abre imagen ampliada
         */
        openLightbox(imageUrl: string): void {
                this.openerEl = document.activeElement;

                // Preload imagen para evitar parpadeos
                const img = new Image();
                img.onload = () => {
                        this.lightboxImage = imageUrl;
                        this.cdr.markForCheck();
                        setTimeout(() => {
                                const closeBtn = document.querySelector('.lightbox-close') as HTMLElement | null;
                                closeBtn?.focus();
                        }, 0);
                };
                img.onerror = () => {
                        this.lightboxImage = imageUrl;
                        this.cdr.markForCheck();
                };
                img.src = imageUrl;

                // Mostrar overlay y preparar entorno
                this.lightboxVisible = true;
                this.zoomLevel = 1;
                this.offsetX = 0;
                this.offsetY = 0;
                this.updateTransform();
                document.body.classList.add('lightbox-open');
                this.applyPerformanceHacks();
                this.cdr.markForCheck();
        }

        /**
         * Lightbox - Cierra imagen ampliada
         */
        closeLightbox(event?: MouseEvent): void {
                if (!event || (event.target as HTMLElement).classList.contains('lightbox')) {
                        this.lightboxVisible = false;
                        this.lightboxImage = '';
                        this.zoomLevel = 1;
                        this.zoomTransform = 'scale(1)';
                        document.body.classList.remove('lightbox-open');
                        // Restaurar foco
                        if (this.openerEl instanceof HTMLElement) {
                                this.openerEl.focus();
                        }
                        this.cdr.markForCheck();
                }
        }

        /**
         * Zoom - Toggle
         */
        toggleZoom(): void {
                if (this.zoomLevel === 1) {
                        this.zoomLevel = 2;
                } else {
                        this.zoomLevel = 1;
                        this.offsetX = 0;
                        this.offsetY = 0;
                }
                this.updateTransform();
        }

        /**
         * Zoom - Double tap
         */
        handleDoubleTap(event: TouchEvent): void {
                const currentTime = Date.now();
                const tapLength = currentTime - this.lastTap;

                if (tapLength < 300 && tapLength > 0) {
                        event.preventDefault();
                        this.toggleZoom();
                        this.lastTap = 0;
                } else {
                        this.lastTap = currentTime;
                }
        }

        /**
         * Drag - Inicio
         */
        startDrag(event: MouseEvent | TouchEvent): void {
                if (this.zoomLevel === 1) return;

                const img = event.target as HTMLElement;
                img.classList.add('panning');
                this.isDragging = true;

                const clientX = this.getClientX(event);
                const clientY = this.getClientY(event);

                this.startX = clientX - this.offsetX;
                this.startY = clientY - this.offsetY;
        }

        /**
         * Drag - Durante
         */
        onDrag(event: MouseEvent | TouchEvent): void {
                if (!this.isDragging || this.zoomLevel === 1) return;

                event.preventDefault();
                const clientX = this.getClientX(event);
                const clientY = this.getClientY(event);

                this.offsetX = clientX - this.startX;
                this.offsetY = clientY - this.startY;
                this.scheduleTransform();
        }

        /**
         * Drag - Fin
         */
        endDrag(): void {
                this.isDragging = false;
                const img = document.querySelector('.lightbox-image');
                if (img) {
                        img.classList.remove('panning');
                        setTimeout(() => {
                                img.classList.add('smooth-transition');
                        }, 50);
                }
        }

        /**
         * Helper - Obtiene coordenada X
         */
        private getClientX(event: MouseEvent | TouchEvent): number {
                return event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
        }

        /**
         * Helper - Obtiene coordenada Y
         */
        private getClientY(event: MouseEvent | TouchEvent): number {
                return event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
        }

        /**
         * Helper - Actualiza transformación CSS
         */
        private updateTransform(): void {
                // Clamp offsets según tamaño de imagen vs viewport
                const container = document.querySelector('.lightbox') as HTMLElement | null;
                const img = document.querySelector('.lightbox-image') as HTMLElement | null;
                if (container && img) {
                        const containerRect = container.getBoundingClientRect();
                        const imgRect = img.getBoundingClientRect();
                        const maxX = Math.max(0, (imgRect.width - containerRect.width) / 2);
                        const maxY = Math.max(0, (imgRect.height - containerRect.height) / 2);
                        this.offsetX = Math.max(-maxX, Math.min(this.offsetX, maxX));
                        this.offsetY = Math.max(-maxY, Math.min(this.offsetY, maxY));
                }
                this.zoomTransform = `translate3d(${this.offsetX}px, ${this.offsetY}px, 0) scale(${this.zoomLevel})`;
        }

        /**
         * Throttle con requestAnimationFrame
         */
        private scheduleTransform(): void {
                if (this.rafPending) return;
                this.rafPending = true;
                requestAnimationFrame(() => {
                        this.updateTransform();
                        this.rafPending = false;
                        this.cdr.markForCheck();
                });
        }

        /**
         * Performance - Aplica aceleración por hardware
         */
        private applyPerformanceHacks(): void {
                const img = document.querySelector('.lightbox-image') as HTMLElement;
                if (img) {
                        img.style.transform = 'translateZ(0)';
                        img.style.willChange = 'transform';
                }
        }

        ngOnDestroy(): void {
                this.destroy$.next();
                this.destroy$.complete();
                if (this.unlistenKeydown) this.unlistenKeydown();
        }
}