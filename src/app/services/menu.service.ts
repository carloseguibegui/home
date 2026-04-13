import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Firestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, QueryDocumentSnapshot, DocumentData, writeBatch } from '@angular/fire/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { runInInjectionContext } from '@angular/core';
import { Giftcard, MenuCategory, MenuProduct } from '../models/app.models';

@Injectable({ providedIn: 'root' })
export class MenuService {
        private menuData = new BehaviorSubject<MenuCategory[]>([]);
        menuData$ = this.menuData.asObservable();

        private categoriasData = new BehaviorSubject<MenuCategory[]>([]);
        categoriasData$ = this.categoriasData.asObservable();

        private giftCardsData = new BehaviorSubject<Giftcard[]>([]);
        giftCardsData$ = this.giftCardsData.asObservable();

        // ✅ CACHÉ en memoria con timestamps
        private menuCache: { [cliente: string]: { data: MenuCategory[], timestamp: number } } = {};
        private categoriasCache: { [cliente: string]: { data: MenuCategory[], timestamp: number } } = {};
        private giftCardsCache: { [cliente: string]: { data: Giftcard[], timestamp: number } } = {};

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

        private getCategoriaCollection(cliente: string) {
                return collection(this.firestore, `clientes/${cliente}/categoria`);
        }

        private getProductosCollection(cliente: string, categoriaId: string) {
                return collection(this.firestore, `clientes/${cliente}/categoria/${categoriaId}/productos`);
        }

        private normalizeDisplayOrder(value: unknown): number | null {
                return typeof value === 'number' && Number.isFinite(value) ? value : null;
        }

        private compareCategories(a: Pick<MenuCategory, 'nombre' | 'displayOrder' | 'id' | 'categoriaId'>, b: Pick<MenuCategory, 'nombre' | 'displayOrder' | 'id' | 'categoriaId'>): number {
                const displayOrderA = this.normalizeDisplayOrder(a.displayOrder);
                const displayOrderB = this.normalizeDisplayOrder(b.displayOrder);

                if (displayOrderA !== null && displayOrderB !== null) {
                        return displayOrderA - displayOrderB;
                }

                if (displayOrderA !== null) return -1;
                if (displayOrderB !== null) return 1;

                const byName = String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es', { sensitivity: 'base' });
                if (byName !== 0) return byName;

                const aId = String(a.id ?? a.categoriaId ?? '');
                const bId = String(b.id ?? b.categoriaId ?? '');
                return aId.localeCompare(bId, 'es', { sensitivity: 'base' });
        }

        private removeStorageEntry(key: string): void {
                try {
                        localStorage.removeItem(this.STORAGE_PREFIX + key);
                } catch {
                        // storage no disponible: ignorar
                }
        }

        /**
         * Verifica si el caché está vigente
         */
        private isCacheValid(timestamp: number): boolean {
                return Date.now() - timestamp < this.CACHE_TTL;
        }

