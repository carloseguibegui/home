// menu.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Firestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from '@angular/fire/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

@Injectable({ providedIn: 'root' })
export class MenuService {

  private loadingMenu = false;
  private menuData = new BehaviorSubject<any[]>([]);
  menuData$ = this.menuData.asObservable();
  private categoriasData = new BehaviorSubject<any[]>([]);
  categoriasData$ = this.categoriasData.asObservable();
  private giftCardsData = new BehaviorSubject<any[]>([]);
  giftCardsData$ = this.giftCardsData.asObservable();
  // --- CACHE ---
  private menuCache: { [cliente: string]: any[] } = {};
  private categoriasCache: { [cliente: string]: any[] } = {};
  private giftCardsCache: { [cliente: string]: any[] } = {};

  constructor(private firestore: Firestore) { }

  async loadMenuFirestore(cliente: string, force = false) {
    // Si ya está en caché, úsalo y no consultes Firestore
    if (!force && this.menuCache[cliente]) {
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
        let productos = productosSnap.docs.map(prod => ({
          idProducto: prod.id,
          ...(prod.data() as { nombre?: string })
        }));
        // Ordena los productos alfabéticamente por nombre
        productos = productos.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        seccionData['productos'] = productos;
        seccionData['categoriaId'] = seccionDoc.id;
        return seccionData;
      });

      let menuData = await Promise.all(menuPromises);
      // Filtra las categorías que no son visibles
      menuData = menuData.filter(cat => cat['esVisible'] !== false);
      // Ordena las categorías por displayOrder
      menuData = menuData.sort((a, b) => (a['displayOrder'] ?? 9999) - (b['displayOrder'] ?? 9999));
      this.menuCache[cliente] = menuData; // Guarda en caché
      this.menuData.next(menuData);
    } finally {
      this.loadingMenu = false;
    }
  }

  async loadCategorias(cliente: string, force = false, soloVisibles = false) {
    // Si ya está en caché, úsalo y no consultes Firestore
    if (!force && this.categoriasCache[cliente]) {
      console.log('Usando caché para categorías de cliente:', cliente);
      this.menuData.next(this.categoriasCache[cliente]);
      return;
    }
    const categorias: any[] = [];
    const categoriaRef = collection(this.firestore, `clientes/${cliente}/categoria`);
    const categoriaSnap = await getDocs(categoriaRef);

    for (const categoriaDoc of categoriaSnap.docs) {
      categorias.push({ id: categoriaDoc.id, ...categoriaDoc.data() });
    }
    let categoriasFiltradas = categorias;
    // Filtra las categorías que no son visibles
    if (soloVisibles) {
      categoriasFiltradas = categorias.filter(cat => cat['esVisible'] !== false);
      categoriasFiltradas = categoriasFiltradas.sort((a, b) => (a['displayOrder'] ?? 9999) - (b['displayOrder'] ?? 9999));
    }
    // Ordena las categorías por displayOrder

    this.categoriasCache[cliente] = categoriasFiltradas; // Guarda en caché
    localStorage.setItem('categoriasCache', JSON.stringify(this.categoriasCache));
    this.categoriasData.next(categoriasFiltradas);
  }

  clearCache(cliente?: string) {
    if (cliente) {
      delete this.menuCache[cliente];
      delete this.categoriasCache[cliente];
      localStorage.removeItem('categoriasCache');
      localStorage.removeItem('menuCache');
    } else {
      this.menuCache = {};
      this.categoriasCache = {};
    }
  }

  // --- CRUD CATEGORÍAS ---
  async addCategoria(cliente: string, categoria: any) {
    const categoriaRef = collection(this.firestore, `clientes/${cliente}/categoria`);
    const docRef = await addDoc(categoriaRef, categoria);
    await this.loadCategorias(cliente); // Refresca la lista
    return docRef.id;
  }

  async updateCategoria(cliente: string, categoriaId: string, categoria: any) {
    const categoriaDoc = doc(this.firestore, `clientes/${cliente}/categoria/${categoriaId}`);
    await updateDoc(categoriaDoc, categoria);
    await this.loadCategorias(cliente); // Refresca la lista
  }

  async deleteCategoria(cliente: string, categoriaId: string) {
    const categoriaDoc = doc(this.firestore, `clientes/${cliente}/categoria/${categoriaId}`);
    await deleteDoc(categoriaDoc);
    await this.loadCategorias(cliente); // Refresca la lista
  }

  // --- CRUD PRODUCTOS ---
  async addProducto(cliente: string, categoriaId: string, producto: any) {
    const productosRef = collection(this.firestore, `clientes/${cliente}/categoria/${categoriaId}/productos`);
    const docRef = await addDoc(productosRef, producto);
    return docRef.id;
  }

  async updateProducto(cliente: string, categoriaId: string, productoId: string, producto: any) {
    const productoDoc = doc(this.firestore, `clientes/${cliente}/categoria/${categoriaId}/productos/${productoId}`);
    await updateDoc(productoDoc, producto);
  }

  async deleteProducto(cliente: string, categoriaId: string, productoId: string) {
    const productoDoc = doc(this.firestore, `clientes/${cliente}/categoria/${categoriaId}/productos/${productoId}`);
    await deleteDoc(productoDoc);
  }


  // --- CRUD GIFTCARDS ---

  // Crear giftcard
  async addGiftcard(cliente: string, giftcard: any) {
    const giftcardsRef = collection(this.firestore, `clientes/${cliente}/giftcards`);
    const docRef = await addDoc(giftcardsRef, giftcard);
    return docRef.id;
  }

  async uploadGiftcardImage(clienteId: string, storagePath: string, blob: Blob): Promise<void> {
    const storage = getStorage();
    const fileRef = ref(storage, `clientes/${clienteId}/${storagePath}`);
    await uploadBytes(fileRef, blob);
  }

  async getGiftcardImageUrl(clienteId: string, storagePath: string): Promise<string> {
    const storage = getStorage();
    const fileRef = ref(storage, `clientes/${clienteId}/${storagePath}`);
    return await getDownloadURL(fileRef);
  }


  // Listar todas las giftcards de un cliente
  async loadGiftcards(cliente: string, force = false) {
  // Si ya está en caché, úsalo y no consultes Firestore
  if (!force && this.giftCardsCache[cliente]) {
    console.log('Usando caché para giftcards de cliente:', cliente);
    this.giftCardsData.next(this.giftCardsCache[cliente]);
    return
  }
  const giftcards: any[] = [];
  const giftcardsRef = collection(this.firestore, `clientes/${cliente}/giftcards`);
  const giftCardSnap = await getDocs(giftcardsRef);
  // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  for (const giftcardDoc of giftCardSnap.docs) {
    giftcards.push({ id: giftcardDoc.id, ...giftcardDoc.data() });
  }
  this.giftCardsCache[cliente] = giftcards; // Guarda en caché
  localStorage.setItem('giftCardsCache', JSON.stringify(this.giftCardsCache));
  this.giftCardsData.next(giftcards);
}

  // Actualizar giftcard por id
  async updateGiftcard(cliente: string, giftcardId: string, giftcard: any) {
  const giftcardDoc = doc(this.firestore, `clientes/${cliente}/giftcards/${giftcardId}`);
  await updateDoc(giftcardDoc, giftcard);
}

  // Eliminar giftcard por id
  async deleteGiftcard(cliente: string, giftcardId: string) {
  const giftcardDoc = doc(this.firestore, `clientes/${cliente}/giftcards/${giftcardId}`);
  await deleteDoc(giftcardDoc);
}
}
