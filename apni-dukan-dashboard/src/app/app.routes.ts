
import { Routes } from '@angular/router';
import { StoreComponent } from './pages/store/store';
import { Login } from './pages/owner/login/login';
import { Dashboard } from './pages/owner/dashboard/dashboard';
import { Products } from './pages/owner/products/products';
import { Orders } from './pages/owner/orders/orders';
import { Returns } from './pages/owner/returns/returns';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  // Customer
  { path: '', redirectTo: 'store', pathMatch: 'full' },
  { path: 'store', component: StoreComponent },

  // Owner
  { path: 'owner/login', component: Login },
  { path: 'owner/dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'owner/products', component: Products, canActivate: [authGuard] },
  { path: 'owner/orders', component: Orders, canActivate: [authGuard] },
  { path: 'owner/returns', component: Returns, canActivate: [authGuard] },

  // Fallback
  { path: '**', redirectTo: 'store' }
];