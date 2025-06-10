// menu.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private loadingMenu = false;
  private menuData = new BehaviorSubject<any[]>([]);
  menuData$ = this.menuData.asObservable();
  private categoriasData = new BehaviorSubject<any[]>([]);
  categoriasData$ = this.categoriasData.asObservable();

  // --- CACHE ---
  private menuCache: { [cliente: string]: any[] } = {};
  private categoriasCache: { [cliente: string]: any[] } = {};

  constructor(private firestore: Firestore) { }

  async loadMenuFirestore(cliente: string) {
    // Si ya está en caché, úsalo y no consultes Firestore
    if (this.menuCache[cliente]) {
      this.menuData.next(this.menuCache[cliente]);
      return;
    }
    if (this.loadingMenu) return;
    this.loadingMenu = true;
    try {
      const menu: any[] = [];
      const categoriaRef = collection(this.firestore, `clientes/${cliente}/categoria`);
      const categoriaSnap = await getDocs(categoriaRef);

      const menuPromises = categoriaSnap.docs.map(async (seccionDoc) => {
        const seccionData = seccionDoc.data();
        const productosRef = collection(this.firestore, `clientes/${cliente}/categoria/${seccionDoc.id}/productos`);
        const productosSnap = await getDocs(productosRef);
        let productos = productosSnap.docs.map(prod => prod.data());
        // Ordena los productos alfabéticamente por nombre
        productos = productos.sort((a, b) => (a['nombre'] || '').localeCompare(b['nombre'] || ''));
        seccionData['productos'] = productos;
        return seccionData;
      });

      let menuData = await Promise.all(menuPromises);
      // Filtra las categorías que no son visibles
      menuData = menuData.filter(cat => cat['esVisible'] !== false);
      // Ordena las categorías por displayOrder
      menuData = menuData.sort((a, b) => (a['displayOrder'] ?? 9999) - (b['displayOrder'] ?? 9999));
      console.log('Menu data:', menuData);
      this.menuCache[cliente] = menuData; // Guarda en caché
      this.menuData.next(menuData);
    } finally {
      this.loadingMenu = false;
    }
  }

  async loadCategorias(cliente: string) {
    // Si ya está en caché, úsalo y no consultes Firestore
    if (this.categoriasCache[cliente]) {
      this.categoriasData.next(this.categoriasCache[cliente]);
      return;
    }
    const categorias: any[] = [];
    const categoriaRef = collection(this.firestore, `clientes/${cliente}/categoria`);
    const categoriaSnap = await getDocs(categoriaRef);

    for (const categoriaDoc of categoriaSnap.docs) {
      categorias.push({ id: categoriaDoc.id, ...categoriaDoc.data() });
    }

    // Filtra las categorías que no son visibles
    const categoriasVisibles = categorias.filter(cat => cat['esVisible'] !== false);
    // Ordena las categorías por displayOrder
    const categoriasOrdenadas = categoriasVisibles.sort((a, b) => (a['displayOrder'] ?? 9999) - (b['displayOrder'] ?? 9999));

    this.categoriasCache[cliente] = categoriasOrdenadas; // Guarda en caché
    localStorage.setItem('categoriasCache', JSON.stringify(this.categoriasCache));
    this.categoriasData.next(categoriasOrdenadas);
  }

  clearCache(cliente?: string) {
    if (cliente) {
      delete this.menuCache[cliente];
      delete this.categoriasCache[cliente];
    } else {
      this.menuCache = {};
      this.categoriasCache = {};
    }
  }
}
