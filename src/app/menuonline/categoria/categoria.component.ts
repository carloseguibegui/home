import { Component, Injectable, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CopyrightComponent } from '../../shared/copyright/copyright.component';
import { HeaderComponent } from "../../shared/header/header.component";
import { BackgroundComponent } from "../../shared/background/background.component";
import { SearchBarComponent } from "../../shared/search-bar/search-bar.component";
import { Router, NavigationEnd, NavigationCancel, NavigationError, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ScrollToTopComponent } from "../../shared/scroll-to-top/scroll-to-top.component";
import { SliderComponent } from "../../shared/slider/slider.component";
@Component({
  selector: 'app-categoria',
  templateUrl: './categoria.component.html',
  styleUrl: './categoria.component.css',
  standalone: true,
  imports: [CommonModule, RouterModule, CopyrightComponent, HeaderComponent, BackgroundComponent, SearchBarComponent, RouterOutlet, ScrollToTopComponent, SliderComponent]
})
@Injectable({ providedIn: 'root' })
export class CategoriaComponent implements OnInit {
  private lastTap = 0;
  doubleTapTimeout: any = null;
  zoomLevel: number = 1;
  zoomTransform: string = 'scale(1)';
  loading = false;
  visible = false;
  nombreCategoria: string = '';
  items: any[] = [];
  itemsOriginales: any[] = [];
  item_placeholder: string = '';
  searchTerm: string = '';
  isLoading: boolean = false;
  categorias: any[] = []
  lightboxVisible = false;
  lightboxImage: string = '';
  container = document.querySelector('.container') as HTMLElement;


