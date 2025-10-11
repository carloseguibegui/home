import { Component, ViewChild, ElementRef } from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { Canvg } from 'canvg';


// PRIMENG
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DropdownModule } from 'primeng/dropdown';
import { updatePrimaryPalette } from '@primeng/themes';
import { BadgeModule } from 'primeng/badge';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
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
  imports: [CommonModule, FormsModule, TableModule, Dialog, SelectModule, ToastModule, ToolbarModule, InputTextModule, TextareaModule, CommonModule, DropdownModule, Tag, InputTextModule, FormsModule, IconFieldModule, InputIconModule, ButtonModule, BadgeModule, RouterModule, DatePickerModule],
  providers: [MessageService, ConfirmationService]
})

export class GiftcardsComponent {


  displayImageDialog: boolean = false;
  nombreCliente: string = '';
  giftcardPreviewUrl: string | null = null;
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
  logoClienteBase64: string | null = null;

  constructor(
    private menuService: MenuService,
    private messageService: MessageService,
    private authService: AuthService,
    private clienteService: ClienteService,
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
    this.authService.getUsuarioActivo().then(async usuario => {
      if (usuario && usuario.clienteId) {
        this.clienteId = usuario.clienteId;
        this.logoClienteUrl = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.clienteId}%2Flogo0.webp?alt=media`;
        this.nombreCliente = await this.clienteService.getNombreCliente(this.clienteId);
        this.loadGiftcards();
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  async loadGiftcards() {
    this.giftcards = await this.menuService.loadGiftcards(this.clienteId, true);
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
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Giftcard eliminada correctamente.', life: 3000 });
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
    this.deleteDialogVisible = false;
    this.giftcardSeleccionada = {};
    this.giftcardPreviewUrl = null;
  }

  hideDialog() {
    this.displayDialog = false;
    this.deleteDialogVisible = false;
    this.giftcardSeleccionada = {};
    this.giftcardPreviewUrl = null;
  }

  newGiftcard() {
    this.giftcardSeleccionada = {};
    this.giftcardPreviewUrl = null;
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
      this.giftcardSeleccionada.estado == null
  }


  async saveGiftcard() {
    this.isLoading = true;
    if (this.isGiftcardInvalida()) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor completa todos los campos requeridos.' });
      this.isLoading = false;
      return;
    }
    // Asegura que los colores estén definidos
    if (!this.giftcardSeleccionada.colorFondo) {
      this.giftcardSeleccionada.colorFondo = '#ffffff';
    }
    if (!this.giftcardSeleccionada.colorFuente) {
      this.giftcardSeleccionada.colorFuente = '#000000';
    }
    if (this.giftcardSeleccionada.id) {
      await this.menuService.updateGiftcard(this.clienteId, this.giftcardSeleccionada.id, this.giftcardSeleccionada)
        .then(async () => {
          await this.menuService.loadGiftcards(this.clienteId, true); // Llama a Firestore y actualiza el observable
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Giftcard actualizada correctamente.' });
        },
          (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la giftcard.', life: 3000 });
          });
    } else {
      const now = new Date();
      this.giftcardSeleccionada['fechaCreacion'] = now;
      await this.menuService.addGiftcard(this.clienteId, this.giftcardSeleccionada)
        .then(async () => {
          await this.menuService.loadGiftcards(this.clienteId, true); // Llama a Firestore y actualiza el observable
          this.messageService.add({ severity: 'success', summary: 'Creada', detail: 'Giftcard creada correctamente.' });
        },
          (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la giftcard.', life: 3000 });
          });
    }
    this.isLoading = false;
    this.displayDialog = false;
    this.giftcardSeleccionada = {};
  }

  // Llama esto cuando selecciones una giftcard
  async generarImagenGiftcard() {
    // Genera SVG dinámico para la giftcard
    const logoBase64 = this.logoClienteBase64 || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAMAAACahl6sAAAAA1BMVEUAAACnej3aAAAASElEQVR4nO3BMQEAAAgDoJvc6FEOhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgH8BzQAAZQGvVwAAAABJRU5ErkJggg==';
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='550' height='350'>
        <rect x='0' y='0' width='550' height='350' rx='16' fill='${this.giftcardSeleccionada.colorFondo || '#fff'}'/>
        <image href='${logoBase64}' x='175' y='20' width='200' height='60'/>
        <text x='50%' y='90' text-anchor='middle' font-size='38' fill='${this.giftcardSeleccionada.colorFuente || '#000'}' font-family='Pacifico, cursive'>Giftcard ${this.nombreCliente}</text>
        <text x='50%' y='160' text-anchor='middle' font-size='22' fill='${this.giftcardSeleccionada.colorFuente || '#000'}' font-family='Nunito'>De: ${this.giftcardSeleccionada.de}</text>
        <text x='50%' y='200' text-anchor='middle' font-size='22' fill='${this.giftcardSeleccionada.colorFuente || '#000'}' font-family='Nunito'>Para: ${this.giftcardSeleccionada.para}</text>
        <text x='50%' y='240' text-anchor='middle' font-size='22' fill='${this.giftcardSeleccionada.colorFuente || '#000'}' font-family='Nunito'>Vale por: ${this.giftcardSeleccionada.valePor}</text>
        <text x='50%' y='280' text-anchor='middle' font-size='18' fill='${this.giftcardSeleccionada.colorFuente || '#000'}' font-family='Nunito'>Válida hasta: ${this.giftcardSeleccionada.fechaExpiracion ? (new Date(this.giftcardSeleccionada.fechaExpiracion)).toLocaleDateString() : ''}</text>
      </svg>
    `;
    // Crea canvas y renderiza SVG con canvg
    const canvas = document.createElement('canvas');
    canvas.width = 550;
    canvas.height = 350;
    const ctx = canvas.getContext('2d');
    let dataUrl = '';
    if (ctx) {
      const v = await Canvg.fromString(ctx, svg);
      await v.render();
      dataUrl = canvas.toDataURL('image/png');
      this.giftcardPreviewUrl = dataUrl;
    }

    // Guarda la giftcard en Firestore y la imagen en Storage
    // 1. Guarda la giftcard en Firestore
    let giftcardId = this.giftcardSeleccionada.id;
    if (!giftcardId) {
      const now = new Date();
      this.giftcardSeleccionada['fechaCreacion'] = now;
      giftcardId = await this.menuService.addGiftcard(this.clienteId, this.giftcardSeleccionada);
      this.messageService.add({ severity: 'success', summary: 'Creada', detail: 'Giftcard creada correctamente.' });
    } else {
      this.messageService.add({ severity: 'success', summary: 'Actualizada', detail: 'Giftcard actualizada correctamente.' });
      await this.menuService.updateGiftcard(this.clienteId, giftcardId, this.giftcardSeleccionada);
    }

    // 2. Sube la imagen a Storage y guarda la URL en la giftcard
    if (dataUrl) {
      // Convierte base64 a Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      // Sube a Storage bajo la carpeta giftcard
      const storagePath = `giftcard/${giftcardId}.png`;
      await this.menuService.uploadGiftcardImage(this.clienteId, storagePath, blob);
      // Obtiene la URL de descarga
      const imageUrl = await this.menuService.getGiftcardImageUrl(this.clienteId, storagePath);
      // Actualiza el documento de la giftcard con la URL de la imagen
      await this.menuService.updateGiftcard(this.clienteId, giftcardId, {
        ...this.giftcardSeleccionada,
        imagen: imageUrl
      });
      this.messageService.add({ severity: 'success', summary: 'Imagen subida', detail: 'Imagen de giftcard subida y guardada.' });
    }
    this.loadGiftcards()
    this.hideDialog()
  }

  descargarImagenGiftcardDesdeUrl(url: string, nombre: string) {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = nombre || 'giftcard.png';
      link.click();
      this.messageService.add({ severity: 'success', summary: 'Descargada', detail: 'Giftcard descargada correctamente.' });
    }
  }

  descargarGiftcardImagen() {
    if (this.giftcardPreviewUrl) {
      const link = document.createElement('a');
      link.href = this.giftcardPreviewUrl;
      link.download = `giftcard_${this.giftcardSeleccionada.de.replaceAll(' ', '_').toLowerCase()}_${this.giftcardSeleccionada.para.replaceAll(' ', '_').toLowerCase()}_${this.giftcardSeleccionada.fechaExpiracion ? (new Date(this.giftcardSeleccionada.fechaExpiracion)).toLocaleDateString().replaceAll('/', '_') : ''}.png`;
      link.click();
      this.messageService.add({ severity: 'success', summary: 'Descargada', detail: 'Giftcard descargada correctamente.' });
    }
  }

  async copiarGiftcardImagen() {
    if (!this.giftcardPreviewUrl) return;
    // Verifica soporte de Clipboard API
    if (!('clipboard' in navigator) || typeof window.ClipboardItem === 'undefined') {
      this.messageService.add({ severity: 'warn', summary: 'No soportado', detail: 'Tu navegador no soporta copiar imágenes al portapapeles.' });
      return;
    }
    try {
      const response = await fetch(this.giftcardPreviewUrl);
      const blob = await response.blob();
      await (navigator as any).clipboard.write([
        new (window as any).ClipboardItem({ 'image/png': blob })
      ]);
      this.messageService.add({ severity: 'success', summary: 'Copiada', detail: 'Imagen copiada al portapapeles.' });
    } catch (e) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo copiar la imagen. Probá actualizar tu navegador.' });
    }
  }


