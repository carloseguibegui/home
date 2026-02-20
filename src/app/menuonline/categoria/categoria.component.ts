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
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Dialog } from 'primeng/dialog';

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
                SpinnerComponent,
                ConfirmDialog,
                Dialog,
        ],
        templateUrl: './categoria.component.html',
        styleUrls: ['./categoria.component.css'],
        changeDetection: ChangeDetectionStrategy.OnPush,
        providers: [ConfirmationService],
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
        whatsappNumber: string = '';
        cartItems: Array<{
                key: string;
                nombre: string;
                cantidad: number;
                precio: string;
                unitPrice: number | null;
        }> = [];

        cardImage = '';
        logoImage = '';
        backgroundImage = '';

        lightboxVisible = false;
        lightboxImage = '';
        loading = true;
        visible = false;
        scrollToTopVisible = false;
        deliveryWarningShown = false;
        cartDialogVisible = false;

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
        private unlistenScroll?: () => void;
        private openerEl: Element | null = null;
        private readonly scrollToTopOffset = 1300;

        constructor(
                private menuService: MenuService,
                private route: ActivatedRoute,
                private router: Router,
                private renderer: Renderer2,
                private firestore: Firestore,
                private titleService: Title,
                private cdr: ChangeDetectorRef,
                private confirmationService: ConfirmationService
        ) { }

        get clienteClass(): string {
                return `cliente-${this.cliente.toLowerCase()}`;
        }

        get cartItemsCount(): number {
                return this.cartItems.reduce((total, item) => total + item.cantidad, 0);
        }

        get cartTotalLabel(): string {
                return this.buildTotalLabel();
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

                        // ✅ Reusar categorías ya cargadas desde el servicio (si venimos desde carta)
                        this.menuService.categoriasData$
                                .pipe(takeUntil(this.destroy$))
                                .subscribe((cats: any[]) => {
                                        if (cats && cats.length) {
                                                this.categorias = cats.map((c: any) => ({
                                                        nombre: c.nombre,
                                                        route: c.route,
                                                        icon: c.icon
                                                }));
                                                this.cdr.markForCheck();
                                        }
                                });

                        // ✅ Reusar menú completo (con productos) si ya fue cargado en carta
                        this.menuService.menuData$
                                .pipe(takeUntil(this.destroy$))
                                .subscribe((menu: any[]) => {
                                        if (menu && menu.length) {
                                                this.menuCache = menu;
                                                // También derivar categorías si aún no están
                                                if (!this.categorias || !this.categorias.length) {
                                                        this.categorias = menu.map((item: any) => ({
                                                                nombre: item.nombre,
                                                                route: item.route,
                                                                icon: item.icon
                                                        }));
                                                }
                                                this.cdr.markForCheck();
                                        }
                                });

                        // ✅ Cerrar lightbox con ESC
                        this.unlistenKeydown = this.renderer.listen('window', 'keydown', (e: KeyboardEvent) => {
                                if (this.lightboxVisible && e.key === 'Escape') {
                                        this.closeLightbox();
                                }
                        });

                        this.unlistenScroll = this.renderer.listen('window', 'scroll', () => {
                                const nextVisible = window.scrollY > this.scrollToTopOffset;
                                if (nextVisible !== this.scrollToTopVisible) {
                                        this.scrollToTopVisible = nextVisible;
                                        this.cdr.markForCheck();
                                }
                        });

                        // ✅ Escucha cambios en la URL
                        this.route.paramMap
                                .pipe(takeUntil(this.destroy$))
                                .subscribe(async (params) => {
                                        const nuevoCliente = params.get('cliente') || '';
                                        const nuevaCategoria = params.get('categoria') || '';

                                        if (!nuevoCliente) return;

                                        let menuPromise: Promise<void> | null = null;

                                        // ✅ Si cambió el cliente: correr en paralelo meta y, si hace falta, menú
                                        if (this.cliente !== nuevoCliente) {
                                                this.cartItems = [];
                                                this.cliente = nuevoCliente;
                                                this.configurarImagenes();

                                                const metaPromise = this.obtenerClienteMeta();
                                                // Solo cargar menú si aún no lo recibimos vía menuData$
                                                menuPromise = (this.menuCache && this.menuCache.length)
                                                        ? null
                                                        : this.cargarMenuCliente();

                                                const isActive = await metaPromise;
                                                if (!isActive) return;

                                                await menuPromise;
                                                this.cdr.markForCheck();
                                        }

                                        // ✅ Si cambió la categoría
                                        if (this.categoria !== nuevaCategoria) {
                                                this.categoria = nuevaCategoria;
                                                // Esperar menú si se está cargando por cambio de cliente
                                                if (menuPromise) await menuPromise;
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
         * Lee una sola vez el doc del cliente para validar activo y obtener nombre.
         * Retorna true si el cliente es válido/activo; false en caso contrario (y navega a inicio).
         */
        private async obtenerClienteMeta(): Promise<boolean> {
                try {
                        const clienteRef = doc(this.firestore, `clientes/${this.cliente}`);
                        const clienteSnap = await getDoc(clienteRef);

                        if (!clienteSnap.exists() || clienteSnap.data()?.['esActivo'] === false) {
                                this.router.navigate(['/']);
                                return false;
                        }

                        const nombre = clienteSnap.data()?.['nombreCliente'];
                        this.nombreCliente = nombre
                                ? String(nombre).toUpperCase()
                                : this.cliente.charAt(0).toUpperCase() + this.cliente.slice(1);
                        const rawWhatsapp = clienteSnap.data()?.['whatsappNumber'] || '';
                        this.whatsappNumber = this.normalizeWhatsappNumber(String(rawWhatsapp));
                        this.titleService.setTitle(`${this.nombreCliente} | Carta Digital`);
                        this.cdr.markForCheck();
                        return true;
                } catch {
                        this.router.navigate(['/']);
                        return false;
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
                        console.log('Categorias cargadas:', this.categorias);
                        this.cdr.markForCheck();
                } catch (error) {
                        console.error('Error al cargar menú del cliente:', error);
                        this.menuCache = [];
                        this.categorias = [];
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

                                // Filtrar productos por esVisible (excluir los que tienen esVisible: false)
                                productos = productos.filter((p: any) => p.esVisible !== false);

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

                                // ✅ Lógica especial para Foster Tandil:
                                // productos con displayOrder se insertan en la posición indicada
                                if (this.cliente.toLowerCase() === 'foster_tandil') {
                                        productos = this.aplicarDisplayOrder(productos);
                                }

                                this.items = productos.map((p: any) => ({
                                        ...p,
                                        _variantesEntries: p?.variantes ? Object.entries(p.variantes) : null,
                                        _extrasEntries: p?.extras
                                                ? Object.entries(p.extras).sort((a, b) =>
                                                        a[0].localeCompare(b[0], 'es', { sensitivity: 'base' })
                                                )
                                                : null
                                }));
                                console.log('items', this.items);
                                this.itemsOriginales = this.items.map((p: any) => p);

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

        private aplicarDisplayOrder(productos: any[]): any[] {
                type ProductoConOrden = {
                        producto: any;
                        position: number | null;
                        index: number;
                };

                type ProductoConOrdenValido = {
                        producto: any;
                        position: number;
                        index: number;
                };

                const parsePosition = (value: any): number | null => {
                        const n = Number(value);
                        if (!Number.isFinite(n)) return null;
                        // Se toma displayOrder como posición 1-based (1 = primer lugar)
                        return Math.max(Math.floor(n) - 1, 0);
                };

                const conDisplayOrder = productos
                        .map((p: any, index: number) => ({
                                producto: p,
                                position: parsePosition(p?.displayOrder),
                                index
                        }) as ProductoConOrden)
                        .filter((entry: ProductoConOrden): entry is ProductoConOrdenValido => entry.position !== null)
                        .sort((a: any, b: any) =>
                                a.position === b.position ? a.index - b.index : a.position - b.position
                        );

                if (!conDisplayOrder.length) return productos;

                const sinDisplayOrder = productos.filter((p: any) => parsePosition(p?.displayOrder) === null);
                const resultado = [...sinDisplayOrder];

                for (const entry of conDisplayOrder) {
                        const targetIndex = Math.min(Math.max(entry.position, 0), resultado.length);
                        resultado.splice(targetIndex, 0, entry.producto);
                }

                return resultado;
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

                const palabras = normalizado.split(' ');
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

        addToCart(event: Event, item: any): void {
                event.preventDefault();
                event.stopPropagation();
                const isFirstProductAdded = this.cartItemsCount === 0;

                const key = this.getCartItemKey(item);
                const existingItem = this.cartItems.find((cartItem) => cartItem.key === key);

                if (existingItem) {
                        existingItem.cantidad += 1;
                } else {
                        this.cartItems.push({
                                key,
                                nombre: item?.nombre ? String(item.nombre) : 'Producto',
                                cantidad: 1,
                                precio: this.getItemPriceLabel(item),
                                unitPrice: this.getItemUnitPrice(item),
                        });
                }

                if (isFirstProductAdded && !this.deliveryWarningShown) {
                        this.showDeliveryTakeAwayWarning(key);
                        this.deliveryWarningShown = true;
                }

                this.cdr.markForCheck();
        }

        removeFromCart(event: Event, item: any): void {
                event.preventDefault();
                event.stopPropagation();

                const key = this.getCartItemKey(item);
                const existingIndex = this.cartItems.findIndex((cartItem) => cartItem.key === key);
                if (existingIndex === -1) return;

                const existingItem = this.cartItems[existingIndex];
                existingItem.cantidad -= 1;

                if (existingItem.cantidad <= 0) {
                        this.cartItems.splice(existingIndex, 1);
                }

                this.cdr.markForCheck();
        }

        getItemQuantityInCart(item: any): number {
                const key = this.getCartItemKey(item);
                const existingItem = this.cartItems.find((cartItem) => cartItem.key === key);
                return existingItem?.cantidad || 0;
        }

        openCartConfirmation(event?: Event): void {
                event?.preventDefault();
                event?.stopPropagation();

                if (!this.cartItemsCount) return;

                if (!this.whatsappNumber) {
                        this.confirmationService.confirm({
                                header: 'WhatsApp no configurado',
                                message: 'Este menú no tiene número de WhatsApp configurado.',
                                icon: 'pi pi-info-circle',
                                acceptLabel: 'Entendido',
                                rejectVisible: false,
                        });
                        return;
                }

                this.cartDialogVisible = true;
                this.cdr.markForCheck();
        }

        updateCartQuantityFromDialog(itemKey: string, delta: number): void {
                const existingIndex = this.cartItems.findIndex((cartItem) => cartItem.key === itemKey);
                if (existingIndex === -1) return;

                const existingItem = this.cartItems[existingIndex];
                existingItem.cantidad += delta;

                if (existingItem.cantidad <= 0) {
                        this.cartItems.splice(existingIndex, 1);
                }

                if (!this.cartItemsCount) {
                        this.cartDialogVisible = false;
                }

                this.cdr.markForCheck();
        }

        sendCartToWhatsapp(): void {
                const url = this.buildWhatsappCartLink();
                if (url && url !== '#') {
                        window.open(url, '_blank', 'noopener');
                        this.cartItems = [];
                        this.cartDialogVisible = false;
                        this.cdr.markForCheck();
                }
        }

        showVeganInfo(event: Event): void {
                this.showProductInfoDialog(event, 'Producto vegano', 'Este producto está elaborado 100% con ingredientes de origen vegetal. No contiene carnes, lácteos, huevos ni ningún derivado animal, siendo una opción ideal para personas veganas o quienes buscan una alternativa más liviana y consciente.');
        }

        showGlutenFreeInfo(event: Event): void {
                this.showProductInfoDialog(event, 'Producto sin gluten', 'Nuestro cocina se adapta especialmente para evitar la contaminación cruzada, <b>de todas maneras no lo podemos garantizar 100%, ya que no somos una cocina sin TACC</b>.');
        }

        private showProductInfoDialog(event: Event, header: string, message: string): void {
                event.preventDefault();
                event.stopPropagation();

                this.confirmationService.confirm({
                        header,
                        message,
                        icon: 'pi pi-info-circle',
                        acceptLabel: 'Entendido',
                        rejectVisible: false,
                });
        }

        private showDeliveryTakeAwayWarning(cartItemKey: string): void {
                this.confirmationService.confirm({
                        header: 'Aviso importante',
                        message: 'Este menú es solo informativo. Los pedidos por WhatsApp son únicamente para delivery/take away. Si estás en el local, pedí al personal.',
                        icon: 'pi pi-info-circle',
                        acceptLabel: 'Continuar',
                        rejectLabel: 'Cancelar',
                        rejectVisible: true,
                        closeOnEscape: false,
                        reject: () => {
                                const existingIndex = this.cartItems.findIndex((cartItem) => cartItem.key === cartItemKey);
                                if (existingIndex !== -1) {
                                        this.cartItems.splice(existingIndex, 1);
                                        this.cdr.markForCheck();
                                }
                        }
                });
        }

        private buildWhatsappCartLink(): string {
                if (!this.whatsappNumber) return '#';
                const message = this.buildWhatsappCartMessage();
                return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(message)}`;
        }

        private buildWhatsappCartMessage(): string {
                const url = typeof window !== 'undefined' ? window.location.href : '';
                const lines: string[] = [];

                lines.push(`Hola! ${this.nombreCliente}`);
                lines.push('Quiero hacer este pedido:');
                this.cartItems.forEach((item) => {
                        const precio = item.precio ? ` (${item.precio})` : '';
                        lines.push(`- ${item.cantidad}x ${item.nombre}${precio}`);
                });

                lines.push('');
                lines.push(`Total de productos: ${this.cartItemsCount}`);
                lines.push(`*Importe total: ${this.buildTotalLabel()}*`);
                // if (url) {
                //         lines.push(`Menu: ${url}`);
                // }

                return lines.join('\n');
        }

        private getCartItemKey(item: any): string {
                const id = item?.idProducto ? String(item.idProducto) : String(item?.nombre || 'producto').trim().toLowerCase();
                return `${this.categoria}:${id}`;
        }

        private getItemPriceLabel(item: any): string {
                if (item?.precio && !item?.variantes) {
                        return `$${item.precio}`;
                }
                if (item?._variantesEntries?.length) {
                        return 'ver opciones';
                }
                return '';
        }

        private getItemUnitPrice(item: any): number | null {
                if (!item?.variantes && item?.precio != null) {
                        const parsed = Number(item.precio);
                        return Number.isFinite(parsed) ? parsed : null;
                }
                return null;
        }

        private buildTotalLabel(): string {
                const total = this.cartItems.reduce((acc, item) => {
                        const unit = item.unitPrice ?? 0;
                        return acc + unit * item.cantidad;
                }, 0);
                const hasUnknownPrices = this.cartItems.some((item) => item.unitPrice == null);
                const formatted = `$${total.toLocaleString('es-AR')}`;
                return hasUnknownPrices ? `${formatted} (sin incluir productos con opciones)` : formatted;
        }

        private normalizeWhatsappNumber(raw: string): string {
                return (raw || '').replace(/[^\d]/g, '');
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
                if (this.unlistenScroll) this.unlistenScroll();
        }
}
