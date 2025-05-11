import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoriaComponent } from '../../menuonline/categoria/categoria.component';

@Component({
  selector: 'app-slider',
  imports:[CommonModule],
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css']
})
export class SliderComponent implements OnInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  categorias: any[] = [];
  currentCategory: string | null = null;

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    categoriaComponent: CategoriaComponent
  ) {
    this.categorias = categoriaComponent.data
  }

  ngOnInit() {
    this.detectRouteChanges();
  }

  private detectRouteChanges() {
    this.route.paramMap.subscribe(params => {
      this.currentCategory = params.get('categoria'); // Ajusta el nombre del parámetro de ruta
      this.scrollToActiveCategory();
    });
  }

  private scrollToActiveCategory() {
    setTimeout(() => {
      const activeItem = this.scrollContainer.nativeElement.querySelector('.slider-item.active');
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
    return this.currentCategory === categoryRoute;
  }
}
