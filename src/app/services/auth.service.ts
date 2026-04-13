import { Injectable, Injector } from '@angular/core';
import { Auth, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { runInInjectionContext } from '@angular/core';
import { ActiveUser } from '../models/app.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
        constructor(private auth: Auth, private router: Router, private firestore: Firestore, private injector: Injector) { }

        logout() {
                return signOut(this.auth).then(() => {
                        this.router.navigate(['/auth/login']);
                });
        }

        // Devuelve una promesa con el usuario activo y su clienteId
        async getUsuarioActivo(): Promise<ActiveUser | null> {
                const currentUser = this.auth.currentUser;
                if (!currentUser) return null;

                return runInInjectionContext(this.injector, async () => {
                        const userDocRef = doc(this.firestore, `usuarios/${currentUser.uid}`);
                        const userSnap = await getDoc(userDocRef);

                        if (userSnap.exists()) {
                                const data = userSnap.data() as { clienteId?: string };
                                return {
                                        uid: currentUser.uid,
                                        email: currentUser.email || '',
                                        clienteId: data.clienteId || ''
                                } satisfies ActiveUser;
                        }
                        return null;
                });
        }
}