  data: any = [
    {
      label: 'Cafés',
      icon: 'assets/clientes/requeterico/icono1.webp',
      route: 'cafes',
      nombre: 'cafés',
      productos: [
        // {
        //   nombre: 'Espresso',
        //   descripcion: 'Café 100% puro, recién molido',
        //   precio: 5000,
        //   imagen: 'assets/clientes/requeterico/t1.webp',
        // small_imagen: 'assets/clientes/requeterico/t1.webp'
        // },
        // {
        //   nombre: 'Latte',
        //   descripcion: 'Café robusto combinado con leche espumada cremosa',
        //   precio: 6000,
        //   imagen: 'assets/clientes/requeterico/t1.webp',
        // small_imagen: 'assets/clientes/requeterico/t1.webp'
        // },
        {
          nombre: 'Capuccino',
          descripcion: 'Clásico e irresistible. Una mezcla perfecta de espresso intenso, leche vaporizada y una generosa capa de espuma suave y cremosa. Ideal para quienes disfrutan de un café equilibrado, con cuerpo y textura sedosa en cada sorbo',
          precio: 6500,
          imagen: 'assets/clientes/requeterico/c2.webp',
          small_imagen: 'assets/clientes/requeterico/c2-small.webp'
        },
        {
          nombre: 'Submarino',
          descripcion: 'Café suave, preparado con agua caliente para un sabor Una barra de chocolate que se derrite lentamente en leche caliente. Ritual irresistible de sabor',
          precio: 4800,
          imagen: 'assets/clientes/requeterico/c1.webp',
          small_imagen: 'assets/clientes/requeterico/c1-small.webp'
        },
        {
          nombre: 'Frappe Americano',
          descripcion: 'Helado de americana, café, leche, crema e hielo batidos hasta lograr una bebida suave y espumosa. Refrescante y con carácter',
          precio: 4800,
          imagen: 'assets/clientes/requeterico/f1.webp',
          small_imagen: 'assets/clientes/requeterico/f1-small.webp'
        },
        {
          nombre: 'Frappe de Dulce de Leche',
          descripcion: 'Helado de dulce de leche, café, leche, crema e hielo. Una combinación cremosa y golosa, perfecta para los amantes del sabor argentino',
          precio: 4800,
          imagen: 'assets/clientes/requeterico/f1.webp',
          small_imagen: 'assets/clientes/requeterico/f1-small.webp'
        },
        {
          nombre: 'Frappe de Chocolate',
          descripcion: 'Helado de chocolate, café, leche, crema e hielo. Intenso y dulce, ideal para los que buscan algo bien chocolatoso',
          precio: 4800,
          imagen: 'assets/clientes/requeterico/f1.webp',
          small_imagen: 'assets/clientes/requeterico/f1-small.webp'
        },
        {
          nombre: 'Flat White',
          descripcion: 'Bebida cremosa con doble shot de espresso y leche vaporizada finamente texturizada. Un equilibrio perfecto entre intensidad y suavidad, ideal para los amantes del café con leche',
          precio: 4800,
          imagen: 'assets/clientes/requeterico/flat-white.webp',
          small_imagen: 'assets/clientes/requeterico/flat-white-small.webp'
        },
        {
          nombre: 'Café Irlandés',
          descripcion: 'Un clásico internacional con carácter: café espresso intenso, whisky irlandés suave y una capa de crema espesa. Perfecto para tardes frías o un momento especial con amigos',
          precio: 5200,
          imagen: 'assets/clientes/requeterico/cafe-irlandes.webp',
          small_imagen: 'assets/clientes/requeterico/cafe-irlandes-small.webp'
        },
        {
          nombre: 'Café Requeterico',
          descripcion: 'Nuestro café insignia: blend artesanal de granos seleccionados, con aroma intenso, cuerpo equilibrado y notas sutiles a chocolate y frutos secos. Preparado con esmero por nuestros baristas.',
          precio: 3500,
          imagen: 'assets/clientes/requeterico/cafe-requeterico.webp',
          small_imagen: 'assets/clientes/requeterico/cafe-requeterico-small.webp'
        },
      ]
    },
    {
      label: 'Tortas',
      icon: 'assets/clientes/requeterico/icono2.webp',
      route: 'tortas',
      nombre: 'Tortas',
      productos: [
        {
          nombre: 'Cheescake con Frutos Rojos',
          descripcion: 'Base de galletas crocantes, crema de queso suave y untuosa, coronada con un coulis artesanal de frutos rojos. Un postre fresco y elegante, ideal para quienes buscan un sabor equilibrado y sofisticado',
          precio: 7500,
          imagen: 'assets/clientes/requeterico/t18.webp',
          small_imagen: 'assets/clientes/requeterico/t18-small.webp'
        },
        // {
        //   nombre: 'Torta de chocolate',
        //   descripcion: 'Chocolate oscuro y mousse de chocolate relleno, una combinación rica y suave',
        //   precio: 8900,
        //   imagen: 'assets/clientes/requeterico/t0.webp',
        // small_imagen: 'assets/clientes/requeterico/t0.webp'
        // },
        {
          nombre: 'Torta Carrot Cake',
          descripcion: 'Tres capaz de suave bizcochuelo de zanahoria, rellenas con nuestra clásica crema de queso y coronadas con nueces seleccionadas. Un clásico irresistible de Requeterico',
          precio: 7500,
          imagen: 'assets/clientes/requeterico/t3.webp',
          small_imagen: 'assets/clientes/requeterico/t3-small.webp'
        },
        {
          nombre: 'Tarta de manzana',
          descripcion: 'Clásica tarta artesanal con base de masa suave, rellena de crema pastelera y manzanas frescas caramelizadas con un toque de canela. Un sabor reconfortante que nunca pasa de moda',
          precio: 7500,
          imagen: 'assets/clientes/requeterico/t9.webp',
          small_imagen: 'assets/clientes/requeterico/t9-small.webp',
        },
        {
          nombre: 'Tarta de Frutillas',
          descripcion: 'Base crocante con dulce de leche, crema y frutillas seleccionadas frescas. Un postre simple y delicioso que resalta lo mejor de esta fruta',
          precio: 7500,
          imagen: 'assets/clientes/requeterico/t1.webp',
          small_imagen: 'assets/clientes/requeterico/t1-small.webp',
        },
        {
          nombre: 'Lemon Pie',
          descripcion: 'Base de masa dulce, rellena con crema de limón bien cítrica y cubierta con merengue italiano dorado. Un equilibrio perfecto entre dulzura y acidez',
          precio: 7500,
          imagen: 'assets/clientes/requeterico/t2.webp',
          small_imagen: 'assets/clientes/requeterico/t2-small.webp'
        },
        {
          nombre: 'Brunet',
          descripcion: 'Brownie intenso con dulce de leche y mousse de chocolate semiamargo. Una explosión de texturas y sabores para fanáticos del chocolate',
          precio: 7500,
          imagen: 'assets/clientes/requeterico/t0.webp',
          small_imagen: 'assets/clientes/requeterico/t0-small.webp',
        },
        {
          nombre: 'Torta de chocolate',
          descripcion: 'Bizcochuelo húmedo de chocolate relleno con crema, dulce de leche y trocitos de chocolate. Una tentación para quienes buscan puro sabor',
          precio: 7500,
          imagen: 'assets/clientes/requeterico/t11.webp',
          small_imagen: 'assets/clientes/requeterico/t11-small.webp'
        },
        // {
        //   nombre: 'Torta Mousse de Chocolate',
        //   descripcion: 'Combinación perfecta de mousse aireado de chocolate con base de bizcochuelo suave. Un clásico elegante e irresistible',
        //   precio: 7500,
        //   imagen:'',
        // small_imagen:''
        // },
        {
          nombre: 'Torta Oreo',
          descripcion: 'Capas de bizcochuelo de chocolate y crema con galletas Oreo trozadas. Dulce, crocante y cremosa, ideal para los fans de esta famosa galletita',
          precio: 7500,
          imagen: 'assets/clientes/requeterico/t4.webp',
          small_imagen: 'assets/clientes/requeterico/t4-small.webp'
        },
        // {
        //   nombre: 'Chocotorta',
        //   descripcion: 'Típico postre argentino con galletitas Chocolinas, dulce de leche y queso crema. Simple, fresco y amado por todos',
        //   precio: 7500
        // },
        // {
        //   nombre: 'Torta Mousse de Chocolate Blanco con Frutos',
        //   descripcion: 'Suave mousse de chocolate blanco sobre base de bizcochuelo húmedo, con frutos rojos frescos por encima. Un equilibrio delicado entre lo dulce y lo ácido',
        //   precio: 7500
        // },
        // {
        //   nombre: 'Torta Bariloche',
        //   descripcion: 'Bizcochuelo de chocolate, crema bariloche y chocolate Marroc. Sabor intenso y textura suave para un viaje dulce al sur',
        //   precio: 7500
        // },
        // {
        //   nombre: 'Torta 3 Mousse',
        //   descripcion: 'Tres capas de mousse: chocolate negro, blanco y con leche, sobre una base de bizcochuelo. Una experiencia completa para los amantes del cacao',
        //   precio: 7500,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        {
          nombre: 'Red Velvet',
          descripcion: 'Bizcochuelo rojo aterciopelado, relleno con clásica crema de queso. Una torta tan linda como deliciosa',
          precio: 7500,
          imagen: 'assets/clientes/requeterico/t15.webp',
          small_imagen: 'assets/clientes/requeterico/t15-small.webp'
        },
        // {
        //   nombre: 'Selva Negra',
        //   descripcion: 'Bizcochuelo de chocolate con crema chantilly, cerezas y virutas de chocolate. Un clásico centroeuropeo con alma argentina',
        //   precio: 7500
        // },
        // {
        //   nombre: 'Cheescake de Maracuyá',
        //   descripcion: 'Frescura tropical en una torta cremosa con base de galleta, rellena con cheesecake suave y cobertura de maracuyá natural',
        //   precio: 7500
        // },
        {
          nombre: 'Marquise con dulce de leche, crema y frutos rojos',
          descripcion: 'Textura intensa y sedosa de marquise de chocolate, combinada con dulce de leche, crema y el toque ácido de frutos rojos',
          precio: 7500,
          imagen: 'assets/clientes/requeterico/t16.webp',
          small_imagen: 'assets/clientes/requeterico/t16-small.webp'
        },
        {
          nombre: 'Rogel',
          descripcion: 'Capas finas y crujientes de masa hojaldrada, rellenas con abundante dulce de leche y cubiertas con merengue italiano suave y dorado. Una combinación clásica y perfecta de crocante, cremoso y dulce',
          precio: 7500,
          imagen: 'assets/clientes/requeterico/t17.webp',
          small_imagen: 'assets/clientes/requeterico/t17-small.webp',
        },
        {
          nombre: 'Postre tipo Balcarce',
          descripcion: 'Capas de pionono suave intercaladas con dulce de leche, crema chantilly, merengue crocante y castañas de cajú. Una combinación equilibrada de texturas y sabores que reinterpreta el clásico Balcarce con el sello artesanal de Requeterico',
          precio: 7500,
          imagen: 'assets/clientes/requeterico/t14.webp',
          small_imagen: 'assets/clientes/requeterico/t14-small.webp'
        },
        // {
        //   nombre: 'Tiramisú',
        //   descripcion: '',
        //   precio: 7500
        // },
        {
          nombre: 'Torta Mousse de Banana Split',
          descripcion: 'Suave mousse de banana, dulce de leche y chocolate sobre base de bizcochuelo esponjoso. Inspiración en el clásico postre helado',
          precio: 7500,
          imagen: 'assets/clientes/requeterico/t7.webp',
          small_imagen: 'assets/clientes/requeterico/t7-small.webp',
        },
        {
          nombre: 'Torta Brownie con dulce de leche y merengue',
          descripcion: 'Brownie intenso con capa generosa de dulce de leche y merengue tostado. Textura crocante por fuera, fundente por dentro',
          precio: 7500,
          imagen: 'assets/clientes/requeterico/t10.webp',
          small_imagen: 'assets/clientes/requeterico/t10-small.webp'
        },
        // {
        //   nombre: 'Key lime pie',
        //   descripcion: 'Base de masa crocante con una sedosa crema de lima y cobertura de merengue. Refrescante y equilibrada',
        //   precio: 7500
        // },
        // {
        //   nombre: 'Torta Moka',
        //   descripcion: 'Bizcochuelo de chocolate, crema de chocolate y mousse de café. El toque justo entre lo dulce y el aroma intenso del café',
        //   precio: 7500
        // },
        {
          nombre: 'Torta Block',
          descripcion: 'Capas de chocolate, dulce de leche y marquise de vainilla. Una torta con historia, para los que aman los sabores de siempre',
          precio: 7500,
          imagen: 'assets/clientes/requeterico/t13.webp',
          small_imagen: 'assets/clientes/requeterico/t13-small.webp'
        },
        // {
        //   nombre: 'Torta de Nuez',
        //   descripcion: 'Bizcochuelo húmedo con nueces seleccionadas y crema. Un clásico tradicional que nunca falla',
        //   precio: 7500
        // },
        {
          nombre: 'Marquisse  Oreo',
          descripcion: 'Base crocante de galletitas Oreo, crema suave de chocolate y un topping de galletas trituradas. Un postre intenso y cremoso, favorito entre los más golosos',
          precio: 7500,
          imagen: 'assets/clientes/requeterico/marquisse-oreo.webp',
          small_imagen: 'assets/clientes/requeterico/marquisse-oreo-small.webp'
        },
        // {
        //   nombre: 'Marquise Nutella',
        //   descripcion: 'Una delicia intensa de marquise de chocolate con el inconfundible sabor a Nutella. Suave,cremosa y tentadora',
        //   precio: 7500
        // },
      ]
    },
    // {
    //   label: 'Infusiones',
    //   icon: '🍵',
    //   route: 'infusiones',
    //   nombre: 'Infusiones',
    //   productos: [
    //     {
    //       nombre: 'Té verde',
    //       descripcion: 'Hojas de té verde orgánico, frescas y naturales',
    //       precio: 4500,
    //       imagen: 'assets/clientes/requeterico/t1.webp',
    //small_imagen: 'assets/clientes/requeterico/t1.webp'
    //     },
    //     {
    //       nombre: 'Té chai',
    //       descripcion: 'Té negro con una mezcla de especias: canela, jengibre, cardamomo y clavo',
    //       precio: 5000,
    //       imagen: 'assets/clientes/requeterico/t1.webp',
    //small_imagen: 'assets/clientes/requeterico/t1.webp'
    //     },
    //     {
    //       nombre: 'Mate cocido',
    //       descripcion: 'Yerba mate de alta calidad, infusionada para un sabor suave y tradicional',
    //       precio: 4000,
    //       imagen: 'assets/clientes/requeterico/t1.webp',
    //small_imagen: 'assets/clientes/requeterico/t1.webp'
    //     },
    //   ]
    // },
    {
      label: 'Jugos',
      icon: 'assets/clientes/requeterico/icono7.webp',
      route: 'jugos',
      nombre: 'Jugos',
      productos: [
        {
          nombre: 'Jugo de naranja',
          descripcion: 'Naranjas frescas exprimidas al momento, con todo su jugo natural',
          precio: 5200,
          imagen: 'assets/clientes/requeterico/j1.webp',
          small_imagen: 'assets/clientes/requeterico/j1-small.webp'
        },
        {
          nombre: 'Jugo especial verde',
          descripcion: 'Una combinación energética de frutos rojos, espinaca fresca y jugo natural de naranja',
          precio: 5500,
          imagen: 'assets/clientes/requeterico/s1.webp',
          small_imagen: 'assets/clientes/requeterico/s1-small.webp'
        },
        {
          nombre: 'Limonada con menta y jengibre',
          descripcion: 'Limones frescos y hojas de menta, para una bebida refrescante y cítrica',
          precio: 5200,
          imagen: 'assets/clientes/requeterico/j2.webp',
          small_imagen: 'assets/clientes/requeterico/j2-small.webp'
        },
      ]
    },
    {
      label: 'Sandwichs Calientes',
      icon: 'assets/clientes/requeterico/icono4.webp',
      route: 'tostados-sandwiches',
      nombre: 'Tostados & Sandwiches',
      productos: [
        {
          nombre: 'Tostado de miga',
          descripcion: 'Jamón cocido y queso fundido, entre pan crujiente, un clásico irresistible',
          precio: 7500,
          imagen: 'assets/clientes/requeterico/tost1.webp',
          small_imagen: 'assets/clientes/requeterico/tost1-small.webp'
        },
        // {
        //   nombre: 'Tostado Árabe (XL)',
        //   descripcion: '',
        //   precio: 7500,
        //   imagen: 'assets/clientes/requeterico/tost1.webp',
        // small_imagen: 'assets/clientes/requeterico/tost1.webp'
        // },
        // {
        //   nombre: 'Tostado con crudo',
        //   descripcion: '',
        //   precio: 8000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        {
          nombre: 'Tostado Requeterico',
          descripcion: 'Pan de campo dorado y crujiente, con jamón cocido natural y queso fundido en su punto justo. Un clásico irresistible, ideal para acompañar con café o jugos naturales en cualquier momento del día',
          precio: 7800,
          imagen: 'assets/clientes/requeterico/tostado-requeterico.webp',
          small_imagen: 'assets/clientes/requeterico/tostado-requeterico-small.webp'
        },
        // {
        //   nombre: 'Tostado en pan focaccia',
        //   descripcion: 'lomito ahumado y queso',
        //   precio: 8200,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        {
          nombre: 'Tostón con salmón y alcaparras',
          descripcion: 'Rebanada de pan artesanal levemente tostado, con una base suave de queso crema, láminas de salmón ahumado y un toque de alcaparras que aportan el equilibrio perfecto entre lo cremoso, lo salado y lo fresco. Una opción elegante y sabrosa para disfrutar a cualquier hora',
          precio: 7800,
          imagen: 'assets/clientes/requeterico/sand_tost_salm.webp',
          small_imagen: 'assets/clientes/requeterico/sand_tost_salm-small.webp'
        },
        // {
        //   nombre: 'Lomito solo con fritas',
        //   descripcion: '',
        //   precio: 12000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        // {
        //   nombre: 'Lomito con jamón y queso con fritas',
        //   descripcion: '',
        //   precio: 13000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        // {
        //   nombre: 'Lomito completo con fritas',
        //   descripcion: '',
        //   precio: 15000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        // {
        //   nombre: 'Pechuga sola con fritas',
        //   descripcion: '',
        //   precio: 12000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // }, ,
        // {
        //   nombre: 'Pechuga jamón y queso con fritas',
        //   descripcion: '',
        //   precio: 13000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        // {
        //   nombre: 'Pechuga completa con fritas',
        //   descripcion: '',
        //   precio: 15000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // }, ,
        // {
        //   nombre: 'Hamburguesa sola con fritas',
        //   descripcion: '',
        //   precio: 11000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        // {
        //   nombre: 'Hamburguesa jamon y queso con fritas',
        //   descripcion: '',
        //   precio: 12000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        // {
        //   nombre: 'Hamburguesa completa con fritas',
        //   descripcion: 'Opcional: Tomate,lechuga,rucula ($700)',
        //   precio: 14000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        // {
        //   nombre: 'Papas cheddar',
        //   descripcion: '',
        //   precio: 9000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        // {
        //   nombre: 'Papas requetericas',
        //   descripcion: '',
        //   precio: 9000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        // {
        //   nombre: 'Ciabatta (XL) Atun',
        //   descripcion: '',
        //   precio: 12000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        // {
        //   nombre: 'Ciabatta (XL) caesar',
        //   descripcion: '',
        //   precio: 12000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // }, ,
        // {
        //   nombre: 'Ciabatta (XL) vegetariana',
        //   descripcion: '',
        //   precio: 12000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
      ]
    },
    {
      label: 'Tartas',
      icon: 'assets/clientes/requeterico/icono-tarta.png',
      route: 'tartas',
      nombre: 'tartas',
      productos: [
        //     {
        //       nombre: 'Calabaza, puerro y muzzarella',
        //       descripcion: '',
        //       precio: 8000,
        //       imagen: 'assets/clientes/requeterico/',
        //small_imagen: 'assets/clientes/requeterico/'
        //     },
        //     {
        //       nombre: 'Espinaca',
        //       descripcion: '',
        //       precio: 8000,
        //       imagen: 'assets/clientes/requeterico/',
        //small_imagen: 'assets/clientes/requeterico/'
        //     },
        {
          nombre: 'Mix de vegetales',
          descripcion: 'Una porción generosa, sabrosa y equilibrada. Preparada con una selección de vegetales frescos salteados y una capa cremosa de muzzarella derretida sobre una base casera dorada al horno. Ideal para una comida liviana pero reconfortante',
          precio: 8000,
          imagen: 'assets/clientes/requeterico/tarta_mix_veg.webp',
          small_imagen: 'assets/clientes/requeterico/tarta_mix_veg-small.webp'
        },
        //     {
        //       nombre: 'Brocoli',
        //       descripcion: '',
        //       precio: 8000,
        //       imagen: 'assets/clientes/requeterico/',
        //small_imagen: 'assets/clientes/requeterico/'
        //     },
        //     {
        //       nombre: 'Choclo y zapallo',
        //       descripcion: '',
        //       precio: 8000,
        //       imagen: 'assets/clientes/requeterico/',
        //small_imagen: 'assets/clientes/requeterico/'
        //     },
      ]
    },
    {
      label: 'Pastelería',
      icon: 'assets/clientes/requeterico/icono3.webp',
      route: 'pastelería',
      nombre: 'pastelería',
      productos: [
        // {
        //   nombre: 'Medialuna',
        //   descripcion: '',
        //   precio: 1100,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        // {
        //   nombre: 'Medialuna con jamón y queso',
        //   descripcion: '',
        //   precio: 3000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        // {
        //   nombre: 'Roll relleno con pastelera, manzana y pasas',
        //   descripcion: '',
        //   precio: 4800,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        // {
        //   nombre: 'Tostadas de pan blanco o integral',
        //   descripcion: 'Con semillas, queso crema o manteca, y mermelada',
        //   precio: 4700,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        {
          nombre: 'Avocado toast',
          descripcion: 'Tostada de pan integral con una base generosa de palta fresca, coronada con huevo y un mix de semillas. Una propuesta liviana, nutritiva y llena de sabor natural',
          precio: 7000,
          imagen: 'assets/clientes/requeterico/avocado-toast.webp',
          small_imagen: 'assets/clientes/requeterico/avocado-toast-small.webp'
        },
        // {
        //   nombre: 'Alfajor de maicena',
        //   descripcion: '',
        //   precio: 3500,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        {
          nombre: 'Alfajor masa sableé',
          descripcion: 'Dos capas de masa sableé, suave y delicada, que se deshace en la boca. Relleno con abundante dulce de leche y bañado en chocolate. Una combinación artesanal perfecta para los amantes de lo clásico',
          precio: 3500,
          imagen: 'assets/clientes/requeterico/a1.webp',
          small_imagen: 'assets/clientes/requeterico/a1-small.webp'
        },
        // {
        //   nombre: 'Alfajor de coco con dulce de leche',
        //   descripcion: '',
        //   precio: 3500,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        {
          nombre: 'Alfajor santafecino',
          descripcion: 'Capas finas de masa crujiente rellenas con dulce de leche repostero, coronadas con un glaseado artesanal. Una joya tradicional argentina, con el toque irresistible de Requeterico',
          precio: 3500,
          imagen: 'assets/clientes/requeterico/a7.webp',
          small_imagen: 'assets/clientes/requeterico/a7-small.webp'
        },
        {
          nombre: 'Alfajor de masa integral con dulce de leche',
          descripcion: 'Una versión más rústica y nutritiva del clásico: masa integral suave al paladar, con dulce de leche cremoso en su interior. Una opción equilibrada sin perder dulzura ni sabor',
          precio: 3500,
          imagen: 'assets/clientes/requeterico/a1.webp',
          small_imagen: 'assets/clientes/requeterico/a1-small.webp'
        },
        {
          nombre: 'Alfajor de nuez',
          descripcion: 'Masa suave de nuez molida, con un relleno generoso de dulce de leche y un baño de glasé o chocolate. Una experiencia intensa y elegante que destaca por su sabor y textura',
          precio: 5000,
          imagen: 'assets/clientes/requeterico/a5.webp',
          small_imagen: 'assets/clientes/requeterico/a5-small.webp'
        },
        {
          nombre: 'Cookies Rellenas de Nutella (x3)',
          descripcion: 'Tres deliciosas galletas caseras, crocantes por fuera y con un corazón suave y generoso de Nutella derretida. Perfectas para acompañar tu café o disfrutar como un capricho dulce en cualquier momento del día.',
          precio: 5000,
          imagen: 'assets/clientes/requeterico/paste_cnut.webp',
          small_imagen: 'assets/clientes/requeterico/paste_cnut-small.webp'
        },
        // {
        //   nombre: 'Tarta de coco con dulce de leche',
        //   descripcion: '',
        //   precio: 5500,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        // {
        //   nombre: 'Tarta cabsha',
        //   descripcion: '',
        //   precio: 5500,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        // {
        //   nombre: 'Pastafrola',
        //   descripcion: '',
        //   precio: 5000,
        //   imagen: 'assets/clientes/requeterico/a3.webp',
        // small_imagen: 'assets/clientes/requeterico/a3.webp'
        // },
        // {
        //   nombre: 'Cuadrado de ricota',
        //   descripcion: '',
        //   precio: 6500,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        // {
        //   nombre: 'Cuadrado de maní',
        //   descripcion: 'base de chocolate, dulce de leche, maní y ganache de chocolate blanco',
        //   precio: 6500,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
      ]
    },
    {
      label: 'Rinconcito Integral',
      icon: 'assets/clientes/requeterico/icono6.webp',
      route: 'rinconcito-integral',
      nombre: 'rinconcito-integral',
      productos: [
        {
          nombre: 'Pastafrola integral',
          descripcion: 'Clásica tarta de masa integral con azúcar mascabo, rellena con dulce de membrillo artesanal. Una versión más saludable sin perder el sabor de siempre',
          precio: 5500,
          imagen: 'assets/clientes/requeterico/a3.webp',
          small_imagen: 'assets/clientes/requeterico/a3-small.webp'
        },
        {
          nombre: 'Pepas integrales',
          descripcion: 'Galletitas elaboradas con harina integral, endulzadas con azúcar rubio y rellenas con dulce de membrillo. Una opción nutritiva para acompañar el mate o el café',
          precio: 4000,
          imagen: 'assets/clientes/requeterico/a4.webp',
          small_imagen: 'assets/clientes/requeterico/a4-small.webp'
        },
        {
          nombre: 'Budín Inglés',
          descripcion: 'Budín casero esponjoso con frutas abrillantadas y frutos secos, horneado lentamente para lograr una textura húmeda y un sabor tradicional. Ideal para acompañar un té o café',
          precio: 4600,
          imagen: 'assets/clientes/requeterico/budin-ingles.webp',
          small_imagen: 'assets/clientes/requeterico/budin-ingles-small.webp'
        },
        {
          nombre: 'Pan de Molde Integral',
          descripcion: 'Nuestro pan de molde integral es suave, esponjoso y lleno de sabor. Hecho con harinas integrales y semillas seleccionadas, es la base perfecta para tus tostadas o sandwiches. Rico en fibra, natural y horneado con dedicación cada día',
          precio: 4600,
          imagen: 'assets/clientes/requeterico/rinc_pan_molde.webp',
          small_imagen: 'assets/clientes/requeterico/rinc_pan_molde-small.webp'
        },
        // {
        //   nombre: 'Tarta de Manzana Integral',
        //   descripcion: 'Base crocante de harina integral cubierta con manzanas frescas, canela y un toque de azúcar rubio. Dulce, aromática y natural',
        //   precio: 4000,
        //   imagen: 'assets/clientes/requeterico/a4.webp',
        // small_imagen: 'assets/clientes/requeterico/a4.webp'
        // },
        // {
        //   nombre: 'Budín de Naranja Integral',
        //   descripcion: 'Esponjoso budín elaborado sin manteca ni huevo, con jugo y ralladura de naranja natural. Un clásico de sabor cítrico ideal para cualquier momento',
        //   precio: 4000,
        //   imagen: 'assets/clientes/requeterico/a4.webp',
        // small_imagen: 'assets/clientes/requeterico/a4.webp'
        // },
        // {
        //   nombre: 'Brownie fit',
        //   descripcion: '',
        //   precio: 4000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        // {
        //   nombre: 'Tarta de dulce de leche y coco',
        //   descripcion: '',
        //   precio: 4000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        // {
        //   nombre: 'Tarta con frutos rojos',
        //   descripcion: '',
        //   precio: 4000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
        // {
        //   nombre: 'Alfajor integral relleno con dulce de leche',
        //   descripcion: '',
        //   precio: 4000,
        //   imagen: 'assets/clientes/requeterico/',
        // small_imagen: 'assets/clientes/requeterico/'
        // },
      ]
    },
    {
      label: 'desayunos\nmeriendas',
      icon: 'assets/clientes/requeterico/meriendas4.webp',
      route: 'meriendas',
      nombre: 'meriendas',
      productos: [
        {
          nombre: 'Merienda Integral',
          descripcion: 'Una opción rica y equilibrada: latte espumoso, tostadas integrales con queso y mermelada, jugo de naranja exprimido y un cremoso yogur con granola crocante. Ideal para disfrutar con calma y cuidar tu bienestar',
          precio: 7000,
          imagen: 'assets/clientes/requeterico/mer_int.webp',
          small_imagen: 'assets/clientes/requeterico/mer_int-small.webp'
        },
        {
          nombre: 'Merienda Proteica',
          descripcion: 'Energía, sabor y frescura en cada bocado: disfrutá de un avocado toast con palta fresca, huevo revuelto y tomates cherry, acompañado de un latte espumoso y un jugo de naranja exprimido. Ideal para quienes buscan una opción saludable y nutritiva sin resignar el placer',
          precio: 7000,
          imagen: 'assets/clientes/requeterico/mer_prot.webp',
          small_imagen: 'assets/clientes/requeterico/mer_prot-small.webp'
        },
        {
          nombre: 'Merienda Requeterica',
          descripcion: 'Una pausa deliciosa y reconfortante: incluye un cremoso latte con arte en taza, jugo de naranja exprimido al momento y una porción de nuestra torta artesanal a elección. Perfecta para disfrutar en buena compañía o regalarte un momento solo para vos',
          precio: 7000,
          imagen: 'assets/clientes/requeterico/mer_req.webp',
          small_imagen: 'assets/clientes/requeterico/mer_req-small.webp'
        },
        {
          nombre: 'Merienda Clásica',
          descripcion: 'La combinación infalible de siempre: dos medialunas frescas y doradas, un latte cremoso y un jugo de naranja recién exprimido. Simple, deliciosa y perfecta para cualquier momento del día',
          precio: 7000,
          imagen: 'assets/clientes/requeterico/mer_cla.webp',
          small_imagen: 'assets/clientes/requeterico/mer_cla-small.webp'
        },
        // {
        //   nombre: 'Merienda Clásica',
        //   descripcion: 'La combinación infalible de siempre: dos medialunas frescas y doradas, un latte cremoso y un jugo de naranja recién exprimido. Simple, deliciosa y perfecta para cualquier momento del día',
        //   precio: 7000,
        //   imagen: 'assets/clientes/requeterico/mer_cla.webp',
        //   small_imagen: 'assets/clientes/requeterico/mer_cla-small.webp'
        // },
      ]
    },
    // {
    //   label: 'Rincón celíaco',
    //   icon: '',
    //   route: 'rincón-celíaco',
    //   nombre: 'rincón-celíaco',
    //   productos: [
    //     {
    //       nombre: 'brownies',
    //       descripcion: '',
    //       precio: 4000,
    //       imagen: 'assets/clientes/requeterico/',
    //small_imagen: 'assets/clientes/requeterico/'
    //     },
    //     {
    //       nombre: 'pastafrola',
    //       descripcion: '',
    //       precio: 4000,
    //       imagen: 'assets/clientes/requeterico/',
    //small_imagen: 'assets/clientes/requeterico/'
    //     },
    //     {
    //       nombre: 'alfajores',
    //       descripcion: '',
    //       precio: 4000,
    //       imagen: 'assets/clientes/requeterico/',
    //small_imagen: 'assets/clientes/requeterico/'
    //     },
    //     {
    //       nombre: 'tarte de dulce y coco',
    //       descripcion: '',
    //       precio: 4000,
    //       imagen: 'assets/clientes/requeterico/',
    //small_imagen: 'assets/clientes/requeterico/'
    //     },
    //   ]
    // },
    // {
    //   label: 'Pizzas',
    //   icon: '',
    //   route: 'pizzas',
    //   nombre: 'pizzas',
    //   productos: [
    //     {
    //       nombre: 'Alfajor integral relleno con dulce de leche',
    //       descripcion: '',
    //       precio: 4000,
    //       imagen: 'assets/clientes/requeterico/',
    //small_imagen: 'assets/clientes/requeterico/'
    //     },
    //   ]
    // }
    {
      label: 'Empanadas',
      icon: 'assets/clientes/requeterico/icono-emp.png',
      route: 'empanadas',
      nombre: 'empanadas',
      productos: [
        {
          nombre: 'Empanadas Artesanales - Sabores a Elección',
          descripcion: 'Crujientes por fuera y sabrosas por dentro. Nuestras empanadas caseras vienen en una variedad de sabores para todos los gustos:\n\n🥩 Carne jugosa,\n🧀 Jamón y queso derretido,\n🐔 Pollo especiado,\n🌽 Humita cremosa,\n🌿 Verdura con un toque de queso,\n🧅 Cebolla y queso fundido,\n🍅 Capresse con albahaca fresca.\nElegí tu combinación favorita y disfrutá de un clásico irresistible.',
          precio: 4000,
          imagen: 'assets/clientes/requeterico/emp_carne.webp',
          small_imagen: 'assets/clientes/requeterico/emp_carne-small.webp'
        },
      ]
    },
    {
      label: 'Pastas',
      icon: 'assets/clientes/requeterico/icono-pasta.png',
      route: 'pastas',
      nombre: 'pastas',
      productos: [
        {
          nombre: 'Sorrentinos de Jamón y Queso',
          descripcion: 'Clásicos y reconfortantes, nuestros sorrentinos artesanales de jamón y queso vienen acompañados con la salsa que elijas: crema suave, fileto casero, bolognesa con carne o nuestra exclusiva salsa Requeterica, una irresistible combinación de crema, jamón y hongos. El sabor de siempre con un toque gourmet',
          precio: 4000,
          imagen: 'assets/clientes/requeterico/pasta_sorr.webp',
          small_imagen: 'assets/clientes/requeterico/pasta_sorr-small.webp'
        },
        // {
        //   nombre: 'Ravioles de Calabaza, Verdeo y Muzzarella',
        //   descripcion: 'Delicados y sabrosos, estos ravioles rellenos con calabaza asada, verdeo fresco y muzzarella derretida se convierten en una experiencia única al combinarlos con la salsa de tu preferencia: fileto casero, crema suave, bolognesa tradicional o nuestra exclusiva salsa Requeterica, con crema, jamón y hongos. Un plato lleno de sabor y calidez',
        //   precio: 4000,
        //   imagen: 'assets/clientes/requeterico/pasta_rav_cal.webp',
        //   small_imagen: 'assets/clientes/requeterico/pasta_rav_cal-small.webp'
        // },
        // {
        //   nombre: 'Espaguetis Caseros',
        //   descripcion: 'Clásicos y siempre bienvenidos. Nuestros espaguetis al dente se sirven con la salsa que elijas: fileto artesanal con tomates frescos, cremosa salsa blanca, bolognesa con carne cocida a fuego lento, o la irresistible salsa Requeterica con crema, jamón y hongos. Un plato reconfortante que nunca falla',
        //   precio: 4000,
        //   imagen: 'assets/clientes/requeterico/pasta_esp.webp',
        //   small_imagen: 'assets/clientes/requeterico/pasta_esp-small.webp'
        // },
        // {
        //   nombre: 'Canelones (x3 unidades)',
        //   descripcion: 'Tres generosos canelones rellenos con una deliciosa mezcla casera (preguntá por nuestras variedades del día), cubiertos con la salsa de tu preferencia: suave crema, clásico fileto, sabrosa bolognesa o la exclusiva salsa Requeterica con crema, jamón y hongos. Un plato abundante y lleno de sabor que te abraza en cada bocado',
        //   precio: 4000,
        //   imagen: 'assets/clientes/requeterico/pasta_cane.webp',
        //   small_imagen: 'assets/clientes/requeterico/pasta_cane-small.webp'
        // },
      ]
    },
    {
      label: 'Milanesas',
      icon: 'assets/clientes/requeterico/icono-mila.png',
      route: 'milanesas',
      nombre: 'milanesas',
      productos: [
        {
          nombre: 'Milanesa con papas fritas',
          descripcion: 'Clásica y reconfortante: milanesa dorada y crocante, de pollo o ternera, servida con una porción generosa de papas fritas crujientes. Una opción infalible que nunca falla, perfecta para los que aman los sabores tradicionales bien hechos',
          precio: 4000,
          imagen: 'assets/clientes/requeterico/mila_cla.webp',
          small_imagen: 'assets/clientes/requeterico/mila_cla-small.webp'
        },
        // {
        //   nombre: 'Milanesa Requeterica',
        //   descripcion: 'Nuestra versión gourmet de un clásico: milanesa de pollo o ternera cubierta con muzzarella fundida, champiñones salteados y tomates cherry confitados. Acompañada de papas fritas crocantes. Un plato lleno de sabor, ideal para los que buscan algo diferente sin dejar lo tradicional',
        //   precio: 4000,
        //   imagen: 'assets/clientes/requeterico/mila_req.webp',
        //   small_imagen: 'assets/clientes/requeterico/mila_req-small.webp'
        // },
        // {
        //   nombre: 'Milanesa Napolitana',
        //   descripcion: 'Clásica y siempre deliciosa. Milanesa de pollo o ternera, cubierta con salsa de tomate casera, jamón cocido y abundante muzzarella gratinada. Servida con una generosa porción de papas fritas doradas. Un plato que nunca falla',
        //   precio: 4000,
        //   imagen: 'assets/clientes/requeterico/mila_napo.webp',
        //   small_imagen: 'assets/clientes/requeterico/mila_napo-small.webp'
        // },
      ]
    },
    // {
    //   label: 'ensaladas',
    //   icon: 'assets/clientes/requeterico/icono6.webp',
    //   route: 'ensaladas',
    //   nombre: 'ensaladas',
    //   productos: [
    //     {
    //       nombre: 'Ensalada Caesar',
    //       descripcion: 'Una opción fresca, sabrosa y súper abundante. Lleva croutones crocantes, tiras de pechuga de pollo grillada, hojas de lechuga fresca, huevo duro y nuestro aderezo Caesar casero, cremoso y lleno de sabor. Ideal para comer liviano sin quedarte con hambre',
    //       precio: 4000,
    //       imagen: 'assets/clientes/requeterico/ensa_caes.webp',
    //       small_imagen: 'assets/clientes/requeterico/ensa_caes-small.webp'
    //     },
    //   ]
    // },
    // {
    //   label: '',
    //   icon: 'assets/clientes/requeterico/icono6.webp',
    //   route: '',
    //   nombre: '',
    //   productos: [
    //     {
    //       nombre: '',
    //       descripcion: '',
    //       precio: 4000,
    //       imagen: 'assets/clientes/requeterico/xxxxx.webp',
    //       small_imagen: 'assets/clientes/requeterico/xxxxx-small.webp'
    //     },
    //   ]
    // },
    // {
    //   label: 'Rinconcito Integral',
    //   icon: 'assets/clientes/requeterico/icono6.webp',
    //   route: 'rinconcito-integral',
    //   nombre: 'rinconcito-integral',
    //   productos: []
    // }
  ];

  constructor(private route: ActivatedRoute, private router: Router, private renderer: Renderer2) {
  }

  ngOnInit() {
    const nombre = this.route.snapshot.paramMap.get('categoria') || '';
    const objeto_categoria = this.data.find((item: { route: string; }) => item.route === nombre)
    this.nombreCategoria = objeto_categoria.nombre;
    this.items = objeto_categoria.productos || [];
    this.itemsOriginales = [...this.items];
    const random_index = Math.floor(Math.random() * this.items.length);
    this.item_placeholder = this.items[random_index]?.nombre || '';
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

  onSearch(term: string) {
    console.log(term)
    this.searchTerm = term;
    this.isLoading = true;

    setTimeout(() => { // Simula un pequeño delay
      this.buscarProducto();
      this.isLoading = false;
    }, 300); // 300ms de espera para "loading"
  }

  buscarProducto() {
    const termino = this.searchTerm.trim().toLowerCase();

    if (!termino) {
      this.items = [...this.itemsOriginales];
      return;
    }

    const palabras = termino.split(' ');

    this.items = this.itemsOriginales.filter((producto: any) => {
      const textoProducto = `${producto.nombre} ${producto.descripcion}`.toLowerCase();
      return palabras.every(palabra => textoProducto.includes(palabra));
    });
  }

  openLightbox(imageUrl: string) {
    this.lightboxImage = imageUrl;
    this.lightboxVisible = true;
    document.body.style.overflow = 'hidden'; // Bloquea scroll
    this.applyPerformanceHacks(); // Aplica optimizaciones
  }
  

  closeLightbox(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('lightbox')) {
      this.lightboxVisible = false;
      this.zoomLevel = 1;
      this.zoomTransform = 'scale(1)';
      document.body.style.overflow = '';

      setTimeout(() => {
        this.lightboxImage = '';
      }, 300);
    }
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
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private offsetX = 0;
  private offsetY = 0;
  resetZoom() {
    this.zoomLevel = 1;
    this.zoomTransform = 'scale(1)';
  }
  toggleZoom() {
    if (this.zoomLevel === 1) {
      this.zoomLevel = 2;
    } else {
      this.zoomLevel = 1;
      this.offsetX = 0;
      this.offsetY = 0;
    }
    this.updateTransform();
  }

  handleDoubleTap(event: TouchEvent) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - this.lastTap;

    if (tapLength < 300 && tapLength > 0) {
      event.preventDefault();
      this.toggleZoom();
      this.lastTap = 0;
    } else {
      this.lastTap = currentTime;
    }
  }
  startDrag(event: MouseEvent | TouchEvent) {
    if (this.zoomLevel === 1) return;
    const img = event.target as HTMLElement;
    img.classList.add('panning');
    this.isDragging = true;
    const clientX = this.getClientX(event);
    const clientY = this.getClientY(event);

    this.startX = clientX - this.offsetX;
    this.startY = clientY - this.offsetY;
  }

  onDrag(event: MouseEvent | TouchEvent) {
    if (!this.isDragging || this.zoomLevel === 1) return;

    event.preventDefault();
    const clientX = this.getClientX(event);
    const clientY = this.getClientY(event);

    this.offsetX = clientX - this.startX;
    this.offsetY = clientY - this.startY;
    this.updateTransform();
  }

  endDrag() {
    this.isDragging = false;
    const img = document.querySelector('.lightbox-content');
    if (img) {
      img.classList.remove('panning');
      // Pequeño timeout para suavizar la transición final
      setTimeout(() => {
        img.classList.add('smooth-transition');
      }, 50);
    }
  }

  private getClientX(event: MouseEvent | TouchEvent): number {
    return event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
  }

  private getClientY(event: MouseEvent | TouchEvent): number {
    return event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
  }

  private updateTransform() {
    this.zoomTransform = `
    translate3d(${this.offsetX}px, ${this.offsetY}px, 0)
    scale(${this.zoomLevel})
  `;
    // this.zoomTransform = `
    //   scale(${this.zoomLevel})
    //   translate(${this.offsetX}px, ${this.offsetY}px)
    // `;
  }

  private applyPerformanceHacks() {
    const img = document.querySelector('.lightbox-content') as HTMLElement;
    if (img) {
      // Fuerza la aceleración por hardware
      img.style.transform = 'translateZ(0)';
    }
  }

}