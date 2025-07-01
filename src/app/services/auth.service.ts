import { Injectable } from '@angular/core';
import { Auth, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private auth: Auth, private router: Router, private firestore: Firestore) { }

  logout() {
    return signOut(this.auth).then(() => {
      this.router.navigate(['/auth/login']);
    });
  }

  // Devuelve una promesa con el usuario activo y su clienteId
  async getUsuarioActivo(): Promise<{ uid: string, email: string, clienteId: string } | null> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) return null;

    // Busca el documento del usuario en Firestore
    const userDocRef = doc(this.firestore, `usuarios/${currentUser.uid}`);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const data = userSnap.data() as any;
      return {
        uid: currentUser.uid,
        email: currentUser.email || '',
        clienteId: data.clienteId
      };
    }
    return null;
  }
}