import { Routes } from '@angular/router';
import { SignIn } from './sign-in/sign-in';

export const routes: Routes = [
    {path:'signin',component:SignIn},
    {path:'',redirectTo:"/signin", pathMatch:'full'},
];
