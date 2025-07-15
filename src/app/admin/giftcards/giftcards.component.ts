import { Component, ViewChild, ElementRef } from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { animate, style, transition, trigger } from '@angular/animations';
import html2canvas from 'html2canvas';
import * as QRCode from 'qrcode';


// PRIMENG
import { ChangeDetectorRef } from '@angular/core';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { Ripple } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FileUpload } from 'primeng/fileupload';
import { SelectModule } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { RadioButton } from 'primeng/radiobutton';
import { Rating } from 'primeng/rating';
import { InputNumber } from 'primeng/inputnumber';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Table } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { updatePrimaryPalette } from '@primeng/themes';
import { BadgeModule } from 'primeng/badge';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { DatePickerModule } from 'primeng/datepicker';

interface Giftcard {
  "id": string,
  "codigo": string,                // Código único o QR/barcode
  "beneficiario": string,              // (opcional) si se asigna a alguien
  "descripcion": string,
  "valor": number,                        // Cantidad de usos o valor monetario
  "estado": string,               // vigente | usada | expirada
  "fechaCreacion": Date,
  "fechaUso": Date,
  "fechaExpiracion": Date, // Fecha de expiración
  // "historial": Array<Map<string, any>> // Array de objetos con fecha y estado
  // { "fecha": "2025-07-08T10:00:00Z", "accion": "creada", "usuario": "admin" }
}

