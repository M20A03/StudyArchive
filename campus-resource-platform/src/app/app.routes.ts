import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SearchComponent } from './components/search/search.component';
import { UploadComponent } from './components/resources/upload/upload.component';
import { MyResourcesComponent } from './components/resources/my-resources/my-resources.component';
import { OverviewComponent } from './components/dashboard/overview/overview.component';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: LoginComponent,
        canActivate: [guestGuard]
    },
    {
        path: 'signup',
        component: SignupComponent,
        canActivate: [guestGuard]
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
        // Open to all visitors at opening / starting of website
        children: [
            { path: '', component: OverviewComponent },
            { path: 'search', component: SearchComponent },
            // Protected routes that require sign-in
            { path: 'upload', component: UploadComponent, canActivate: [authGuard] },
            { path: 'my-resources', component: MyResourcesComponent, canActivate: [authGuard] }
        ]
    },
    {
        path: '**',
        redirectTo: '/dashboard'
    }
];
