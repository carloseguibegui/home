import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuService } from '../../services/menu.service';

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
  cliente: string = ''
  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private menuService: MenuService
  ) {
    
  }

  ngOnInit() {
    this.cliente = this.route.snapshot.paramMap.get('cliente') || '';
    this.menuService.loadMenu(this.cliente);
    this.menuService.menuData$.subscribe(data => {
      this.categorias = data;
      this.categorias = [...this.categorias, ...this.categorias, ...this.categorias, ...this.categorias, ...this.categorias]
      this.detectRouteChanges();
    });
  }
  get clienteClass(): string {
    return `cliente-${this.cliente.toLowerCase()}`;
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
          inline: 'start'
        });
      }
    }, 0);
  }

  isActiveCategory(categoryRoute: string): boolean {
    return this.currentCategory === categoryRoute;
  }
}
