import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from "../shared/header/header.component";
import { AuthService } from '../services/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class AdminComponent {
  logoUrl: string = 'assets/logos/default-logo.png'; // Ruta por defecto del logo

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit() {
    // Simula la obtención del logo dinámico del cliente
    const cliente = 'braderhops'; // Esto puede venir de un servicio o parámetro
    this.logoUrl = `assets/logos/${cliente}-logo.png`;
  }

  navigateTo(option: string) {
    switch (option) {
      case 'carta':
        this.router.navigate(['/carta']);
        break;
      case 'voucher':
        this.router.navigate(['/voucher']);
        break;
      case 'whatsapp':
        window.open('https://wa.me/123456789', '_blank'); // Abre WhatsApp en una nueva pestaña
        break;
      default:
        console.error('Opción no válida');
    }
  }
  logout() {
    this.authService.logout();
  }
}
