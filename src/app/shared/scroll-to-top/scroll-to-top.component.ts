import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, Renderer2, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-scroll-to-top',
  imports: [CommonModule],
  templateUrl: './scroll-to-top.component.html',
  styleUrl: './scroll-to-top.component.css'
})
export class ScrollToTopComponent implements OnInit, AfterViewInit {
  @ViewChild('progressWrap') progressWrap!: ElementRef;
  @ViewChild('progressPath') progressPath!: ElementRef<SVGPathElement>;

  private pathLength!: number;
  private readonly offset = 1300;
  private isVisible = false;
  cliente: string = '';
  constructor(private renderer: Renderer2, private route: ActivatedRoute) { }

  get clienteClass(): string {
    return `cliente-${this.cliente.toLowerCase()}`;
  }

  ngOnInit(): void {
    this.cliente = this.route.snapshot.paramMap.get('cliente') || '';
    this.setupScrollListener();
  }

  ngAfterViewInit(): void {
    this.initializeSVGPath();
  }

  private initializeSVGPath(): void {
    const path = this.progressPath.nativeElement;
    this.pathLength = path.getTotalLength();

    this.renderer.setStyle(path, 'transition', 'none');
    this.renderer.setStyle(path, 'strokeDasharray', `${this.pathLength} ${this.pathLength}`);
    this.renderer.setStyle(path, 'strokeDashoffset', `${this.pathLength}`);
    path.getBoundingClientRect();
    this.renderer.setStyle(path, 'transition', 'stroke-dashoffset 10ms linear');
  }

  private setupScrollListener(): void {
    this.renderer.listen('window', 'scroll', () => {
      this.updateProgress();
      this.toggleVisibility();
    });
  }

  private updateProgress(): void {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = this.pathLength - (scrollY * this.pathLength / height);
    this.renderer.setStyle(this.progressPath.nativeElement, 'strokeDashoffset', `${progress}`);
  }

  private toggleVisibility(): void {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const shouldBeVisible = scrollY > this.offset;

    if (shouldBeVisible !== this.isVisible) {
      this.isVisible = shouldBeVisible;
      if (shouldBeVisible) {
        this.renderer.addClass(this.progressWrap.nativeElement, 'active-progress');
      } else {
        this.renderer.removeClass(this.progressWrap.nativeElement, 'active-progress');
      }
    }
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
