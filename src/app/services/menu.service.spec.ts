import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import * as firestoreModule from '@angular/fire/firestore';

import { MenuService } from './menu.service';

describe('MenuService', () => {
  let service: MenuService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MenuService,
        { provide: Firestore, useValue: {} }
      ]
    });
    service = TestBed.inject(MenuService);

    spyOn(firestoreModule, 'collection').and.returnValue({} as any);
    spyOn(firestoreModule, 'doc').and.callFake((...segments: unknown[]) => (segments[1] as string | undefined ?? 'doc-ref') as any);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('sorts categories deterministically by displayOrder and name', async () => {
    spyOn(firestoreModule, 'getDocs').and.resolveTo({
      docs: [
        { id: 'beta', data: () => ({ nombre: 'Beta' }) },
        { id: 'alpha', data: () => ({ nombre: 'Alpha' }) },
        { id: 'ordered', data: () => ({ nombre: 'Primero', displayOrder: 1 }) }
      ]
    } as any);

    const categorias = await service.loadCategorias('cliente-demo', true);

    expect(categorias.map((categoria) => categoria.nombre)).toEqual(['Primero', 'Alpha', 'Beta']);
  });

  it('publishes the client id alongside cached categorias data', async () => {
    let emittedClient: string | null = null;
    service.categoriasDataClient$.subscribe((cliente) => {
      emittedClient = cliente;
    });

    spyOn(firestoreModule, 'getDocs').and.resolveTo({
      docs: [
        { id: 'categoria-1', data: () => ({ nombre: 'Bebidas' }) }
      ]
    } as any);

    const categorias = await service.loadCategorias('foster_tandil', true);

    expect(categorias.length).toBe(1);
    expect(emittedClient).toBe('foster_tandil');
  });

  it('prevents deleting a category that still has products', async () => {
    spyOn(firestoreModule, 'getDocs').and.resolveTo({ empty: false } as any);
    const deleteDocSpy = spyOn(firestoreModule, 'deleteDoc').and.resolveTo();

    await expectAsync(service.deleteCategoria('cliente-demo', 'categoria-1')).toBeRejectedWithError('CATEGORY_HAS_PRODUCTS');
    expect(deleteDocSpy).not.toHaveBeenCalled();
  });

  it('moves a product with a single Firestore batch', async () => {
    const batch = jasmine.createSpyObj('WriteBatch', ['set', 'delete', 'commit']);
    batch.commit.and.resolveTo();
    spyOn(firestoreModule, 'writeBatch').and.returnValue(batch as any);

    await service.moveProducto('cliente-demo', 'categoria-a', 'categoria-b', 'producto-1', { nombre: 'Cafe' } as any);

    expect(batch.set).toHaveBeenCalled();
    expect(batch.delete).toHaveBeenCalled();
    expect(batch.commit).toHaveBeenCalled();
  });
});
