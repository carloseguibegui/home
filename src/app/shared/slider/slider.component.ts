import { ChangeDetectorRef, Component, Input, OnInit, AfterViewInit } from '@angular/core';
import { CategoriaComponent } from '../../menuonline/categoria/categoria.component';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-slider',
  imports: [CommonModule, RouterModule],
  templateUrl: './slider.component.html',
  styleUrl: './slider.component.css'
})
export class SliderComponent implements OnInit, AfterViewInit {
  categorias: { label: string; icon: string; route: string; nombre: string; productos: []; img: string }[] = [];
  duplicated_items: { label: string; icon: string; route: string; nombre: string; productos: []; img: string }[] = [];
  activeIndex: number = -1;
  @Input() categoria_actual: string | null = null;

  constructor(
    categoriaComponent: CategoriaComponent,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.categorias = categoriaComponent.data;
  }

  ngAfterViewInit(): void {
    this.scrollToActiveCategory();
  }
  private scrollToActiveCategory(): void {
    const container = document.querySelector('.scroll-container');
    const elements = container?.querySelectorAll('.menu-item');
    if (elements?.[this.activeIndex]) {
      elements[this.activeIndex].scrollIntoView({
        behavior: 'auto',
        block: 'nearest',
        inline: 'start'
      });
    }
  }

  ngOnInit(): void {
    this.populateSlider();
    this.setupRouteListener();
  }

  populateSlider(): void {
    this.duplicated_items = [...this.categorias, ...this.categorias, ...this.categorias, ...this.categorias, ...this.categorias, ...this.categorias, ...this.categorias, ...this.categorias];
    if (this.categoria_actual) {
      this.activeIndex = this.duplicated_items.findIndex(
        item => item.route === this.categoria_actual
      );
      this.activeIndex = this.activeIndex + this.categorias.length
    }
  }


  setActive(index: number, event?: Event): void {
    this.activeIndex = index;
    this.cdr.detectChanges();

    if (this.duplicated_items[index]) {
      const categoria = this.duplicated_items[index].route;
      this.router.navigate(['/menuonline', 'requeterico', 'carta', categoria])
        .then(() => {
          this.handleCategoryChange(categoria);
        });
    }
  }
  

  setupRouteListener(): void {
    this.route.params.subscribe(params => {
      const categoria = params['categoria'];
      if (categoria) {
        this.handleCategoryChange(categoria);
      }
    });
  }

  handleCategoryChange(categoria: string): void {
    const index = this.duplicated_items.findIndex(item =>
      item.route.toLowerCase() === categoria.toLowerCase()
    );

    if (index !== -1) {
      const originalIndex = index % this.categorias.length;
      this.activeIndex = originalIndex + this.categorias.length; // Ajustar a la sección media
      this.cdr.detectChanges();
      this.scrollToActiveCategory(); // Llamada directa después de detectar cambios

      // setTimeout(() => {
      //   const container = document.querySelector('.scroll-container');
      //   const elements = container?.querySelectorAll('.menu-item');
      //   if (elements?.[this.activeIndex]) {
      //     elements[this.activeIndex].scrollIntoView({
      //       behavior: 'auto',
      //       block: 'nearest',
      //       inline: 'start'
      //     });
      //   }
      // });
    }
  }
}
