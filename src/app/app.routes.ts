import { Routes } from '@angular/router';
import { SignIn } from './sign-in/sign-in';
import { SignUp } from './sign-up/sign-up';
import { AdmimDashboard } from './admim-dashboard/admim-dashboard';

export const routes: Routes = [
    {path:'signin',component:SignIn},
    {path:'',redirectTo:"/signin", pathMatch:'full'},
    // {path:'**',redirectTo:"/signin", pathMatch:'full'}
    {path:'signup',component:SignUp},
    {path:'admindashboard',component:AdmimDashboard}
];
