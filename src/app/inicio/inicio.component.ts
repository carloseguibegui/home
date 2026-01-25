import { Component, HostListener, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule, NgIf, NgStyle } from '@angular/common';

@Component({
  selector: 'app-inicio',
  imports: [CommonModule],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
  animations: [
    trigger('fadeBanner', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('800ms ease-in-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('800ms ease-in-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class InicioComponent implements OnInit, OnDestroy, AfterViewInit {
  isScrolled = false;
  bannerImages = [
    { url: 'https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/landing%2F1.webp?alt=media', route: '/menuonline/requeterico/carta' },
    { url: 'https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/landing%2F2.webp?alt=media', route: '/menuonline/demo_hotel/carta' },
    { url: 'https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/landing%2F3.webp?alt=media', route: '/menuonline/demo_cafeteria/carta' },
  ];
  bannerIndex = 0;
  bannerInterval: any;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY >= 56;
  }

  ngOnInit() {
    this.bannerInterval = setInterval(() => {
      this.bannerIndex = (this.bannerIndex + 1) % this.bannerImages.length;
    }, 6000);
  }

  async ngAfterViewInit() {
//     await import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }

  ngOnDestroy() {
    if (this.bannerInterval) {
      clearInterval(this.bannerInterval);
    }
  }
}
