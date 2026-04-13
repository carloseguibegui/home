import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore } from '@angular/fire/firestore';
import { getApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { firebaseConfig } from '../environments/environment';


export const appConfig: ApplicationConfig = {
        providers: [
                provideZoneChangeDetection({ eventCoalescing: true }),
                provideRouter(routes),
                provideHttpClient(),
                provideFirebaseApp(() => initializeApp({
                        projectId: firebaseConfig.projectId,
                        appId: firebaseConfig.appId,
                        storageBucket: firebaseConfig.storageBucket,
                        apiKey: firebaseConfig.apiKey,
                        authDomain: firebaseConfig.authDomain,
                        messagingSenderId: firebaseConfig.messagingSenderId,
                        measurementId: firebaseConfig.measurementId
                })),
                provideAuth(() => getAuth()),
                provideFirestore(() => {
                        const app = getApp();
                        return initializeFirestore(app, {
                                localCache: persistentLocalCache({
                                        tabManager: persistentMultipleTabManager()
                                })
                        });
                }),
                provideStorage(() => getStorage()),
                provideAnimationsAsync(),
                providePrimeNG({
                        theme: {
                                preset: Aura,
                                options: {
                                        darkModeSelector: 'none',
                                        // monthNames: [
                                        // 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                                        // 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                                        // ],
                                }
                        }
                })
        ],
};
