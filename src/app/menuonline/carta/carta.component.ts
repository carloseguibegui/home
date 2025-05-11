import { Component, Input, Renderer2 } from '@angular/core';
import { ActivatedRoute, RouterModule, RouterOutlet, Router, NavigationEnd, NavigationCancel, NavigationError, NavigationStart } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoriaComponent } from '../categoria/categoria.component';
import { CopyrightComponent } from '../../shared/copyright/copyright.component';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from "../../shared/header/header.component";
import { BackgroundComponent } from "../../shared/background/background.component";

@Component({
  selector: 'app-carta',
  imports: [RouterModule, CommonModule, CopyrightComponent, HeaderComponent, BackgroundComponent],
  templateUrl: './carta.component.html',
  styleUrl: './carta.component.css'
})
export class CartaComponent {
  visible = false;
  categorias: any;
  cliente: string = '';
  isViewVisible = false;
  loading = false;
  constructor(private route: ActivatedRoute, categoriaComponent: CategoriaComponent, private router: Router, private renderer: Renderer2) {
    this.categorias = categoriaComponent.data
  }

  ngOnInit(): void {
    this.cliente = this.route.snapshot.paramMap.get('cliente') || '';
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
}