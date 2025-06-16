import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit, Output, ViewChild, EventEmitter, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { HostListener } from '@angular/core';
@Component({
  selector: 'app-slider',
  imports: [CommonModule, RouterModule],
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css'],
  standalone: true
})
export class SliderComponent implements OnInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  currentCategory: string | null = null;
  @Input() categorias: any[] = [];
  @Input() cliente: string = '';
  @Input() categoriaActual: string = '';
  @Output() categoriaSeleccionada = new EventEmitter<string>();
  cardImage = ""
  backgroundImage = ""
  isSticky = false;
  constructor(
    public router: Router,
    private route: ActivatedRoute,
  ) { }
  ngOnInit() {
    this.cardImage = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.cliente}%2Ffondo-claro.webp?alt=media`
    this.backgroundImage = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.cliente}%2Fbackground_image.webp?alt=media`
  }
  ngAfterViewInit() {
    this.scrollToActiveCategory();
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['categoriaActual'] && !changes['categoriaActual'].firstChange) {
      this.scrollToActiveCategory();
    }
  }
  
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isSticky = window.scrollY > 135; // Cambia 100 por los píxeles que quieras
  }
  get clienteClass(): string {
    return `cliente-${this.cliente.toLowerCase()}`;
  }

  private scrollToActiveCategory() {
    setTimeout(() => {
      const activeItem = this.scrollContainer?.nativeElement.querySelector('.slider-item.active');
      if (activeItem) {
        activeItem.scrollIntoView({
          behavior: 'instant',
          block: 'nearest',
          inline: 'center'
        });
      }
    }, 0);
  }

  isActiveCategory(categoryRoute: string): boolean {
    return this.categoriaActual === categoryRoute;
  }

  seleccionarCategoria(route: string) {
    this.categoriaSeleccionada.emit(route);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll arriba al seleccionar
  }
}
