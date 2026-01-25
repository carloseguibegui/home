import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MenuService } from '../../services/menu.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";



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
import { updatePrimaryPalette } from '@primeng/themes';
import { BadgeModule } from 'primeng/badge';





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
        styleUrls: ['./admin.component.css'],
        animations: [
                trigger('fadeContent', [
                        transition(':enter', [
                                style({ opacity: 0 }),
                                animate('200ms ease-in', style({ opacity: 1 }))
                        ]),
                        transition(':leave', [
                                animate('200ms ease-out', style({ opacity: 0 }))
                        ])
                ])
        ],
        imports: [CommonModule, FormsModule, TableModule, Dialog, SelectModule, ToastModule, ToolbarModule, ConfirmDialog, InputTextModule, TextareaModule, CommonModule, FileUpload, DropdownModule, Tag, InputTextModule, FormsModule, InputNumber, IconFieldModule, InputIconModule, ButtonModule, BadgeModule, RouterModule],
        providers: [MessageService, ConfirmationService]
})
export class AdminComponent implements OnInit {
        productos: any[] = [];
        categorias: any[] = [];
        selectedProducts: any[] = [];
        clienteId: string = '';
        logoImage = '';
        loading = false;
        imagenPreview: string | ArrayBuffer | null = null;
        nuevaImagenFile: string | ArrayBuffer | null = null;
        isLoading: boolean = false;
        productoSeleccionado: any = {};
        productDialog: boolean = false;
        deleteDialogVisible = false;
        isDeleting = false;
        productoAEliminar: any = null;

        submitted: boolean = false;

        statuses!: any[];

        @ViewChild('dt') dt!: Table;

        cols!: Column[];

        exportColumns!: ExportColumn[];


        estados = [
                { estado: 'Activo', value: true },
                { estado: 'Oculto', value: false }
        ];



