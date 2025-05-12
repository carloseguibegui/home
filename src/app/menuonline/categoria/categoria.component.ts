import { Component, Injectable, Input, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CopyrightComponent } from '../../shared/copyright/copyright.component';
import { HeaderComponent } from "../../shared/header/header.component";
import { BackgroundComponent } from "../../shared/background/background.component";
import { SearchBarComponent } from "../../shared/search-bar/search-bar.component";
import { Router, NavigationEnd, NavigationCancel, NavigationError, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ScrollToTopComponent } from "../../shared/scroll-to-top/scroll-to-top.component";
import { SliderComponent } from "../../shared/slider/slider.component";
import { MenuService } from '../../services/menu.service';
@Component({
  selector: 'app-categoria',
  templateUrl: './categoria.component.html',
  styleUrl: './categoria.component.css',
  standalone: true,
  imports: [CommonModule, RouterModule, CopyrightComponent, HeaderComponent, BackgroundComponent, SearchBarComponent, RouterOutlet, ScrollToTopComponent, SliderComponent]
})
@Injectable({ providedIn: 'root' })
export class CategoriaComponent implements OnInit {
  data: any = []
  private lastTap = 0;
  doubleTapTimeout: any = null;
  zoomLevel: number = 1;
  zoomTransform: string = 'scale(1)';
  loading = false;
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
  private cliente: any;
  private categoria: any;
  
  constructor(private menuService: MenuService,private route: ActivatedRoute, private router: Router, private renderer: Renderer2) {
  }
  
  ngOnInit() {
    this.cliente = this.route.snapshot.paramMap.get('cliente') || '';
    this.categoria = this.route.snapshot.paramMap.get('categoria') || '';
    this.menuService.loadMenu(this.cliente);
    this.menuService.menuData$.subscribe(data => {
      this.data = data;
      const objeto_categoria = this.data.find((item: { route: string; }) => item.route === this.categoria)
      console.log("objeto_categoria", objeto_categoria)
      this.nombreCategoria = objeto_categoria.nombre;
      this.items = objeto_categoria.productos || [];
      this.itemsOriginales = [...this.items];
      const random_index = Math.floor(Math.random() * this.items.length);
      this.item_placeholder = this.items[random_index]?.nombre || '';
    });
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loading = true;
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loading = false;
      }
    });
    setTimeout(() => {
      this.visible = true;
    }, 10); // delay corto para permitir que se aplique la clase "fade" primero
  }

  onSearch(term: string) {
    console.log(term)
    this.searchTerm = term;
    this.isLoading = true;

    setTimeout(() => { // Simula un pequeño delay
      this.buscarProducto();
      this.isLoading = false;
    }, 300); // 300ms de espera para "loading"
  }

  buscarProducto() {
    const termino = this.searchTerm.trim().toLowerCase();

    if (!termino) {
      this.items = [...this.itemsOriginales];
      return;
    }

    const palabras = termino.split(' ');

    this.items = this.itemsOriginales.filter((producto: any) => {
      const textoProducto = `${producto.nombre} ${producto.descripcion}`.toLowerCase();
      return palabras.every(palabra => textoProducto.includes(palabra));
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

}