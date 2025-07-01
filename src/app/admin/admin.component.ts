import { Component, OnInit, AfterViewInit, OnDestroy, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MenuService } from '../services/menu.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import $ from 'jquery';
import 'datatables.net-bs5';
import DataTable from 'datatables.net-bs5';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { FormsModule } from '@angular/forms';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ButtonComponent } from '../shared/button/button.component';



// PRIMENG
import { ChangeDetectorRef, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
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

interface Column {
  field: string;
  header: string;
  customExportHeader?: string;
}

interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css', './sb-admin-2.min.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('1000ms ease-out', style({ opacity: 0 }))
      ])
    ]),
    trigger('fadeContent', [
      transition(':enter', [
        // style({ opacity: 0, transform: 'translateY(30px)' }),
        style({ opacity: 0 }),
        // animate('600ms 100ms cubic-bezier(0.23, 1, 0.32, 1)', style({ opacity: 1, transform: 'none' }))
        animate('1000ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('0ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ],
  imports: [CommonModule, SpinnerComponent, FormsModule, TableModule, Dialog, Ripple, SelectModule, ToastModule, ToolbarModule, ConfirmDialog, InputTextModule, TextareaModule, CommonModule, FileUpload, DropdownModule, Tag, RadioButton, Rating, InputTextModule, FormsModule, InputNumber, IconFieldModule, InputIconModule,ButtonModule],
  providers: [MessageService, ConfirmationService]
})
export class AdminComponent implements OnInit, OnDestroy {
  productos: any[] = [];
  categorias: any[] = [];
  selectedProducts: any[] = [];
  clienteId: string = '';
  dataTable: any;
  logoImage = '';
  loading = false;
  private dataTableInitialized = false
  imagenPreview: string | ArrayBuffer | null = null;
  isLoading: boolean = false;
  productoSeleccionado: any = {};
  productDialog: boolean = false;




  submitted: boolean = false;

  statuses!: any[];

  @ViewChild('dt') dt!: Table;

  cols!: Column[];

  exportColumns!: ExportColumn[];


  constructor(
    private router: Router,
    private authService: AuthService,
    private menuService: MenuService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    console.log('this.ngOnInit')
    if (this.dataTable) {
      this.dataTable.destroy();
      this.dataTable = null;
      this.dataTableInitialized = false;
    }
    this.loading = true; // Mostrar spinner al iniciar
    this.authService.getUsuarioActivo().then(usuario => {
      if (usuario && usuario.clienteId) {
        this.clienteId = usuario.clienteId;
        this.logoImage = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.clienteId}%2Flogo0.webp?alt=media`;
        // Cargar productos (a través del menú completo)
        this.menuService.loadMenuFirestore(this.clienteId);
        this.menuService.menuData$.subscribe(menu => {
          console.log('this.menuService.menuData$.subscribe')
          // Destruye la instancia previa ANTES de actualizar los datos
          if (this.dataTable) {
            this.dataTable.destroy();
            this.dataTable = null;
            this.dataTableInitialized = false;
          }
          this.productos = [];
          this.categorias = [];
          menu.forEach(cat => {
            this.categorias.push(cat); // Guarda id y nombre
            if (cat.productos) {
              this.productos.push(...cat.productos.map((prod: any) => ({
                ...prod,
                categoria: cat
              })));
            }
            this.loading = false;
          });
        });
      } else {
        // Si no hay usuario o clienteId, podrías redirigir al login
        this.router.navigate(['/login']);
      }
    });

  }
  exportCSV() {
    this.dt.exportCSV();
  }

  initDataTable() {
    // this.dataTable = ($('#dataTable') as any).DataTable({ scrollY: 400 });
    this.dataTable = new DataTable('#dataTable', {
      scrollY: "400px",
      language: {
        "thousands": ".",
        url: 'https://cdn.datatables.net/plug-ins/2.0.2/i18n/es-ES.json'
      },
      processing: true
    })

  }



  ngOnDestroy() {
    if (this.dataTable) {
      this.dataTable.destroy();
    }
  }

  logout() {
    this.authService.logout();
  }

  abrirModalEditar(producto: any) {
    this.productoSeleccionado = { ...producto }; // Copia para editar sin afectar el array original
    console.log('this.productoSeleccionado', this.productoSeleccionado)
  }


  async guardarEdicionProducto(nombre: string, descripcion: string, precio: string, estado: string) {
    this.isLoading = true
    let categoriaId = this.productoSeleccionado.categoria.categoriaId
    let producto_a_guardar = { ... this.productoSeleccionado }
    const esActivo = (estado === 'true');
    delete producto_a_guardar.categoria;
    producto_a_guardar.nombre = nombre;
    producto_a_guardar.descripcion = descripcion;
    producto_a_guardar.precio = precio;
    producto_a_guardar.esActivo = esActivo;

    // Si hay una nueva imagen
    if (this.productoSeleccionado.nuevaImagenFile) {
      // 1. Convertir a webp
      const webpBlob = await this.convertirAWebp(this.productoSeleccionado.nuevaImagenFile);
      this.productoSeleccionado.nombre = this.productoSeleccionado.nombre.toString().replaceAll(' ', '_').toLowerCase()
      // 2. Subir a Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, `clientes/${this.clienteId}/${this.productoSeleccionado.nombre}.webp`);
      await uploadBytes(storageRef, webpBlob);

      // 3. Obtener la URL
      const url = await getDownloadURL(storageRef);
      this.productoSeleccionado.imagen = url;
    }

    try {
      // ...tu lógica de guardado...
      await this.menuService.updateProducto(
        this.clienteId,
        categoriaId,
        producto_a_guardar.idProducto,
        producto_a_guardar
      )
      this.loading = false
      this.mostrarToast('Producto actualizado correctamente.', 'success');
      // Cierra el modal de Bootstrap 5
      const modalEl = document.getElementById('editEmployeeModal');
      if (modalEl) {
        await this.menuService.loadMenuFirestore(this.clienteId);
        // @ts-ignore
        const modalInstance = window.bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) {
          modalInstance.hide();
          // Espera un poco y elimina el backdrop si quedó
          setTimeout(() => {
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(bd => bd.parentNode?.removeChild(bd));
          }, 100);
        }
      }
    } catch (error: any) {
      this.mostrarToast('Error al guardar: ' + (error?.message || error), 'danger');
    }
  }


  onImagenSeleccionada(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Lista de tipos MIME permitidos
      const tiposPermitidos = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'
      ];
      if (!tiposPermitidos.includes(file.type)) {
        alert('Solo se permiten imágenes (.jpg, .jpeg, .png, .gif, .webp, .bmp, .svg)');
        event.target.value = ''; // Limpia el input
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        this.imagenPreview = reader.result;
      };
      reader.readAsDataURL(file);
      this.productoSeleccionado.nuevaImagenFile = file;
    }
  }

  async convertirAWebp(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e: any) => {
        img.src = e.target.result;
      };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject('No se pudo convertir a webp');
          },
          'image/webp',
          0.8 // calidad
        );
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  mostrarToast(mensaje: string, tipo: 'success' | 'danger' = 'success') {
    const toastEl = document.getElementById('adminToast');
    const toastBody = document.getElementById('adminToastBody');
    if (toastEl && toastBody) {
      toastBody.textContent = mensaje;
      toastEl.className = `toast align-items-center text-white bg-${tipo} border-0`;
      // @ts-ignore
      // const toast = new window.bootstrap.Toast(toastEl, { delay: 3000 });
      const toast = new bootstrap.Toast(toastEl);
      toast.show();
    }
  }



  // PRIMENG
  openNew() {
    this.productoSeleccionado = {};
    this.submitted = false;
    this.productDialog = true;
  }

  editProduct(product: any) {
    this.productoSeleccionado = { ...product };
    this.productDialog = true;
  }

  deleteSelectedProducts() {
    this.confirmationService.confirm({
      message: '¿Seguro que deseas eliminar los productos seleccionados?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          for (const producto of this.selectedProducts || []) {
            await this.menuService.deleteProducto(
              this.clienteId,
              producto.categoriaId,
              producto.idProducto
            );
          }
          await this.menuService.loadMenuFirestore(this.clienteId);
          this.selectedProducts = [];
          this.messageService.add({
            severity: 'success',
            summary: 'Eliminados',
            detail: 'Productos eliminados',
            life: 3000
          });
        } catch (error) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron eliminar los productos',
            life: 3000
          });
        }
      }
    });
  }

  hideDialog() {
    this.productDialog = false;
    this.submitted = false;
  }

  deleteProduct(producto: any) {
    this.confirmationService.confirm({
      message: '¿Seguro que deseas eliminar este producto?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await this.menuService.deleteProducto(
            this.clienteId,
            producto.categoriaId,
            producto.idProducto
          );
          // Recarga productos desde Firestore
          await this.menuService.loadMenuFirestore(this.clienteId);
          this.messageService.add({
            severity: 'success',
            summary: 'Eliminado',
            detail: 'Producto eliminado',
            life: 3000
          });
        } catch (error) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar el producto',
            life: 3000
          });
        }
      }
    });
  }

  findIndexById(idProducto: string): number {
    return this.productos.findIndex(p => p.idProducto === idProducto);
  }

  getSeverity(status: string) {
    switch (status) {
      case 'ACTIVO':
        return 'success';
      case 'INACTIVO':
        return 'danger';
      default:
        return 'success'
    }
  }

  async saveProduct() {
    this.submitted = true;

    // Validación simple
    if (!this.productoSeleccionado.nombre?.trim()) return;

    if (this.productoSeleccionado.idProducto) {
      // Editar producto existente
      await this.guardarEdicionProducto(
        this.productoSeleccionado.nombre,
        this.productoSeleccionado.descripcion,
        this.productoSeleccionado.precio,
        this.productoSeleccionado.esActivo ? 'true' : 'false'
      );
      this.messageService.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: 'Producto actualizado correctamente',
        life: 3000
      });
    } else {
      // Crear nuevo producto (debes implementar el método para crear)
      // await this.menuService.addProducto(...);
      this.messageService.add({
        severity: 'success',
        summary: 'Creado',
        detail: 'Producto creado correctamente',
        life: 3000
      });
    }

    this.productDialog = false;
    this.productoSeleccionado = {};
  }

  onGlobalFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.dt?.filterGlobal(value, 'contains');
  }
}
