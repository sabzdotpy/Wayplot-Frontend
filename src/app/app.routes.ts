import { Routes } from '@angular/router';
import { SignIn } from './sign-in/sign-in';
import { SignUp } from './sign-up/sign-up';
import { AdmimDashboard } from './admim-dashboard/admim-dashboard';
import { UserDashboard } from './user-dashboard/user-dashboard';
import { MapVisualization } from './map-visualization/map-visualization';

export const routes: Routes = [
    {path:'signin',component:SignIn},
    {path:'',redirectTo:"/signin", pathMatch:'full'},
    // {path:'**',redirectTo:"/signin", pathMatch:'full'}
    {path:'signup',component:SignUp},
    {path:'admindashboard',component:AdmimDashboard},
    {path:'userdashboard',component:UserDashboard},
    {path:'viewmap',component:MapVisualization}
];
