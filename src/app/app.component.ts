import { Component, Renderer2, OnInit } from '@angular/core';
import { RouterOutlet, ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(private router: Router, private renderer: Renderer2) { }

  ngOnInit() {
    this.router.events.subscribe(() => {
      const url = this.router.url;
      // Extrae el cliente de la URL, por ejemplo: /menuonline/city_tandil/...
      const match = url.match(/menuonline\/([^\/]+)/);
      if (match && match[1]) {
        const clienteClass = `cliente-${match[1].toLowerCase()}`;
        // Limpia clases previas de cliente
        document.body.classList.forEach(cls => {
          if (cls.startsWith('cliente-')) {
            this.renderer.removeClass(document.body, cls);
          }
        });
        // Agrega la clase actual
        this.renderer.addClass(document.body, clienteClass);
      }
    });
  }
}
