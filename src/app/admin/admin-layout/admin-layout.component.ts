import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SpinnerComponent } from "../../shared/spinner/spinner.component";
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterModule, SpinnerComponent, CommonModule],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css','./sb-admin-2.min.css'],
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