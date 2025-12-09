import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { environment } from '../Environment/environment';
import { provideAuth, getAuth } from '@angular/fire/auth';



import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
<<<<<<< HEAD
    provideHttpClient(),
    // Firebase initialization
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    // Firebase Authentication
    provideAuth(() => getAuth()),
=======
    provideHttpClient(), provideFirebaseApp(() => initializeApp({ projectId: "wayplot-trioverse", appId: "1:1098178042986:web:f3ede9a77988864a987e13", storageBucket: "wayplot-trioverse.firebasestorage.app", apiKey: "AIzaSyAxPI_F_6a0hccY8MZsKSYuEmoBNpltr3k", authDomain: "wayplot-trioverse.firebaseapp.com", messagingSenderId: "1098178042986", measurementId: "G-2PK222CVXR", projectNumber: "1098178042986", version: "2" })), provideAuth(() => getAuth()),
>>>>>>> a35a06a1652e8508ecc2e88121449c5e0638f8ce
       
  ]
};
