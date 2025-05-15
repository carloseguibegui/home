import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit, Output, ViewChild, EventEmitter, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-slider',
  imports: [CommonModule, RouterModule],
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css'],
  standalone: true,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class SliderComponent implements OnInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  currentCategory: string | null = null;
  @Input() categorias: any[] = [];
  @Input() cliente: string = '';
  @Input() categoriaActual: string = '';
  @Output() categoriaSeleccionada = new EventEmitter<string>();

  constructor(
    public router: Router,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
  }
  ngAfterViewInit() {
    this.scrollToActiveCategory();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['categoriaActual'] && !changes['categoriaActual'].firstChange) {
      this.scrollToActiveCategory();
    }
  }

  get clienteClass(): string {
    return `cliente-${this.cliente.toLowerCase()}`;
  }

  private scrollToActiveCategory() {
    setTimeout(() => {
      const activeItem = this.scrollContainer?.nativeElement.querySelector('.slider-item.active');
      if (activeItem) {
        activeItem.scrollIntoView({
          behavior: 'smooth',
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
  }
}
