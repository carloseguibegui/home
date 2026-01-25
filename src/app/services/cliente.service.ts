import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Injectable, Injector } from '@angular/core';
import { runInInjectionContext } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClienteService {
        constructor(private firestore: Firestore, private injector: Injector) { }

        async getNombreCliente(clienteId: string): Promise<string> {
                return runInInjectionContext(this.injector, async () => {
                        const clienteDoc = doc(this.firestore, `clientes/${clienteId}`);
                        const clienteSnap = await getDoc(clienteDoc);
                        if (clienteSnap.exists()) {
                                const data = clienteSnap.data();
                                return data?.['nombreCliente'] || '';
                        }
                        return '';
                });
        }
}
