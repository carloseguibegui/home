import { Component, Input, Renderer2 } from '@angular/core';
import { ActivatedRoute, RouterModule, RouterOutlet, Router, NavigationEnd, NavigationCancel, NavigationError, NavigationStart } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CopyrightComponent } from '../../shared/copyright/copyright.component';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from "../../shared/header/header.component";
import { BackgroundComponent } from "../../shared/background/background.component";
import { Title } from '@angular/platform-browser';
import { MenuService } from '../../services/menu.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { SpinnerComponent } from "../../shared/spinner/spinner.component";

@Component({
  selector: 'app-carta',
  imports: [RouterModule, CommonModule, CopyrightComponent, HeaderComponent, BackgroundComponent, SpinnerComponent],
  templateUrl: './carta.component.html',
  styleUrl: './carta.component.css',
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
export class CartaComponent {
  visible = false;
  categorias: any[] = [];
  cliente: string = '';
  isViewVisible = false;
  loading = false;
  constructor(private menuService: MenuService, private route: ActivatedRoute, private router: Router, private renderer: Renderer2, private titleService: Title) {}

  get clienteClass(): string {
    return `cliente-${this.cliente.toLowerCase()}`;
  }

  ngOnInit(): void {
    this.cliente = this.route.snapshot.paramMap.get('cliente') || '';
    this.loading = true; // Mostrar spinner al iniciar
    this.menuService.categoriasData$.subscribe(data => {
      this.categorias = data;
      console.log('Datos del menú:', data);
      if (data && data.length > 0) {
        this.loading = false; // Ocultar spinner cuando llegan las categorías
      }
    });
    // Solo carga si no hay datos en caché
    if (!this.menuService['categoriasCache'][this.cliente]) {
      this.menuService.loadCategorias(this.cliente);
    }
    this.actualizarTitulo(`${this.cliente.charAt(0).toUpperCase() + this.cliente.slice(1) } | Carta Digital`);
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
  actualizarTitulo(nuevoTitulo: string): void {
    this.titleService.setTitle(nuevoTitulo);
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