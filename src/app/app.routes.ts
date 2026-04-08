import { Routes } from '@angular/router';
import { UsersPageComponent } from './features/users/users-page.component';

export const routes: Routes = [
  {
    path: '',
    component: UsersPageComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
