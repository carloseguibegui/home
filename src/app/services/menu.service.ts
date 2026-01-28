import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Firestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, Query } from '@angular/fire/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { runInInjectionContext } from '@angular/core';

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

        // ✅ Prefijo para almacenamiento persistente
        private STORAGE_PREFIX = 'menu_cache_';

        private readFromStorage<T>(key: string): { data: T; timestamp: number } | null {
                try {
                        const raw = localStorage.getItem(this.STORAGE_PREFIX + key);
                        if (!raw) return null;
                        const parsed = JSON.parse(raw);
                        if (!parsed || typeof parsed.timestamp !== 'number') return null;
                        return parsed;
                } catch {
                        return null;
                }
        }

        private writeToStorage<T>(key: string, value: { data: T; timestamp: number }): void {
                try {
                        localStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(value));
                } catch {
                        // storage lleno o deshabilitado: ignorar
                }
        }

        constructor(private firestore: Firestore, private injector: Injector) { }

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
                const key = `menu_${cliente}`;
                if (await this.loadingPromises[key]) {
                        return this.loadingPromises[key];
                }

                // ✅ Mem cache
                if (!force && this.menuCache[cliente] && this.isCacheValid(this.menuCache[cliente].timestamp)) {
                        const data = this.menuCache[cliente].data;
                        this.menuData.next(data);
                        return data;
                }

                // ✅ localStorage cache
                if (!force) {
                        const stored = this.readFromStorage<any[]>(key);
                        if (stored && this.isCacheValid(stored.timestamp)) {
                                this.menuCache[cliente] = { data: stored.data, timestamp: stored.timestamp };
                                this.menuData.next(stored.data);
                                return stored.data;
                        }
                }

                // ✅ Evitar duplicados
                this.loadingPromises[key] = (async () => {
                        try {
                                return await runInInjectionContext(this.injector, async () => {
                                        const categoriaRef = collection(this.firestore, `clientes/${cliente}/categoria`);
                                        const categoriasQuery = query(categoriaRef, orderBy('displayOrder', 'asc'));
                                        const categoriaSnap = await getDocs(categoriasQuery);

                                        const menuPromises = categoriaSnap.docs.map(async (seccionDoc) => {
                                                const seccionData = seccionDoc.data();
                                                const productosRef = collection(this.firestore, `clientes/${cliente}/categoria/${seccionDoc.id}/productos`);
                                                const productosQuery = query(productosRef, orderBy('nombre', 'asc'));
                                                const productosSnap = await getDocs(productosQuery);

                                                const productos = productosSnap.docs.map(prod => ({
                                                        idProducto: prod.id,
                                                        ...(prod.data() as { nombre?: string })
                                                }));

                                                seccionData['productos'] = productos;
                                                seccionData['categoriaId'] = seccionDoc.id;
                                                return seccionData;
                                        });

                                        let menuData = await Promise.all(menuPromises);
                                        menuData = menuData.filter(cat => cat['esVisible'] !== false);

                                        // ✅ Cache memoria + storage (MENÚ)
                                        const entry = { data: menuData, timestamp: Date.now() };
                                        this.menuCache[cliente] = entry;
                                        this.writeToStorage<any[]>(key, entry);
                                        this.menuData.next(menuData);

                                        // ✅ Derivar categorías desde el menú y emitir (para reuso inmediato en CategoriaComponent)
                                        const categoriasFromMenu = (menuData || []).map((item: any) => ({
                                                id: item.categoriaId,
                                                nombre: item.nombre,
                                                route: item.route,
                                                icon: item.icon,
                                                esVisible: item.esVisible !== false,
                                                displayOrder: item.displayOrder ?? 9999
                                        }));
                                        const categoriasEntry = { data: categoriasFromMenu, timestamp: entry.timestamp };
                                        this.categoriasCache[cliente] = categoriasEntry;
                                        this.writeToStorage<any[]>(`categorias_${cliente}`, categoriasEntry);
                                        this.categoriasData.next(categoriasFromMenu);
                                        return menuData;
                                });
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

                // ✅ Intento de caché persistente (localStorage)
                if (!force) {
                        const stored = this.readFromStorage<any[]>(key);
                        if (stored && this.isCacheValid(stored.timestamp) && Array.isArray(stored.data) && stored.data.length > 0) {
                                this.categoriasCache[cliente] = { data: stored.data, timestamp: stored.timestamp };
                                this.categoriasData.next(stored.data);
                                return stored.data;
                        }
                }

                this.loadingPromises[key] = (async () => {
                        try {
                                return await runInInjectionContext(this.injector, async () => {
                                        console.log('loadCategorias -> cliente:', cliente);
                                        const categorias: any[] = [];
                                        const categoriaRef = collection(this.firestore, `clientes/${cliente}/categoria`);
                                        // Mantener orden en servidor, pero filtrar visibilidad en cliente para
                                        // compatibilidad con docs que no tengan 'esVisible' definido (tratados como visibles)
                                        // Usar orderBy solo si hay documentos con displayOrder; si no, traer todo y ordenar en cliente
                                        let q: Query;
                                        try {
                                                q = query(categoriaRef, orderBy('displayOrder', 'asc'));
                                                const categoriaSnap = await getDocs(q);
                                                console.log('categoriaSnap.docs.length (con orderBy):', categoriaSnap.docs.length);
                                                for (const categoriaDoc of categoriaSnap.docs) {
                                                        const data = categoriaDoc.data();
                                                        categorias.push({ id: categoriaDoc.id, ...(data || {}) });
                                                }
                                        } catch (e) {
                                                // Si falla por falta de displayOrder, traer todo sin ordenar
                                                console.log('Fallback: sin orderBy (displayOrder ausente)');
                                                const categoriaSnap = await getDocs(categoriaRef);
                                                for (const categoriaDoc of categoriaSnap.docs) {
                                                        const data = categoriaDoc.data();
                                                        categorias.push({ id: categoriaDoc.id, ...(data || {}) });
                                                }
                                                // Ordenar en cliente: displayOrder si existe, luego alfabético
                                                categorias.sort((a, b) => {
                                                        const aOrder = a.displayOrder ?? 9999;
                                                        const bOrder = b.displayOrder ?? 9999;
                                                        if (aOrder !== bOrder) return aOrder - bOrder;
                                                        return (a.nombre || '').localeCompare(b.nombre || '');
                                                });
                                        }

                                        const categoriasFiltradas = soloVisibles
                                                ? categorias.filter(cat => cat['esVisible'] !== false)
                                                : categorias;
                                        console.log('categoriasFiltradas', categoriasFiltradas)

                                        // ✅ Almacena en caché con timestamp (memoria + storage)
                                        const entry = { data: categoriasFiltradas, timestamp: Date.now() };
                                        this.categoriasCache[cliente] = entry;
                                        this.writeToStorage<any[]>(key, entry);
                                        this.categoriasData.next(categoriasFiltradas);

                                        return categoriasFiltradas;
                                });
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
                return await runInInjectionContext(this.injector, async () => {
                        const categoriaRef = collection(this.firestore, `clientes/${cliente}/categoria`);
                        const docRef = await addDoc(categoriaRef, categoria);
                        await this.loadCategorias(cliente, true);
                        return docRef.id;
                });
        }

        async updateCategoria(cliente: string, categoriaId: string, categoria: any) {
                return await runInInjectionContext(this.injector, async () => {
                        const categoriaDoc = doc(this.firestore, `clientes/${cliente}/categoria/${categoriaId}`);
                        await updateDoc(categoriaDoc, categoria);
                        await this.loadCategorias(cliente, true);
                });
        }

        async deleteCategoria(cliente: string, categoriaId: string) {
                return await runInInjectionContext(this.injector, async () => {
                        const categoriaDoc = doc(this.firestore, `clientes/${cliente}/categoria/${categoriaId}`);
                        await deleteDoc(categoriaDoc);
                        await this.loadCategorias(cliente, true);
                });
        }

        // --- CRUD PRODUCTOS ---
        async addProducto(cliente: string, categoriaId: string, producto: any) {
                return await runInInjectionContext(this.injector, async () => {
                        const productosRef = collection(this.firestore, `clientes/${cliente}/categoria/${categoriaId}/productos`);
                        const docRef = await addDoc(productosRef, producto);
                        return docRef.id;
                });
        }

        async updateProducto(cliente: string, categoriaId: string, productoId: string, producto: any) {
                return await runInInjectionContext(this.injector, async () => {
                        const productoDoc = doc(this.firestore, `clientes/${cliente}/categoria/${categoriaId}/productos/${productoId}`);
                        await updateDoc(productoDoc, producto);
                });
        }

        async deleteProducto(cliente: string, categoriaId: string, productoId: string) {
                return await runInInjectionContext(this.injector, async () => {
                        const productoDoc = doc(this.firestore, `clientes/${cliente}/categoria/${categoriaId}/productos/${productoId}`);
                        await deleteDoc(productoDoc);
                });
        }

        // --- CRUD GIFTCARDS ---
        async addGiftcard(cliente: string, giftcard: any) {
                return await runInInjectionContext(this.injector, async () => {
                        const giftcardsRef = collection(this.firestore, `clientes/${cliente}/giftcards`);
                        const docRef = await addDoc(giftcardsRef, giftcard);
                        return docRef.id;
                });
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
                                return await runInInjectionContext(this.injector, async () => {
                                        const giftcards: any[] = [];
                                        const giftcardsRef = collection(this.firestore, `clientes/${cliente}/giftcards`);
                                        const giftCardSnap = await getDocs(giftcardsRef);

                                        for (const giftcardDoc of giftCardSnap.docs) {
                                                giftcards.push({ id: giftcardDoc.id, ...giftcardDoc.data() });
                                        }

                                        this.giftCardsCache[cliente] = { data: giftcards, timestamp: Date.now() };
                                        this.giftCardsData.next(giftcards);

                                        return giftcards;
                                });
                        } finally {
                                delete this.loadingPromises[key];
                        }
                })();

                return this.loadingPromises[key];
        }

        async updateGiftcard(cliente: string, giftcardId: string, giftcard: any) {
                return await runInInjectionContext(this.injector, async () => {
                        const giftcardDoc = doc(this.firestore, `clientes/${cliente}/giftcards/${giftcardId}`);
                        await updateDoc(giftcardDoc, giftcard);
                });
        }

        async deleteGiftcard(cliente: string, giftcardId: string) {
                return await runInInjectionContext(this.injector, async () => {
                        const giftcardDoc = doc(this.firestore, `clientes/${cliente}/giftcards/${giftcardId}`);
                        await deleteDoc(giftcardDoc);
                });
        }
}