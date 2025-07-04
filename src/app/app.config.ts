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
import { initializeAppCheck, ReCaptchaEnterpriseProvider, provideAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { getPerformance, providePerformance } from '@angular/fire/performance';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { getRemoteConfig, provideRemoteConfig } from '@angular/fire/remote-config';
import { bootstrapApplication } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
// Firebase configuration (replace with your Firebase project details)
import { firebaseConfig } from '../environments/environment';



export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideClientHydration(withEventReplay()), provideHttpClient(),
  provideAuth(() => getAuth()), // Provide Firebase Authentication
    provideFirestore(() => getFirestore()), provideFirebaseApp(() => initializeApp({
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId,
    storageBucket: firebaseConfig.storageBucket,
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    messagingSenderId: firebaseConfig.messagingSenderId,
    measurementId: firebaseConfig.measurementId
    })), provideAuth(() => getAuth()), provideAnalytics(() => getAnalytics()), ScreenTrackingService, UserTrackingService, provideAppCheck(() => {
    // TODO get a reCAPTCHA Enterprise here https://console.cloud.google.com/security/recaptcha?project=_
    const provider = new ReCaptchaV3Provider("6LfYbjcrAAAAAOZypiFGt2-9uqxoopVA1y1BBYfv");
    // 6LfYbjcrAAAAACGrfbQc-CT4hKpA0ZEDAy1aMchc
      // return initializeAppCheck(undefined, { provider, isTokenAutoRefreshEnabled: true });
      return initializeAppCheck(undefined, { provider, isTokenAutoRefreshEnabled: true });
  }), provideFirestore(() => getFirestore()), provideFunctions(() => getFunctions()), provideMessaging(() => getMessaging()), providePerformance(() => getPerformance()), provideStorage(() => getStorage()), provideRemoteConfig(() => getRemoteConfig()), // Provide Firestore],
  provideAnimations(),
  provideClientHydration(),
  provideAnimationsAsync(),
  providePrimeNG({
    theme: {
      preset: Aura,
      options: {
        darkModeSelector: false || 'none'
      }
    }
  })
  ],
};