        constructor(
                private router: Router,
                private authService: AuthService,
                private menuService: MenuService,
                private messageService: MessageService,
                private confirmationService: ConfirmationService,
                private cd: ChangeDetectorRef
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
                this.loading = true; // Mostrar spinner al iniciar
                this.authService.getUsuarioActivo().then(async usuario => {
                        if (usuario && usuario.clienteId) {
                                this.clienteId = usuario.clienteId;
                                this.logoImage = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.clienteId}%2Flogo0.webp?alt=media`;

                                try {
                                        // Cargar productos (a través del menú completo)
                                        this.menuService.clearCache(this.clienteId);
                                        await this.menuService.loadMenuFirestore(this.clienteId);

                                        // Obtener los datos del observable
                                        const menu = await firstValueFrom(this.menuService.menuData$);

                                        this.productos = [];
                                        this.categorias = [];
                                        menu.forEach(cat => {
                                                this.categorias.push(cat);
                                                if (cat.productos) {
                                                        this.productos.push(...cat.productos.map((prod: any) => ({
                                                                ...prod,
                                                                categoria: cat
                                                        })));
                                                }
                                        });
                                        console.log('this.productos en ngOnInit()', this.productos)
                                        this.loading = false;

                                        // Suscribirse para cambios futuros
                                        this.menuService.menuData$.subscribe(menu => {
                                                this.productos = [];
                                                this.categorias = [];
                                                menu.forEach(cat => {
                                                        this.categorias.push(cat);
                                                        if (cat.productos) {
                                                                this.productos.push(...cat.productos.map((prod: any) => ({
                                                                        ...prod,
                                                                        categoria: cat
                                                                })));
                                                        }
                                                });
                                        });
                                } catch (error) {
                                        console.error('Error al cargar productos:', error);
                                        this.loading = false;
                                }
                        } else {
                                // Si no hay usuario o clienteId, podrías redirigir al login
                                this.router.navigate(['/login']);
                        }
                });

        }
        exportCSV() {
                this.dt.exportCSV();
        }





        onSelectImage(event: any) {
                // const file = event.files[0];
                // if (file) {
                //   // Validación de tipo (opcional, ya que accept="image/*" filtra)
                //   const tiposPermitidos = [
                //     'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'
                //   ];
                //   if (!tiposPermitidos.includes(file.type)) {
                //     this.messageService.add({
                //       severity: 'error',
                //       summary: 'Error',
                //       detail: 'Solo se permiten imágenes (.jpg, .jpeg, .png, .gif, .webp, .bmp, .svg)',
                //       life: 3000
                //     });
                //     return;
                //   }
                //   const reader = new FileReader();
                //   reader.onload = e => {
                //     this.imagenPreview = reader.result;
                //   };
                //   reader.readAsDataURL(file);
                //   this.productoSeleccionado.nuevaImagenFile = file;
                // }
                const file = event.files[0];
                const reader = new FileReader();
                reader.onload = (e) => this.imagenPreview = reader.result;
                reader.readAsDataURL(file);
                this.nuevaImagenFile = file;
                this.productoSeleccionado.nuevaImagenFile = file;
        }

        borrarImagenActual() {
                this.productoSeleccionado.imagen = null;
                // Si tienes una variable de preview de imagen nueva, también resetea aquí si es necesario
                this.nuevaImagenFile = null; // si usas una variable para el archivo seleccionado
        }




        // PRIMENG
        openNew() {
                this.productoSeleccionado = {};
                this.submitted = false;
                this.productDialog = true;
                this.nuevaImagenFile = null
        }

        isProductoInvalido(): boolean {
                const p = this.productoSeleccionado;
                return (
                        !p ||
                        !p.nombre?.trim() ||
                        !p.descripcion?.trim() ||
                        !p.precio ||
                        p.esVisible == null ||
                        !p.categoria?.categoriaId
                );
        }

        editProduct(producto: any) {
                this.productoSeleccionado = {
                        ...producto,
                        categoriaOriginalId: producto.categoria.categoriaId // Guarda el id original
                };
                // Guarda el hash del producto original para comparar después
                this.productoSeleccionado._hashOriginal = this.hashProducto(this.productoSeleccionado);
                this.productDialog = true;
        }

        // deleteSelectedProducts() {
        //   this.confirmationService.confirm({
        //     message: '¿Seguro que deseas eliminar los productos seleccionados?',
        //     header: 'Confirmar',
        //     icon: 'pi pi-exclamation-triangle',
        //     accept: async () => {
        //       try {
        //         for (const producto of this.selectedProducts || []) {
        //           await this.menuService.deleteProducto(
        //             this.clienteId,
        //             producto.categoriaId,
        //             producto.idProducto
        //           );
        //         }
        //         await this.menuService.loadMenuFirestore(this.clienteId);
        //         this.selectedProducts = [];
        //         this.messageService.add({
        //           severity: 'success',
        //           summary: 'Eliminados',
        //           detail: 'Productos eliminados',
        //           life: 3000
        //         });
        //       } catch (error) {
        //         this.messageService.add({
        //           severity: 'error',
        //           summary: 'Error',
        //           detail: 'No se pudieron eliminar los productos',
        //           life: 3000
        //         });
        //       }
        //     }
        //   });
        // }

        hideDialog() {
                this.productDialog = false;
                this.submitted = false;
                this.productoSeleccionado = {}
                this.imagenPreview = null
                this.isLoading = false
                this.nuevaImagenFile = null
        }


        async saveProduct() {
                this.submitted = true
                this.isLoading = true
                let producto_a_guardar = { ... this.productoSeleccionado }
                if (this.esProductoSinModificarOVacio(producto_a_guardar)) {
                        this.messageService.add({
                                severity: 'info',
                                summary: 'Info:',
                                detail: 'No hubo cambios en el producto o faltan datos.',
                                life: 3000
                        })
                        this.submitted = false;
                        this.isLoading = false
                        return
                }
                if (producto_a_guardar.idProducto) {
                        // Si tiene id, es edición
                        await this.guardarEdicionProducto(producto_a_guardar)
                } else {
                        // Si no tiene id, es creación
                        await this.crearProducto(producto_a_guardar)
                }
                this.hideDialog()
        }


        private setImagenPorDefecto(producto: any) {
                const urlBase = `https://firebasestorage.googleapis.com/v0/b/menu-digital-e8e62.firebasestorage.app/o/clientes%2F${this.clienteId}%2Ffondo-claro.webp?alt=media`;
                if (!producto.imagen) {
                        producto.imagen = urlBase;
                }
                if (!producto.small_imagen) {
                        producto.small_imagen = urlBase;
                }
        }

        async guardarEdicionProducto(producto: any) {
                const categoriaOriginalId = producto.categoriaOriginalId || producto.categoria.categoriaId;
                const categoriaNuevaId = producto.categoria.categoriaId;
                const idProducto = producto.idProducto
                await this.subirImagenesProducto(producto);
                this.setImagenPorDefecto(producto);
                this.limpiarPropsTemporales(producto);

                if (categoriaOriginalId !== categoriaNuevaId) {
                        // 1. Crear en la nueva categoría
                        await this.menuService.addProducto(this.clienteId, categoriaNuevaId, producto)
                                .then(
                                        () => {
                                                this.messageService.add({
                                                        severity: 'success',
                                                        summary: 'Actualizado',
                                                        detail: 'Producto cambiado de categoria',
                                                        life: 3000
                                                });
                                        },
                                        (error) => {
                                                this.messageService.add({
                                                        severity: 'error',
                                                        summary: 'Error',
                                                        detail: 'No se pudo cambiar de categoria el producto',
                                                        life: 3000
                                                });
                                        }
                                );
                        // 2. Borrar de la categoría original
                        await this.menuService.deleteProducto(this.clienteId, categoriaOriginalId, idProducto)
                                .then(
                                        () => {
                                                this.messageService.add({
                                                        severity: 'success',
                                                        summary: 'Actualizado',
                                                        detail: 'Producto borrado de categoria antigua',
                                                        life: 3000
                                                });
                                        },
                                        (error) => {
                                                this.messageService.add({
                                                        severity: 'error',
                                                        summary: 'Error',
                                                        detail: 'No se pudo borrar la categoria del producto',
                                                        life: 3000
                                                });
                                        }
                                );
                        await this.menuService.loadMenuFirestore(this.clienteId, true);
                } else {
                        // Solo actualizar si la categoría no cambió
                        await this.menuService.updateProducto(
                                this.clienteId,
                                categoriaOriginalId,
                                idProducto,
                                producto
                        )
                                .then(
                                        async () => {
                                                await this.menuService.loadMenuFirestore(this.clienteId, true);
                                                this.messageService.add({
                                                        severity: 'success',
                                                        summary: 'Actualizado',
                                                        detail: 'Producto actualizado correctamente',
                                                        life: 3000
                                                });
                                        },
                                        (error) => {
                                                this.messageService.add({
                                                        severity: 'error',
                                                        summary: 'Error',
                                                        detail: 'No se pudo guardar el producto',
                                                        life: 3000
                                                });
                                        }
                                );
                }
        }

        async crearProducto(producto: any) {
                // Elimina propiedades que no deben ir a Firestore
                await this.subirImagenesProducto(producto);
                this.setImagenPorDefecto(producto)
                let categoriaId = producto.categoria.categoriaId
                this.limpiarPropsTemporales(producto);

                // Guardar el producto en la categoría seleccionada
                await this.menuService.addProducto(this.clienteId, categoriaId, producto)
                        .then(
                                async () => {
                                        await this.menuService.loadMenuFirestore(this.clienteId, true);
                                        this.messageService.add({
                                                severity: 'success',
                                                summary: 'Creado',
                                                detail: 'Producto creado correctamente',
                                                life: 3000
                                        });
                                },
                                (error) => {
                                        this.messageService.add({
                                                severity: 'error',
                                                summary: 'Error',
                                                detail: 'No se pudo crear el producto',
                                                life: 3000
                                        });
                                }
                        );

        }


        private async subirImagenesProducto(producto: any): Promise<void> {
                if (!producto.nuevaImagenFile) return
                if (producto.idProducto && !producto.imagen) return
                let nombre_imagen = producto.nombre.toString().replaceAll(' ', '_').toLowerCase();
                const storage = getStorage();

                // Imagen grande
                const webpBlob = await this.convertirAWebp(producto.nuevaImagenFile);
                const storageRef = ref(storage, `clientes/${this.clienteId}/${nombre_imagen}.webp`);
                await uploadBytes(storageRef, webpBlob);
                producto.imagen = await getDownloadURL(storageRef);

                // Miniatura
                const smallWebpBlob = await this.convertirAWebpConTamano(producto.nuevaImagenFile, 20, 20);
                const smallStorageRef = ref(storage, `clientes/${this.clienteId}/${nombre_imagen}-small.webp`);
                await uploadBytes(smallStorageRef, smallWebpBlob);
                producto.small_imagen = await getDownloadURL(smallStorageRef);

                // Limpia la propiedad temporal
                delete producto.nuevaImagenFile;
        }

        private limpiarPropsTemporales(producto: any): void {
                delete producto.idProducto;
                delete producto.categoria;
                delete producto.categoriaOriginalId;
                delete producto._hashOriginal;
                delete producto.nuevaImagenFile;
        }


        private esProductoSinModificarOVacio(producto_a_guardar: any) {
                const hashOriginal = this.productoSeleccionado._hashOriginal;
                const hashActual = this.hashProducto(producto_a_guardar);
                console.log('son iguales?', hashOriginal === hashActual)
                return (
                        !producto_a_guardar.nombre?.trim() ||
                        !producto_a_guardar.descripcion?.trim() ||
                        !producto_a_guardar.precio ||
                        producto_a_guardar.esVisible == null ||
                        (hashOriginal === hashActual)
                );
        }

        private hashProducto(producto: any): string {
                // Solo toma las propiedades relevantes
                const obj = {
                        nombre: producto.nombre,
                        descripcion: producto.descripcion,
                        precio: producto.precio,
                        esVisible: producto.esVisible,
                        categoriaId: producto.categoria?.categoriaId,
                        categoriaOriginalId: producto.categoriaOriginalId,
                        tieneNuevaImagen: !!producto.nuevaImagenFile,
                        imagen: producto?.imagen
                };
                return JSON.stringify(obj);
        }



        // IMG CONVERT
        // Convierte una imagen a webp (mantiene tamaño original)
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
                                        1// calidad
                                );
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                });
        }

        // Convierte una imagen a webp con tamaño específico (para thumbnail)
        async convertirAWebpConTamano(file: File, width: number, height: number): Promise<Blob> {
                return new Promise((resolve, reject) => {
                        const img = new Image();
                        const reader = new FileReader();
                        reader.onload = (e: any) => {
                                img.src = e.target.result;
                        };
                        img.onload = () => {
                                const canvas = document.createElement('canvas');
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                ctx?.drawImage(img, 0, 0, width, height);
                                canvas.toBlob(
                                        (blob) => {
                                                if (blob) resolve(blob);
                                                else reject('No se pudo convertir a webp');
                                        },
                                        'image/webp',
                                        0.7 // calidad para thumbnail
                                );
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                });
        }





        // BORRAR PRODUCTO
        showDeleteDialog(producto: any) {
                this.productoAEliminar = producto;
                this.deleteDialogVisible = true;
        }

        onCancelDelete() {
                this.deleteDialogVisible = false;
                this.isDeleting = false;
                this.productoAEliminar = null;
        }

        async onAcceptDelete() {
                this.isDeleting = true;
                await this.menuService.deleteProducto(
                        this.clienteId,
                        this.productoAEliminar.categoria.categoriaId,
                        this.productoAEliminar.idProducto)
                        .then(
                                async () => {
                                        // Recarga productos desde Firestore
                                        await this.menuService.loadMenuFirestore(this.clienteId, true);
                                        this.messageService.add({
                                                severity: 'success',
                                                summary: 'Eliminado',
                                                detail: 'Producto eliminado',
                                                life: 3000
                                        });
                                },
                                (error) => {
                                        this.messageService.add({
                                                severity: 'error',
                                                summary: 'Error',
                                                detail: 'No se pudo eliminar el producto',
                                                life: 3000
                                        });
                                }
                        )
                        .finally(() => {
                                this.deleteDialogVisible = false;
                                this.isDeleting = false;
                                this.productoAEliminar = null;
                        })
        }

}
