import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SearchComponent } from './components/search/search.component';
import { UploadComponent } from './components/resources/upload/upload.component';
import { MyResourcesComponent } from './components/resources/my-resources/my-resources.component';
import { OverviewComponent } from './components/dashboard/overview/overview.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      { path: '', component: OverviewComponent },
      { path: 'upload', component: UploadComponent },
      { path: 'my-resources', component: MyResourcesComponent },
      { path: 'search', component: SearchComponent }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
