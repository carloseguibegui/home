import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Firestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from '@angular/fire/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

@Injectable({ providedIn: 'root' })
export class MenuService {
        private menuData = new BehaviorSubject<any[]>([]);
        menuData$ = this.menuData.asObservable();

        private categoriasData = new BehaviorSubject<any[]>([]);
        categoriasData$ = this.categoriasData.asObservable();

        private giftCardsData = new BehaviorSubject<any[]>([]);
        giftCardsData$ = this.giftCardsData.asObservable();

        // ✅ CACHÉ en memoria con timestamps
        private menuCache: { [cliente: string]: { data: any[], timestamp: number } } = {};
        private categoriasCache: { [cliente: string]: { data: any[], timestamp: number } } = {};
        private giftCardsCache: { [cliente: string]: { data: any[], timestamp: number } } = {};

        // ✅ Promesas para evitar cargas simultáneas
        private loadingPromises: { [key: string]: Promise<any> } = {};

        // ✅ TTL (Time To Live) en milisegundos
        private CACHE_TTL = 5 * 60 * 1000; // 5 minutos

        constructor(private firestore: Firestore) { }

        /**
         * Verifica si el caché está vigente
         */
        private isCacheValid(timestamp: number): boolean {
                return Date.now() - timestamp < this.CACHE_TTL;
        }

        /**
         * Carga menú desde Firestore o caché
         */
        async loadMenuFirestore(cliente: string, force = false): Promise<any[]> {
                // ✅ Evita cargas simultáneas del mismo cliente
                const key = `menu_${cliente}`;
                if (await this.loadingPromises[key]) {
                        return this.loadingPromises[key];
                }

                // ✅ Usa caché si es válido
                if (!force && this.menuCache[cliente] && this.isCacheValid(this.menuCache[cliente].timestamp)) {
                        const data = this.menuCache[cliente].data;
                        this.menuData.next(data);
                        return data;
                }

                // ✅ Crea promesa para evitar duplicados
                this.loadingPromises[key] = (async () => {
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

                                        productos = productos.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
                                        seccionData['productos'] = productos;
                                        seccionData['categoriaId'] = seccionDoc.id;
                                        return seccionData;
                                });

                                let menuData = await Promise.all(menuPromises);
                                menuData = menuData.filter(cat => cat['esVisible'] !== false);
                                menuData = menuData.sort((a, b) => (a['displayOrder'] ?? 9999) - (b['displayOrder'] ?? 9999));

                                // ✅ Almacena en caché con timestamp
                                this.menuCache[cliente] = { data: menuData, timestamp: Date.now() };
                                this.menuData.next(menuData);

                                return menuData;
                        } finally {
                                delete this.loadingPromises[key];
                        }
                })();

                return this.loadingPromises[key];
        }

        /**
         * Carga categorías desde Firestore o caché
         */
        async loadCategorias(cliente: string, force = false, soloVisibles = false): Promise<any[]> {
                const key = `categorias_${cliente}`;
                if (await this.loadingPromises[key]) {
                        return this.loadingPromises[key];
                }

                // ✅ Usa caché si es válido
                if (!force && this.categoriasCache[cliente] && this.isCacheValid(this.categoriasCache[cliente].timestamp)) {
                        const data = this.categoriasCache[cliente].data;
                        this.categoriasData.next(data);
                        return data;
                }

                this.loadingPromises[key] = (async () => {
                        try {
                                const categorias: any[] = [];
                                const categoriaRef = collection(this.firestore, `clientes/${cliente}/categoria`);
                                const categoriaSnap = await getDocs(categoriaRef);

                                for (const categoriaDoc of categoriaSnap.docs) {
                                        categorias.push({ id: categoriaDoc.id, ...categoriaDoc.data() });
                                }

                                let categoriasFiltradas = categorias;
                                if (soloVisibles) {
                                        categoriasFiltradas = categorias.filter(cat => cat['esVisible'] !== false);
                                }
                                categoriasFiltradas = categoriasFiltradas.sort((a, b) => (a['displayOrder'] ?? 9999) - (b['displayOrder'] ?? 9999));

                                // ✅ Almacena en caché con timestamp
                                this.categoriasCache[cliente] = { data: categoriasFiltradas, timestamp: Date.now() };
                                this.categoriasData.next(categoriasFiltradas);

                                return categoriasFiltradas;
                        } finally {
                                delete this.loadingPromises[key];
                        }
                })();

                return this.loadingPromises[key];
        }

        clearCache(cliente?: string) {
                if (cliente) {
                        delete this.menuCache[cliente];
                        delete this.categoriasCache[cliente];
                } else {
                        this.menuCache = {};
                        this.categoriasCache = {};
                        this.giftCardsCache = {};
                }
        }

        // --- CRUD CATEGORÍAS ---
        async addCategoria(cliente: string, categoria: any) {
                const categoriaRef = collection(this.firestore, `clientes/${cliente}/categoria`);
                const docRef = await addDoc(categoriaRef, categoria);
                await this.loadCategorias(cliente, true);
                return docRef.id;
        }

        async updateCategoria(cliente: string, categoriaId: string, categoria: any) {
                const categoriaDoc = doc(this.firestore, `clientes/${cliente}/categoria/${categoriaId}`);
                await updateDoc(categoriaDoc, categoria);
                await this.loadCategorias(cliente, true);
        }

        async deleteCategoria(cliente: string, categoriaId: string) {
                const categoriaDoc = doc(this.firestore, `clientes/${cliente}/categoria/${categoriaId}`);
                await deleteDoc(categoriaDoc);
                await this.loadCategorias(cliente, true);
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

        async loadGiftcards(cliente: string, force = false): Promise<any[]> {
                const key = `giftcards_${cliente}`;
                if (await this.loadingPromises[key]) {
                        return this.loadingPromises[key];
                }

                if (!force && this.giftCardsCache[cliente] && this.isCacheValid(this.giftCardsCache[cliente].timestamp)) {
                        const data = this.giftCardsCache[cliente].data;
                        this.giftCardsData.next(data);
                        return data;
                }

                this.loadingPromises[key] = (async () => {
                        try {
                                const giftcards: any[] = [];
                                const giftcardsRef = collection(this.firestore, `clientes/${cliente}/giftcards`);
                                const giftCardSnap = await getDocs(giftcardsRef);

                                for (const giftcardDoc of giftCardSnap.docs) {
                                        giftcards.push({ id: giftcardDoc.id, ...giftcardDoc.data() });
                                }

                                this.giftCardsCache[cliente] = { data: giftcards, timestamp: Date.now() };
                                this.giftCardsData.next(giftcards);

                                return giftcards;
                        } finally {
                                delete this.loadingPromises[key];
                        }
                })();

                return this.loadingPromises[key];
        }

        async updateGiftcard(cliente: string, giftcardId: string, giftcard: any) {
                const giftcardDoc = doc(this.firestore, `clientes/${cliente}/giftcards/${giftcardId}`);
                await updateDoc(giftcardDoc, giftcard);
        }

        async deleteGiftcard(cliente: string, giftcardId: string) {
                const giftcardDoc = doc(this.firestore, `clientes/${cliente}/giftcards/${giftcardId}`);
                await deleteDoc(giftcardDoc);
        }
}