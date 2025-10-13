import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit, Output, ViewChild, EventEmitter, SimpleChanges, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
@Component({
        selector: 'app-slider',
        imports: [CommonModule, RouterModule],
        templateUrl: './slider.component.html',
        styleUrls: ['./slider.component.css'],
        standalone: true,
        changeDetection: ChangeDetectionStrategy.OnPush
})
export class SliderComponent implements OnInit, OnDestroy {
        @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
        @ViewChild('scrollTrack') scrollTrack!: ElementRef<HTMLDivElement>;
        currentCategory: string | null = null;
        @Input() categorias: any[] = [];
        @Input() cliente: string = '';
        @Input() categoriaActual: string = '';
        @Output() categoriaSeleccionada = new EventEmitter<string>();
        cardImage = ""
        backgroundImage = ""
        isSticky = false;
        canScrollLeft = false;
        canScrollRight = false;
        constructor(
                public router: Router,
                private route: ActivatedRoute,
                private cdr: ChangeDetectorRef,
                private ngZone: NgZone,
        ) { }
        ngOnInit() {
                this.cardImage = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.cliente}%2Ffondo-claro.webp?alt=media`
                this.backgroundImage = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.cliente}%2Fbackground_image.webp?alt=media`
        }
        ngAfterViewInit() {
                this.scrollToActiveCategory();
                setTimeout(() => this.updateScrollControls(), 0);
                // Listeners fuera de Angular para no disparar CD por frame
                this.addGlobalListeners();
        }
        ngOnDestroy() {
                this.removeGlobalListeners();
        }

        ngOnChanges(changes: SimpleChanges) {
                if (changes['categoriaActual'] && !changes['categoriaActual'].firstChange) {
                        this.scrollToActiveCategory();
                }
        }
        get clienteClass(): string {
                return `cliente-${this.cliente.toLowerCase()}`;
        }

        private scrollToActiveCategory() {
                setTimeout(() => {
                        const activeItem = this.scrollContainer?.nativeElement.querySelector('.slider-item.active');
                        if (activeItem) {
                                activeItem.scrollIntoView({
                                        behavior: 'instant',
                                        block: 'nearest',
                                        inline: 'center'
                                });
                        }
                        this.updateScrollControls();
                }, 0);
        }

        isActiveCategory(categoryRoute: string): boolean {
                return this.categoriaActual === categoryRoute;
        }

        seleccionarCategoria(route: string) {
                this.categoriaSeleccionada.emit(route);
                window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll arriba al seleccionar
        }

        onContainerScroll() {
                this.updateScrollControls();
        }

        scrollByItems(direction: 'left' | 'right') {
                const container = this.scrollContainer?.nativeElement;
                if (!container) return;
                const itemsToScroll = window.innerWidth < 768 ? 3 : 4;
                const delta = this.getItemStride() * itemsToScroll;
                const target = this.clampScroll(
                        container.scrollLeft + (direction === 'right' ? delta : -delta),
                        0,
                        container.scrollWidth - container.clientWidth
                );
                this.smoothScrollTo(container, target, 150);
        }

        private getItemStride(): number {
                const firstItem = this.scrollContainer?.nativeElement.querySelector('.slider-item') as HTMLElement | null;
                if (!firstItem) return this.scrollContainer.nativeElement.clientWidth;
                const rect = firstItem.getBoundingClientRect();
                const trackEl = this.scrollTrack?.nativeElement as HTMLElement | undefined;
                let gap = 0;
                if (trackEl) {
                        const style = getComputedStyle(trackEl);
                        const gapStr = (style as any).gap || (style as any).columnGap || '0';
                        const parsed = parseFloat(gapStr);
                        gap = isNaN(parsed) ? 0 : parsed;
                }
                return rect.width + gap;
        }

        private clampScroll(value: number, min: number, max: number) {
                return Math.max(min, Math.min(max, value));
        }

        private smoothScrollTo(container: HTMLDivElement, targetLeft: number, duration = 400) {
                const startLeft = container.scrollLeft;
                const change = targetLeft - startLeft;
                if (change === 0 || duration <= 0) {
                        container.scrollLeft = targetLeft;
                        this.updateScrollControls();
                        return;
                }
                // Temporarily disable scroll snap to avoid jumpy behavior
                const prevSnap = container.style.scrollSnapType;
                container.style.scrollSnapType = 'none';

                const startTime = performance.now();
                const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

                const animate = (now: number) => {
                        const elapsed = now - startTime;
                        const t = Math.min(1, elapsed / duration);
                        const eased = easeInOutCubic(t);
                        container.scrollLeft = startLeft + change * eased;
                        if (t < 1) {
                                requestAnimationFrame(animate);
                        } else {
                                // Restore snap after a tick so it doesn't snap back abruptly
                                setTimeout(() => {
                                        container.style.scrollSnapType = prevSnap;
                                        this.updateScrollControls();
                                }, 50);
                        }
                };
                requestAnimationFrame(animate);
        }

        private updateScrollControls() {
                const container = this.scrollContainer?.nativeElement;
                if (!container) return;
                const maxScrollLeft = container.scrollWidth - container.clientWidth;
                const epsilon = 5; // tolerancia para redondeos en mobile
                const nextLeft = container.scrollLeft > epsilon;
                const nextRight = (maxScrollLeft - container.scrollLeft) > epsilon;
                let changed = false;
                if (nextLeft !== this.canScrollLeft) {
                        this.canScrollLeft = nextLeft;
                        changed = true;
                }
                if (nextRight !== this.canScrollRight) {
                        this.canScrollRight = nextRight;
                        changed = true;
                }
                if (changed) this.cdr.markForCheck();
        }

        // ---------------- Performance listeners ----------------
        private removeFns: Array<() => void> = [];
        private rafPending = false;

        private addGlobalListeners() {
                this.ngZone.runOutsideAngular(() => {
                        const onScroll = () => {
                                if (this.rafPending) return;
                                this.rafPending = true;
                                requestAnimationFrame(() => {
                                        // sticky header calc
                                        const stickyNext = window.scrollY > 135;
                                        if (stickyNext !== this.isSticky) {
                                                this.isSticky = stickyNext;
                                                this.ngZone.run(() => this.cdr.markForCheck());
                                        }
                                        this.updateScrollControls();
                                        this.rafPending = false;
                                });
                        };
                        const onResize = () => {
                                if (this.rafPending) return;
                                this.rafPending = true;
                                requestAnimationFrame(() => {
                                        this.updateScrollControls();
                                        this.rafPending = false;
                                });
                        };
                        const onTouchEnd = () => setTimeout(() => this.updateScrollControls(), 120);

                        window.addEventListener('scroll', onScroll, { passive: true });
                        window.addEventListener('resize', onResize, { passive: true });
                        window.addEventListener('touchend', onTouchEnd, { passive: true });

                        this.removeFns.push(() => window.removeEventListener('scroll', onScroll));
                        this.removeFns.push(() => window.removeEventListener('resize', onResize));
                        this.removeFns.push(() => window.removeEventListener('touchend', onTouchEnd));
                });
        }

        private removeGlobalListeners() {
                this.removeFns.forEach(fn => fn());
                this.removeFns = [];
        }
}
