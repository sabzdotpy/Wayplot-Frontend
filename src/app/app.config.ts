import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { environment } from '../Environment/environment';
import { provideAuth, getAuth } from '@angular/fire/auth';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'wayplot-trioverse',
        appId: '1:1098178042986:web:f3ede9a77988864a987e13',
        storageBucket: 'wayplot-trioverse.firebasestorage.app',
        apiKey: 'AIzaSyAxPI_F_6a0hccY8MZsKSYuEmoBNpltr3k',
        authDomain: 'wayplot-trioverse.firebaseapp.com',
        messagingSenderId: '1098178042986',
        measurementId: 'G-2PK222CVXR',
      })
    ),
    provideAuth(() => getAuth()),
  ],
};
