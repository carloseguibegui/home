import { Component, Injectable, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CopyrightComponent } from '../../shared/copyright/copyright.component';
import { HeaderComponent } from "../../shared/header/header.component";
import { BackgroundComponent } from "../../shared/background/background.component";
import { SearchBarComponent } from "../../shared/search-bar/search-bar.component";
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ScrollToTopComponent } from "../../shared/scroll-to-top/scroll-to-top.component";
import { SliderComponent } from "../../shared/slider/slider.component";
import { MenuService } from '../../services/menu.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SpinnerComponent } from "../../shared/spinner/spinner.component";


@Component({
  selector: 'app-categoria',
  templateUrl: './categoria.component.html',
  styleUrl: './categoria.component.css',
  standalone: true,
  imports: [CommonModule, RouterModule, CopyrightComponent, HeaderComponent, BackgroundComponent, SearchBarComponent, ScrollToTopComponent, SliderComponent, SpinnerComponent],
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
        style({ opacity: 0, transform: 'translateY(30px)' }),
        // animate('600ms 100ms cubic-bezier(0.23, 1, 0.32, 1)', style({ opacity: 1, transform: 'none' }))
        animate('1200ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('0ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
@Injectable({ providedIn: 'root' })
export class CategoriaComponent implements OnInit {
  cardImage = ''
  logoImage = ''
  backgroundImage = ''
  private destroy$ = new Subject<void>();
  data: any = []
  private lastTap = 0;
  doubleTapTimeout: any = null;
  zoomLevel: number = 1;
  zoomTransform: string = 'scale(1)';
  loading = true;
  visible = false;
  nombreCategoria: string = '';
  items: any[] = [];
  itemsOriginales: any[] = [];
  item_placeholder: string = '';
  searchTerm: string = '';
  isLoading: boolean = false;
  categorias: any[] = []
  lightboxVisible = false;
  lightboxImage: string = '';
  container = document.querySelector('.container') as HTMLElement;
  cliente: any;
  categoria: string = '';
  categoriaKey: string = '';



  constructor(private menuService: MenuService, private route: ActivatedRoute, private router: Router, private renderer: Renderer2) {
  }

  ngOnInit() {
    this.loading = true;
    const now = Date.now();
    const lastCache = Number(localStorage.getItem('lastCacheClear') || '0');
    const twelveHours = 1 * 60 * 1000 * 1; //horas en milisegundos
    if (!lastCache || now - lastCache > twelveHours) {
      // Borra solo las claves relacionadas al menú/categorías
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('categorias_') || key.startsWith('data_')) {
          localStorage.removeItem(key);
        }
      });
      localStorage.setItem('lastCacheClear', now.toString());
    }
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.cliente = params.get('cliente') || '';
        this.cardImage = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.cliente}%2Ffondo-claro.webp?alt=media&token=839efda5-c17b-4fb1-bfb6-6605379525f`
        this.logoImage = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.cliente}%2Flogo0.webp?alt=media&token=5a1f3250-7d01-4e31-98a8-979227048f0`
        this.backgroundImage = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.cliente}%2Fbackground_image.webp?alt=media&token=ae3fb9d5-5966-4c65-9cd5-0828443bc57b`
        const nuevaCategoria = params.get('categoria') || '';

        this.categoria = nuevaCategoria;
        this.categoriaKey = nuevaCategoria + '-' + Date.now();

        // Intenta cargar categorías desde localStorage primero
        const cache_categorias = localStorage.getItem(`categorias_${this.cliente}`);
        const cache_data = localStorage.getItem(`data_${this.cliente}_${this.categoria}`);
        if ((cache_categorias && cache_data)) {
          console.log('Cargando desde cache');
          this.categorias = JSON.parse(cache_categorias || '[]');
          this.data = JSON.parse(cache_data || '[]');
          setTimeout(() => {
            this.loading = false;
          }, 500);
        } else {
          console.log('Cargando desde Firestore');
          // Solo llama al servicio si no hay cache
          this.menuService.loadMenuFirestore(this.cliente);
          this.menuService.menuData$
            .pipe(takeUntil(this.destroy$))
            .subscribe(data => {
              this.data = data;
              this.categorias = data.map((item: any) => ({
                nombre: item.nombre,
                route: item.route,
                icon: item.icon
              }));
              if (data && data.length > 0) {
                localStorage.setItem(`categorias_${this.cliente}`, JSON.stringify(this.categorias));
                localStorage.setItem(`data_${this.cliente}_${this.categoria}`, JSON.stringify(this.data));
                setTimeout(() => {
                  this.loading = false;
                }, 500);
              }
              const objeto_categoria = this.data.find((item: { route: string; }) => item.route === this.categoria);
              if (objeto_categoria) {
                this.nombreCategoria = objeto_categoria.nombre;
                let productos = objeto_categoria.productos || [];
                // Aplica la lógica especial solo si la categoría es 'tostados-sandwiches'
                if ((objeto_categoria.route || '').toLowerCase() === 'tostados-sandwiches' && (this.cliente || '').toLowerCase() === 'requeterico') {
                  const tostados = productos.filter((p: any) => (p.nombre || '').toLowerCase().includes('tostado'));
                  // const ciabattas = productos.filter((p: any) => (p.nombre || '').toLowerCase().includes('ciabatta') || (p.nombre || '').toLowerCase().includes('sandwich'));
                  const otros = productos.filter((p: any) => !((p.nombre || '').toLowerCase().includes('tostado')));
                  productos = [...tostados, ...otros];
                }
                this.items = productos;
                this.itemsOriginales = [...productos];
                const random_index = Math.floor(Math.random() * this.items.length);
                this.item_placeholder = this.items[random_index]?.nombre || '';
              }
            });
        }
        const objeto_categoria = this.data.find((item: { route: string; }) => item.route === this.categoria);
        if (objeto_categoria) {
          this.nombreCategoria = objeto_categoria.nombre;
          this.items = objeto_categoria.productos || [];
          this.itemsOriginales = [...this.items];
          const random_index = Math.floor(Math.random() * this.items.length);
          this.item_placeholder = this.items[random_index]?.nombre || '';
        }
        setTimeout(() => {
          this.visible = true;
        }, 10);
      });
  }

  get clienteClass(): string {
    return `cliente-${this.cliente.toLowerCase()}`;
  }

  onSearch(term: string) {
    this.searchTerm = term;
    // this.isLoading = true;

    this.buscarProducto();
    // setTimeout(() => { // Simula un pequeño delay
    // this.isLoading = false;
    // }, 300); // 300ms de espera para "loading"
  }

  buscarProducto() {
    const termino = this.searchTerm.trim().toLowerCase();
    // Normaliza el término de búsqueda quitando acentos
    const terminoNormalizado = termino.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!terminoNormalizado) {
      this.items = [...this.itemsOriginales];
      return;
    }

    const palabras = termino.split(' ');

    this.items = this.itemsOriginales.filter((producto: any) => {
      const textoProducto = `${producto.nombre} ${producto.descripcion}`.toLowerCase();
      const textoNormalizado = textoProducto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return palabras.every(palabra => textoNormalizado.includes(palabra));
    });
  }

  openLightbox(imageUrl: string) {
    this.lightboxImage = imageUrl;
    this.lightboxVisible = true;
    document.body.style.overflow = 'hidden'; // Bloquea scroll
    this.applyPerformanceHacks(); // Aplica optimizaciones
  }


  closeLightbox(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('lightbox')) {
      this.lightboxVisible = false;
      this.zoomLevel = 1;
      this.zoomTransform = 'scale(1)';
      document.body.style.overflow = '';

      setTimeout(() => {
        this.lightboxImage = '';
      }, 300);
    }
  }

  ngAfterViewInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const content = document.querySelector('.fade-in');
        if (content) {
          content.classList.remove('show'); // reinicia
          void (content as HTMLElement).offsetWidth;
          this.renderer.addClass(content, 'show'); // activa animación
        }
        if (this.router.events instanceof NavigationEnd) {
          const body = document.body;
          body.classList.remove('fade-in');
          void body.offsetWidth; // fuerza reflow para reiniciar animación
          body.classList.add('fade-in');
        }
      });
  }
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private offsetX = 0;
  private offsetY = 0;
  resetZoom() {
    this.zoomLevel = 1;
    this.zoomTransform = 'scale(1)';
  }
  toggleZoom() {
    if (this.zoomLevel === 1) {
      this.zoomLevel = 2;
    } else {
      this.zoomLevel = 1;
      this.offsetX = 0;
      this.offsetY = 0;
    }
    this.updateTransform();
  }

  handleDoubleTap(event: TouchEvent) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - this.lastTap;

    if (tapLength < 300 && tapLength > 0) {
      event.preventDefault();
      this.toggleZoom();
      this.lastTap = 0;
    } else {
      this.lastTap = currentTime;
    }
  }
  startDrag(event: MouseEvent | TouchEvent) {
    if (this.zoomLevel === 1) return;
    const img = event.target as HTMLElement;
    img.classList.add('panning');
    this.isDragging = true;
    const clientX = this.getClientX(event);
    const clientY = this.getClientY(event);

    this.startX = clientX - this.offsetX;
    this.startY = clientY - this.offsetY;
  }

  onDrag(event: MouseEvent | TouchEvent) {
    if (!this.isDragging || this.zoomLevel === 1) return;

    event.preventDefault();
    const clientX = this.getClientX(event);
    const clientY = this.getClientY(event);

    this.offsetX = clientX - this.startX;
    this.offsetY = clientY - this.startY;
    this.updateTransform();
  }

  endDrag() {
    this.isDragging = false;
    const img = document.querySelector('.lightbox-content');
    if (img) {
      img.classList.remove('panning');
      // Pequeño timeout para suavizar la transición final
      setTimeout(() => {
        img.classList.add('smooth-transition');
      }, 50);
    }
  }

  private getClientX(event: MouseEvent | TouchEvent): number {
    return event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
  }

  private getClientY(event: MouseEvent | TouchEvent): number {
    return event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
  }

  private updateTransform() {
    this.zoomTransform = `
    translate3d(${this.offsetX}px, ${this.offsetY}px, 0)
    scale(${this.zoomLevel})
  `;
    // this.zoomTransform = `
    //   scale(${this.zoomLevel})
    //   translate(${this.offsetX}px, ${this.offsetY}px)
    // `;
  }

  private applyPerformanceHacks() {
    const img = document.querySelector('.lightbox-content') as HTMLElement;
    if (img) {
      // Fuerza la aceleración por hardware
      img.style.transform = 'translateZ(0)';
    }
  }

  onCategoriaSeleccionada(categoriaRoute: string) {
    if (categoriaRoute === this.categoria) {
      // Es la misma categoría, no hacer nada
      return
    }
    this.loading = true; // Activa el spinner
    this.router.navigate(['/menuonline', this.cliente, 'carta', categoriaRoute]);
  }

}