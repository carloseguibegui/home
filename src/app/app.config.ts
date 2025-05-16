import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { getAnalytics } from "firebase/analytics";
import { getAnalytics as getAnalytics_alias, provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, provideAppCheck } from '@angular/fire/app-check';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { getPerformance, providePerformance } from '@angular/fire/performance';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { getRemoteConfig, provideRemoteConfig } from '@angular/fire/remote-config';
import { bootstrapApplication } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideAnimations } from '@angular/platform-browser/animations';

// Firebase configuration (replace with your Firebase project details)
const firebaseConfig = {
  apiKey: "AIzaSyBvQO0EP5UTi4NVb7UL0gqqD6sPACu_tgQ",
  authDomain: "menu-digital-e8e62.firebaseapp.com",
  projectId: "menu-digital-e8e62",
  storageBucket: "menu-digital-e8e62.firebasestorage.app",
  messagingSenderId: "939531684476",
  appId: "1:939531684476:web:cc90c57cf2a1c6dd8097f9",
  measurementId: "G-SFDJNM054K"
};



export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideClientHydration(withEventReplay()), provideHttpClient(),
  provideAuth(() => getAuth()), // Provide Firebase Authentication
  provideFirestore(() => getFirestore()), provideFirebaseApp(() => initializeApp({ projectId: "menu-digital-e8e62", appId: "1:939531684476:web:cc90c57cf2a1c6dd8097f9", storageBucket: "menu-digital-e8e62.firebasestorage.app", apiKey: "AIzaSyBvQO0EP5UTi4NVb7UL0gqqD6sPACu_tgQ", authDomain: "menu-digital-e8e62.firebaseapp.com", messagingSenderId: "939531684476", measurementId: "G-SFDJNM054K" })), provideAuth(() => getAuth()), provideAnalytics(() => getAnalytics()), ScreenTrackingService, UserTrackingService, provideAppCheck(() => {
    // TODO get a reCAPTCHA Enterprise here https://console.cloud.google.com/security/recaptcha?project=_
    const provider = new ReCaptchaEnterpriseProvider("6LfYbjcrAAAAAOZypiFGt2-9uqxoopVA1y1BBYfv");
    // 6LfYbjcrAAAAACGrfbQc-CT4hKpA0ZEDAy1aMchc
    return initializeAppCheck(undefined, { provider, isTokenAutoRefreshEnabled: true });
  }), provideFirestore(() => getFirestore()), provideFunctions(() => getFunctions()), provideMessaging(() => getMessaging()), providePerformance(() => getPerformance()), provideStorage(() => getStorage()), provideRemoteConfig(() => getRemoteConfig()), // Provide Firestore],
    provideAnimations(),
    provideClientHydration(),
  ],
};
