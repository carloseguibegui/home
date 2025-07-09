import { Component } from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { animate, style, transition, trigger } from '@angular/animations';


// PRIMENG
import { ChangeDetectorRef, ViewChild } from '@angular/core';
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
import { error } from 'console';


interface Giftcard {
  "id": string,
  "codigo": string,                // Código único o QR/barcode
  "beneficiario": string,              // (opcional) si se asigna a alguien
  "descripcion": string,
  "valor": number,                        // Cantidad de usos o valor monetario
  "estado": string,               // vigente | usada | expirada
  "fechaCreacion": Date,
  "fechaUso": Date,
  fechaExpiracion: Date, // Fecha de expiración
  "historial": Array<Map<string, any>> // Array de objetos con fecha y estado
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
  imports: [CommonModule, FormsModule, TableModule, Dialog, SelectModule, ToastModule, ToolbarModule, ConfirmDialog, InputTextModule, TextareaModule, CommonModule, FileUpload, DropdownModule, Tag, InputTextModule, FormsModule, IconFieldModule, InputIconModule, ButtonModule, BadgeModule, RouterModule],
  providers: [MessageService, ConfirmationService]
})

export class GiftcardsComponent {
  // giftcards: Giftcard[] = [];
  giftcards: any = [];
  selectedGiftcard: Giftcard | null = null;
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
        historial: [
          ...(giftcard.historial || []),
          { fecha: new Date(), accion: 'liquidada', usuario: 'admin' }
        ]
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
    return !this.giftcardSeleccionada.codigo.trim() ||
      !this.giftcardSeleccionada.beneficiario.trim() ||
      !this.giftcardSeleccionada.descripcion.trim() ||
      !this.giftcardSeleccionada.valor.trim() ||
      !this.giftcardSeleccionada.estado.trim() ||
      !this.giftcardSeleccionada.fechaExpiracion
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
}