  getEstadoLabel(estado: string): string {
    const found = this.estadosGiftcard.find(e => e.value.toLowerCase() === (estado || '').toLowerCase());
    return found ? found.estado : estado;
  }

  getEstadoSeverity(estado: string): string {
    switch ((estado || '').toLowerCase()) {
      case 'vigente': return 'success';
      case 'usada': return 'warning';
      case 'expirada': return 'danger';
      default: return 'info';
    }
  }

  verImagenGiftcard(giftcard: any) {
    this.giftcardPreviewUrl = giftcard.imagen || null;
    this.displayImageDialog = true;
    this.giftcardSeleccionada = { ...giftcard };
  }


  async descargarImagenPorUrl() {
    if (this.giftcardPreviewUrl) {
      try {
        let blob: Blob;
        // Si es base64/dataURL
        if (this.giftcardPreviewUrl.startsWith('data:')) {
          const res = await fetch(this.giftcardPreviewUrl);
          blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'giftcard.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          this.messageService.add({ severity: 'success', summary: 'Descargada', detail: 'Giftcard descargada correctamente.' });
        } else {
          // Si es una URL remota, intenta fetch (puede fallar por CORS)
          try {
            const res = await fetch(this.giftcardPreviewUrl, { mode: 'cors' });
            blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'giftcard.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            this.messageService.add({ severity: 'success', summary: 'Descargada', detail: 'Giftcard descargada correctamente.' });
          } catch (e) {
            // Fallback: abrir en nueva pestaña y mostrar mensaje
            window.open(this.giftcardPreviewUrl, '_blank');
            this.messageService.add({ severity: 'warn', summary: 'Descarga manual', detail: 'Por seguridad del servidor, la imagen se abrió en una nueva pestaña. Usá clic derecho > Guardar como.' });
          }
        }
      } catch (e) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar la imagen.' });
      }
    }
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return '';
    let dateObj: Date;
    if (fecha instanceof Date) {
      dateObj = fecha;
    } else if (fecha.seconds) {
      dateObj = new Date(fecha.seconds * 1000);
    } else {
      dateObj = new Date(fecha);
    }
    return dateObj.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit' });
  }
}
