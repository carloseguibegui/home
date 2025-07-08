import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SpinnerComponent } from "../../shared/spinner/spinner.component";
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterModule, SpinnerComponent, CommonModule],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css', './sb-admin-2.min.css'],
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
export class AdminLayoutComponent implements OnInit {
  clienteId: string | null = null;
  loading = true; // or false, depending on your spinner logic

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    // Adjust this logic to match how you get clienteId from AuthService
    this.authService.getUsuarioActivo().then(usuario => {
      if (usuario && usuario.clienteId) {
        this.clienteId = usuario.clienteId;
      } else {
        this.router.navigate(['/login']);
      }
    });
    // If async:
    // this.authService.getClienteId().subscribe(id => this.clienteId = id);
    this.loading = false; // Set loading as appropriate
  }


  logout() {
    this.authService.logout();
  }
}