import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClienteService {
    constructor(private firestore: Firestore) { }

    async getNombreCliente(clienteId: string): Promise<string> {
        const clienteDoc = doc(this.firestore, `clientes/${clienteId}`);
        const clienteSnap = await getDoc(clienteDoc);
        if (clienteSnap.exists()) {
            const data = clienteSnap.data();
            return data?.['nombreCliente'] || '';
        }
        return '';
    }
}
