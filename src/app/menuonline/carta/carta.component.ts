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
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

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
        animate('500ms ease-out', style({ opacity: 0 }))
      ])
    ]),
    trigger('fadeContent', [
      transition(':enter', [
        // style({ opacity: 0, transform: 'translateY(30px)' }),
        style({ opacity: 0 }),
        // animate('600ms 100ms cubic-bezier(0.23, 1, 0.32, 1)', style({ opacity: 1, transform: 'none' }))
        animate('0ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('0ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class CartaComponent {
  cardImage = '';
  logoImage = '';
  backgroundImage = '';
  visible = false;
  categorias: any[] = [];
  cliente: string = '';
  nombreCliente: string = '';
  isViewVisible = false;
  loading = false;
  constructor(
    private menuService: MenuService,
    private route: ActivatedRoute,
    private router: Router,
    private renderer: Renderer2,
    private titleService: Title,
    private firestore: Firestore
  ) { }

  get clienteClass(): string {
    return `cliente-${this.cliente.toLowerCase()}`;
  }

  async actualizarTituloPorCliente(): Promise<void> {
    if (!this.cliente) return;
    try {
      const clienteRef = doc(this.firestore, `clientes/${this.cliente}`);
      const clienteSnap = await getDoc(clienteRef);
      let nombre = this.cliente.charAt(0).toUpperCase() + this.cliente.slice(1);
      if (clienteSnap.exists()) {
        const data: any = clienteSnap.data();
        if (data && data.nombreCliente) {
          nombre = data.nombreCliente;
        }
      }
      nombre = nombre.toUpperCase()
      this.nombreCliente = nombre;
      this.titleService.setTitle(`${nombre} | Carta Digital`);
    } catch (e) {
      this.nombreCliente = this.cliente.charAt(0).toUpperCase() + this.cliente.slice(1);
      this.titleService.setTitle(`${this.nombreCliente} | Menú Digital`);
    }
  }

  async ngOnInit(): Promise<void> {
    this.loading = true; // Mostrar spinner al iniciar
    this.cliente = this.route.snapshot.paramMap.get('cliente') || '';

    // --- Comprobar si el cliente está activo ---
    try {
      const clienteRef = doc(this.firestore, `clientes/${this.cliente}`);
      const clienteSnap = await getDoc(clienteRef);
      if (!clienteSnap.exists() || clienteSnap.data()?.['esActivo'] === false) {
        this.router.navigate(['/']);
        return;
      }
    } catch (e) {
      // Si hay error al consultar, redirigir por seguridad
      this.router.navigate(['/']);
      return;
    }

    this.cardImage = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.cliente}%2Ffondo-claro.webp?alt=media`;
    this.logoImage = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.cliente}%2Flogo0.webp?alt=media`;
    this.backgroundImage = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.cliente}%2Fbackground_image.webp?alt=media`;

    // Intenta cargar desde localStorage primero
    const cache = localStorage.getItem(`categorias_${this.cliente}`);
    if (cache) {
      this.categorias = JSON.parse(cache);
      console.log('Categorias desde cache:', this.categorias);
      setTimeout(() => {
        this.loading = false;
      }, 500);
    } else {
      // Solo llama al servicio si no hay cache
      this.menuService.loadCategorias(this.cliente,false,true);
      this.menuService.categoriasData$.subscribe(data => {
        console.log('Categorias desde Firestore:', data);
        this.categorias = data;
        if (data && data.length > 0) {
          localStorage.setItem(`categorias_${this.cliente}`, JSON.stringify(data));
          setTimeout(() => {
            this.loading = false;
          }, 500);
        }
      });
    }

    await this.actualizarTituloPorCliente();
    setTimeout(() => {
      this.visible = true;
    }, 10); // delay corto para permitir que se aplique la clase "fade" primero    
  }
}