@Component({
  selector: 'app-giftcards',
  templateUrl: './giftcards.component.html',
  styleUrl: './giftcards.component.css',
  animations: [
    trigger('fadeContent', [
      transition(':enter', [
        // style({ opacity: 0, transform: 'translateY(30px)' }),
        style({ opacity: 0 }),
        // animate('600ms 100ms cubic-bezier(0.23, 1, 0.32, 1)', style({ opacity: 1, transform: 'none' }))
        animate('150ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ],
  imports: [CommonModule, FormsModule, TableModule, Dialog, SelectModule, ToastModule, ToolbarModule, ConfirmDialog, InputTextModule, TextareaModule, CommonModule, FileUpload, DropdownModule, Tag, InputTextModule, FormsModule, IconFieldModule, InputIconModule, ButtonModule, BadgeModule, RouterModule, DatePickerModule],
  providers: [MessageService, ConfirmationService]
})

export class GiftcardsComponent {
  @ViewChild('giftcardPreview') giftcardPreview!: ElementRef;
  giftcards: any = [];
  qrCodeDataUrl: string | null = null;
  displayDialog = false;
  isEdit = false;
  isLoading = false;
  loading = false;
  clienteId: string = '';
  estadosGiftcard = [
    { estado: 'Vigente', value: 'Vigente' },
    { estado: 'Usada', value: 'Usada' },
    { estado: 'Expirada', value: 'Expirada' }
  ];
  // Para el formulario
  giftcardSeleccionada: any = {};

  deleteDialogVisible = false;
  logoClienteUrl = '';

  constructor(private menuService: MenuService,
    private messageService: MessageService,
    private authService: AuthService,
    private router: Router,
  ) { }

  ngOnInit() {
    updatePrimaryPalette({
      50: '{purple.50}',
      100: '{purple.100}',
      200: '{purple.200}',
      300: '{purple.300}',
      400: '{purple.400}',
      500: '{purple.500}',
      600: '{purple.600}',
      700: '{purple.700}',
      800: '{purple.800}',
      900: '{purple.900}',
      950: '{purple.950}'
    });
    this.loading = true;
    this.authService.getUsuarioActivo().then(usuario => {
      if (usuario && usuario.clienteId) {
        this.clienteId = usuario.clienteId;
        this.logoClienteUrl = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.clienteId}%2Flogo0.webp?alt=media`;
        this.loadGiftcards();
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  async loadGiftcards() {
    this.giftcards = await this.menuService.loadGiftcards(this.clienteId);
    this.menuService.giftCardsData$.subscribe({
      next: (giftcards) => {
        this.giftcards = giftcards;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar giftcards:', error);
        this.loading = false;
      }
    })
  }


  async deleteGiftcard(giftcard: Giftcard) {
    if (giftcard.id) {
      await this.menuService.deleteGiftcard(this.clienteId, giftcard.id);
      this.loadGiftcards();
    }
  }

  async liquidarGiftcard(giftcard: Giftcard) {
    if (giftcard.id) {
      // Aquí puedes implementar el método en el service si lo necesitas
      await this.menuService.updateGiftcard(this.clienteId, giftcard.id, {
        ...giftcard,
        estado: 'usada',
        fechaUso: new Date(),
        // historial: [
        //   ...(giftcard.historial || []),
        //   { fecha: new Date(), accion: 'liquidada', usuario: 'admin' }
        // ]
      });
      this.loadGiftcards();
    }
  }

  async onAcceptDelete() {
    this.isLoading = true;
    await this.menuService.deleteGiftcard(this.clienteId, this.giftcardSeleccionada.id)
      .then(async () => {
        // await this.cargarCategorias();
        await this.menuService.loadGiftcards(this.clienteId, true); // Llama a Firestore y actualiza el observable
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Categoría eliminada', life: 3000 });
      },
        (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la categoría', life: 3000 });
        })
      .finally(() => {
        this.isLoading = false;
        this.deleteDialogVisible = false;
        this.giftcardSeleccionada = {};
      });
  }
  onCancelDelete() {
    this.displayDialog = false;
    this.giftcardSeleccionada = {};
  }

  hideDialog() {
    this.displayDialog = false;
    this.deleteDialogVisible = false;
    this.giftcardSeleccionada = {};
  }

  newGiftcard() {
    this.giftcardSeleccionada = {};
    this.displayDialog = true;
  }

  editGiftcard(giftcard: any) {
    this.giftcardSeleccionada = { ...giftcard };
    this.displayDialog = true;
  }

  isGiftcardInvalida() {
    return !this.giftcardSeleccionada?.de ||
      !this.giftcardSeleccionada?.para ||
      !this.giftcardSeleccionada?.valePor ||
      !this.giftcardSeleccionada?.fechaExpiracion ||
      this.giftcardSeleccionada.esVisible == null
  }


  async saveGiftcard() {
    this.isLoading = true
    if (this.isGiftcardInvalida()) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor completa todos los campos requeridos.' });
      this.isLoading = false
      return;
    }
    if (this.giftcardSeleccionada.id) {
      await this.menuService.updateGiftcard(this.clienteId, this.giftcardSeleccionada.id, this.giftcardSeleccionada)
        .then(async () => {
          await this.menuService.loadGiftcards(this.clienteId, true); // Llama a Firestore y actualiza el observable
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Giftcard actualizada correctamente.' });
        },
          (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la giftcard.', life: 3000 });
          })
    } else {
      const now = new Date();
      this.giftcardSeleccionada['fechaCreacion'] = now;
      await this.menuService.addGiftcard(this.clienteId, this.giftcardSeleccionada
        // {
        // ...this.giftcardSeleccionada,
        // estado: 'vigente',
        // fechaCreacion: now
        // }
      )
        .then(async () => {
          await this.menuService.loadGiftcards(this.clienteId, true); // Llama a Firestore y actualiza el observable
          this.messageService.add({ severity: 'success', summary: 'Creada', detail: 'Giftcard creada correctamente.' });
        },
          (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la giftcard.', life: 3000 });
          })
    }
    this.isLoading = false;
    this.displayDialog = false;
    this.giftcardSeleccionada = {};
  }

  // Llama esto cuando selecciones una giftcard
  async generarImagenGiftcard() {
    // Convierte el div en imagen
    const element = this.giftcardPreview.nativeElement;
    const img: HTMLImageElement | null = element.querySelector('img');
    
    if (img && !img.complete) {
      // Espera a que la imagen termine de cargar
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Si falla, igual sigue (evita bloqueo)
      });
    }
    // Pequeña espera extra para asegurar renderizado
    await new Promise(res => setTimeout(res, 100));

    const canvas = await html2canvas(element);
    const dataUrl = canvas.toDataURL('image/png');
    // 4. Intenta compartir (si el navegador lo soporta)
    if (navigator.canShare && navigator.canShare({ files: [] })) {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `giftcard_${this.giftcardSeleccionada.de.replaceAll(' ', '_').toLowerCase()}_${this.giftcardSeleccionada.para.replaceAll(' ', '_').toLowerCase()}_${this.giftcardSeleccionada.fechaExpiracion.toString().replaceAll('/','_')}.png`, { type: 'image/png' });
      try {
          await navigator.share({
            files: [file],
            title: 'Giftcard',
            text: '¡Te regalo esta giftcard!',
          });
        } catch (e) {
          // Si el usuario cancela, no hacer nada
        }
      } else {
        // 5. Fallback: descarga la imagen y muestra instrucciones
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `giftcard_${this.giftcardSeleccionada.de.replaceAll(' ', '_').toLowerCase()}_${this.giftcardSeleccionada.para.replaceAll(' ', '_').toLowerCase()}_${this.giftcardSeleccionada.fechaExpiracion.toString().replaceAll('/', '_').replaceAll('(','')}.png`;
        link.click();
        this.messageService.add({ severity: 'success', summary: 'Creada', detail: 'Giftcard creada correctamente.' });
      }
      // this.giftcardSeleccionada = giftcard;
      // 1. Genera el QR
      // this.qrCodeDataUrl = await QRCode.toDataURL(giftcard.codigo);
  
      // 2. Espera a que el QR se renderice
      // setTimeout(async () => {
        // }, 200); // Espera breve para asegurar que el QR se renderizó
  }
}
