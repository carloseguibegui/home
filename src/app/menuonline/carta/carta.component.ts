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
        animate('0ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('400ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class CartaComponent {
  cardImage =''
  logoImage =''
  backgroundImage = ''
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
    this.cardImage = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.cliente}%2Ffondo-claro.webp?alt=media`
    this.logoImage = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.cliente}%2Flogo0.webp?alt=media`
    this.backgroundImage = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.cliente}%2Fbackground_image.webp?alt=media`
    this.loading = true; // Mostrar spinner al iniciar

    // Intenta cargar desde localStorage primero
    const cache = localStorage.getItem(`categorias_${this.cliente}`);
    if (cache) {
      this.categorias = JSON.parse(cache);
      setTimeout(() => {
        this.loading = false;
      }, 300); 
    } else {
      // Solo llama al servicio si no hay cache
      this.menuService.loadCategorias(this.cliente);
      this.menuService.categoriasData$.subscribe(data => {
        console.log('Categorias desde Firestore:', data);
        this.categorias = data;
        if (data && data.length > 0) {
          localStorage.setItem(`categorias_${this.cliente}`, JSON.stringify(data));
          setTimeout(() => {
            this.loading = false;
          }, 300); 
        }
      });
    }

    this.actualizarTitulo(`${this.cliente.charAt(0).toUpperCase() + this.cliente.slice(1) } | Carta Digital`);
    setTimeout(() => {
      this.visible = true;
    }, 10); // delay corto para permitir que se aplique la clase "fade" primero    
  }
  actualizarTitulo(nuevoTitulo: string): void {
    this.titleService.setTitle(nuevoTitulo);
  }


}