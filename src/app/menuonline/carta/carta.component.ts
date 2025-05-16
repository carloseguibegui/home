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
  cardImage ='https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2Frequeterico%2Ffondo-claro.webp?alt=media&token=839efda5-c17b-4fb1-bfb6-6605379525f7'
  logoImage ='https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2Frequeterico%2Flogo0.webp?alt=media&token=5a1f3250-7d01-4e31-98a8-979227048f0d'
  backgroundImage = 'https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2Frequeterico%2Ftext1.webp?alt=media&token=ae3fb9d5-5966-4c65-9cd5-0828443bc57b';
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
        setTimeout(() => {
          this.loading = false; // Ocultar spinner con un pequeño delay para evitar parpadeo de iconos
        }, 800);
      }
    });
    // Solo carga si no hay datos en caché
    if (!this.menuService['categoriasCache'][this.cliente]) {
      this.menuService.loadCategorias(this.cliente);
    }
    this.actualizarTitulo(`${this.cliente.charAt(0).toUpperCase() + this.cliente.slice(1) } | Carta Digital`);
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