import { Component, DestroyRef, Renderer2, inject } from '@angular/core';
import { RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private readonly destroyRef = inject(DestroyRef);

  constructor(private router: Router, private renderer: Renderer2) { }

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
      const url = this.router.url;
      const match = url.match(/menuonline\/([^\/]+)/);

      document.body.classList.forEach(cls => {
        if (cls.startsWith('cliente-')) {
          this.renderer.removeClass(document.body, cls);
        }
      });

      if (match && match[1]) {
        const clienteClass = `cliente-${match[1].toLowerCase()}`;
        this.renderer.addClass(document.body, clienteClass);
      }
    });
  }
}
