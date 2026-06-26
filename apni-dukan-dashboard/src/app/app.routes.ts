import { Routes } from '@angular/router';
import { StoreComponent } from './pages/store/store';

export const routes: Routes = [
  { path: '', redirectTo: 'store', pathMatch: 'full' },
  { path: 'store', component: StoreComponent },
];