        /**
         * Carga menú desde Firestore o caché
         */
        async loadMenuFirestore(cliente: string, force = false): Promise<MenuCategory[]> {
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
                        const stored = this.readFromStorage<MenuCategory[]>(key);
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
                                        const categoriaRef = this.getCategoriaCollection(cliente);
                                        // Fetchear todas las categorías sin orderBy para incluir las que no tienen displayOrder
                                        const categoriaSnap = await getDocs(categoriaRef);
                                        const menuPromises = categoriaSnap.docs.map(async (seccionDoc: QueryDocumentSnapshot<DocumentData>) => {
                                                const seccionData = seccionDoc.data() as MenuCategory;
                                                const productosRef = this.getProductosCollection(cliente, seccionDoc.id);
                                                const productosQuery = query(productosRef, orderBy('nombre', 'asc'));
                                                const productosSnap = await getDocs(productosQuery);

                                                const productos = productosSnap.docs.map(prod => ({
                                                        idProducto: prod.id,
                                                        ...(prod.data() as MenuProduct)
                                                } satisfies MenuProduct));

                                                return {
                                                        ...seccionData,
                                                        productos,
                                                        categoriaId: seccionDoc.id
                                                } satisfies MenuCategory;
                                        });

                                        const menuData = (await Promise.all(menuPromises))
                                                .filter((cat) => cat.esVisible !== false)
                                                .sort((a, b) => this.compareCategories(a, b));

                                        // ✅ Cache memoria + storage (MENÚ)
                                        const entry = { data: menuData, timestamp: Date.now() };
                                        this.menuCache[cliente] = entry;
                                        this.writeToStorage<MenuCategory[]>(key, entry);
                                        this.menuData.next(menuData);

                                        // ✅ Derivar categorías desde el menú y emitir (para reuso inmediato en CategoriaComponent)
                                        const categoriasFromMenu = (menuData || []).map((item) => ({
                                                id: item.categoriaId,
                                                nombre: item.nombre,
                                                route: item.route,
                                                icon: item.icon,
                                                esVisible: item.esVisible !== false,
                                                displayOrder: item.displayOrder ?? 9999
                                        } satisfies MenuCategory));
                                        const categoriasEntry = { data: categoriasFromMenu, timestamp: entry.timestamp };
                                        this.categoriasCache[cliente] = categoriasEntry;
                                        this.writeToStorage<MenuCategory[]>(`categorias_${cliente}`, categoriasEntry);
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
        async loadCategorias(cliente: string, force = false, soloVisibles = false): Promise<MenuCategory[]> {
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
                        const stored = this.readFromStorage<MenuCategory[]>(key);
                        if (stored && this.isCacheValid(stored.timestamp) && Array.isArray(stored.data) && stored.data.length > 0) {
                                this.categoriasCache[cliente] = { data: stored.data, timestamp: stored.timestamp };
                                this.categoriasData.next(stored.data);
                                return stored.data;
                        }
                }

                this.loadingPromises[key] = (async () => {
                        try {
                                return await runInInjectionContext(this.injector, async () => {
                                        const categorias: MenuCategory[] = [];
                                        const categoriaRef = this.getCategoriaCollection(cliente);
                                        const categoriaSnap = await getDocs(categoriaRef);

                                        for (const categoriaDoc of categoriaSnap.docs) {
                                                const data = categoriaDoc.data() as MenuCategory;
                                                categorias.push({ id: categoriaDoc.id, ...(data || {}) });
                                        }

                                        categorias.sort((a, b) => this.compareCategories(a, b));

                                        const categoriasFiltradas = soloVisibles
                                                ? categorias.filter((cat) => cat.esVisible !== false)
                                                : categorias;

                                        // ✅ Almacena en caché con timestamp (memoria + storage)
                                        const entry = { data: categoriasFiltradas, timestamp: Date.now() };
                                        this.categoriasCache[cliente] = entry;
                                        this.writeToStorage<MenuCategory[]>(key, entry);
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
                        delete this.giftCardsCache[cliente];
                        this.removeStorageEntry(`menu_${cliente}`);
                        this.removeStorageEntry(`categorias_${cliente}`);
                        this.removeStorageEntry(`giftcards_${cliente}`);
                } else {
                        this.menuCache = {};
                        this.categoriasCache = {};
                        this.giftCardsCache = {};
                        Object.keys(localStorage)
                                .filter((key) => key.startsWith(this.STORAGE_PREFIX))
                                .forEach((key) => this.removeStorageEntry(key.replace(this.STORAGE_PREFIX, '')));
                }
        }

        // --- CRUD CATEGORÍAS ---
        async getProductosCountByCategoria(cliente: string): Promise<Record<string, number>> {
                return await runInInjectionContext(this.injector, async () => {
                        const categoriaSnap = await getDocs(this.getCategoriaCollection(cliente));
                        const countsEntries = await Promise.all(
                                categoriaSnap.docs.map(async (categoriaDoc) => {
                                        const productosSnap = await getDocs(this.getProductosCollection(cliente, categoriaDoc.id));
                                        return [categoriaDoc.id, productosSnap.size] as const;
                                })
                        );

                        return Object.fromEntries(countsEntries);
                });
        }

        async addCategoria(cliente: string, categoria: MenuCategory) {
                return await runInInjectionContext(this.injector, async () => {
                        const categoriaRef = this.getCategoriaCollection(cliente);
                        const docRef = await addDoc(categoriaRef, categoria);
                        await this.loadCategorias(cliente, true);
                        return docRef.id;
                });
        }

        async updateCategoria(cliente: string, categoriaId: string, categoria: MenuCategory) {
                return await runInInjectionContext(this.injector, async () => {
                        const categoriaDoc = doc(this.firestore, `clientes/${cliente}/categoria/${categoriaId}`);
                        await updateDoc(categoriaDoc, categoria);
                        await this.loadCategorias(cliente, true);
                });
        }

        async deleteCategoria(cliente: string, categoriaId: string) {
                return await runInInjectionContext(this.injector, async () => {
                        const productosSnap = await getDocs(this.getProductosCollection(cliente, categoriaId));
                        if (!productosSnap.empty) {
                                throw new Error('CATEGORY_HAS_PRODUCTS');
                        }

                        const categoriaDoc = doc(this.firestore, `clientes/${cliente}/categoria/${categoriaId}`);
                        await deleteDoc(categoriaDoc);
                        await this.loadCategorias(cliente, true);
                });
        }

        // --- CRUD PRODUCTOS ---
        async addProducto(cliente: string, categoriaId: string, producto: MenuProduct) {
                return await runInInjectionContext(this.injector, async () => {
                        const productosRef = this.getProductosCollection(cliente, categoriaId);
                        const docRef = await addDoc(productosRef, producto);
                        return docRef.id;
                });
        }

        async updateProducto(cliente: string, categoriaId: string, productoId: string, producto: MenuProduct) {
                return await runInInjectionContext(this.injector, async () => {
                        const productoDoc = doc(this.firestore, `clientes/${cliente}/categoria/${categoriaId}/productos/${productoId}`);
                        await updateDoc(productoDoc, producto);
                });
        }

        async moveProducto(cliente: string, categoriaOriginalId: string, categoriaNuevaId: string, productoId: string, producto: MenuProduct) {
                return await runInInjectionContext(this.injector, async () => {
                        const batch = writeBatch(this.firestore);
                        const productoOrigenDoc = doc(this.firestore, `clientes/${cliente}/categoria/${categoriaOriginalId}/productos/${productoId}`);
                        const productoDestinoDoc = doc(this.firestore, `clientes/${cliente}/categoria/${categoriaNuevaId}/productos/${productoId}`);

                        batch.set(productoDestinoDoc, producto);
                        batch.delete(productoOrigenDoc);

                        await batch.commit();
                });
        }

        async deleteProducto(cliente: string, categoriaId: string, productoId: string) {
                return await runInInjectionContext(this.injector, async () => {
                        const productoDoc = doc(this.firestore, `clientes/${cliente}/categoria/${categoriaId}/productos/${productoId}`);
                        await deleteDoc(productoDoc);
                });
        }

        // --- CRUD GIFTCARDS ---
        async addGiftcard(cliente: string, giftcard: Giftcard) {
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

        async loadGiftcards(cliente: string, force = false): Promise<Giftcard[]> {
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
                                                giftcards.push({ id: giftcardDoc.id, ...(giftcardDoc.data() as Giftcard) });
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

        async updateGiftcard(cliente: string, giftcardId: string, giftcard: Giftcard) {
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
