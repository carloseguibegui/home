import { Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MenuService } from '../../services/menu.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from '../../shared/spinner/spinner.component';
import { FormsModule } from '@angular/forms';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";



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



@Component({
  selector: 'app-categorias-admin',
  templateUrl: './categorias-admin.component.html',
  styleUrl: './categorias-admin.component.css',
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
  imports: [CommonModule, SpinnerComponent, FormsModule, TableModule, Dialog, SelectModule, ToastModule, ToolbarModule, ConfirmDialog, InputTextModule, TextareaModule, CommonModule, FileUpload, DropdownModule, Tag, InputTextModule, FormsModule, InputNumber, IconFieldModule, InputIconModule, ButtonModule, BadgeModule, RouterModule],
  providers: [MessageService, ConfirmationService]
})
export class CategoriasAdminComponent implements OnInit {
  clienteId: string = '';
  categorias: any[] = [];
  categoriaDialog = false;
  deleteDialogVisible = false;
  categoriaSeleccionada: any = {};
  submitted = false;
  isLoading = false;
  loading = false;
  iconosDisponibles = [
    'pi pi-tag', 'pi pi-star', 'pi pi-heart', 'bi bi-cup-hot-fill', 'bi bi-egg-fried', 'fa fa-pizza-slice'
    // Agrega más iconos aquí
  ];
  estadosCategoria = [
    { estado: 'Activa', value: true },
    { estado: 'Oculta', value: false }
  ];
  // Para deshabilitar eliminar si tiene productos
  productosPorCategoria: { [categoriaId: string]: number } = {};



  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private menuService: MenuService,
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
        this.cargarCategorias();
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  async cargarCategorias() {
    this.loading = true;
    await this.menuService.loadCategorias(this.clienteId, true); // Llama a Firestore y actualiza el observable
    this.menuService.categoriasData$.subscribe({
      next: (cats) => {
        this.categorias = cats;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las categorías' });
        this.loading = false;
      }
    });
  }

  openNew() {
    this.categoriaSeleccionada = {};
    this.submitted = false;
    this.categoriaDialog = true;
  }

  editCategoria(categoria: any) {
    this.categoriaSeleccionada = { ...categoria };
    this.categoriaDialog = true;
  }

  showDeleteDialog(categoria: any) {
    this.categoriaSeleccionada = categoria;
    this.deleteDialogVisible = true;
  }

  async onAcceptDelete() {
    this.isLoading = true;
    await this.menuService.deleteCategoria(this.clienteId, this.categoriaSeleccionada.id)
      .then(async () => {
        // await this.cargarCategorias();
        await this.menuService.loadCategorias(this.clienteId, true); // Llama a Firestore y actualiza el observable
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Categoría eliminada', life: 3000 });
      },
        (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la categoría', life: 3000 });
        })
      .finally(() => {
        this.isLoading = false;
        this.deleteDialogVisible = false;
        this.categoriaSeleccionada = {};
      });
  }

  onCancelDelete() {
    this.deleteDialogVisible = false;
    this.categoriaSeleccionada = {};
  }

  hideDialog() {
    this.categoriaDialog = false;
    this.deleteDialogVisible = false;
    this.categoriaSeleccionada = {};
  }

  // Para iconos personalizados
  onIconSelect(icon: string) {
    this.categoriaSeleccionada.icono = icon;
  }

  // Para upload de imagen (opcional)
  onImageUpload(event: any) {
    // Sube la imagen y guarda la URL en categoriaSeleccionada.imagen
  }

  // Si quieres deshabilitar eliminar si tiene productos:
  tieneProductos(categoria: any): boolean {
    return this.productosPorCategoria[categoria.id] > 0;
  }


  openNewCategoria() {
    this.categoriaSeleccionada = {};
    this.categoriaDialog = true;
  }

  hideCategoriaDialog() {
    this.categoriaSeleccionada = {};
    this.categoriaDialog = false;
    this.isLoading = false

  }

  isCategoriaInvalida() {
    return !this.categoriaSeleccionada.nombre?.trim() || this.categoriaSeleccionada.esVisible == null;
  }


  async saveCategoria() {
    this.isLoading = true
    if (this.isCategoriaInvalida()) {
      this.messageService.add({
        severity: 'info',
        summary: 'Info:',
        detail: 'Categoría incompleta.',
        life: 3000
      })
      this.isLoading = false
      return
    }

    if (this.categoriaSeleccionada.id) {
      await this.menuService.updateCategoria(this.clienteId, this.categoriaSeleccionada.id, this.categoriaSeleccionada)
        .then(async () => {
          await this.menuService.loadCategorias(this.clienteId, true);
          this.messageService.add({
            severity: 'success',
            summary: 'Actualizado',
            detail: 'Categoría actualizada correctamente',
            life: 3000
          });
        }, (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la categoría',
            life: 3000
          });
        });
    } else {
      // Si no tiene id, es creación
      this.categoriaSeleccionada['icon'] = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.clienteId}%2Flogo0.webp?alt=media`
      this.categoriaSeleccionada['route'] = this.categoriaSeleccionada['nombre']?.toLowerCase().replaceAll(/ /g, '_');
      // Aquí deberías guardar la categoría en tu backend/Firestore
      await this.menuService.addCategoria(this.clienteId, this.categoriaSeleccionada)
        .then(
          async () => {
            await this.menuService.loadCategorias(this.clienteId, true);
            this.messageService.add({
              severity: 'success',
              summary: 'Actualizado',
              detail: 'Categoría creada correctamente',
              life: 3000
            });
            this.isLoading = false;
            this.categoriaSeleccionada = {};
            this.categoriaDialog = true;
          },
          (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo cambiar crear la categoría',
              life: 3000
            });
          }
        )
    }
    this.isLoading = false;
    this.categoriaSeleccionada = {};
    this.categoriaDialog = false;

  }

}