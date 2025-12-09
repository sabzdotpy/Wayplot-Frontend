import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
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
    // Firebase initialization
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    // Firebase Authentication
    provideAuth(() => getAuth()),
       
  ]
};
