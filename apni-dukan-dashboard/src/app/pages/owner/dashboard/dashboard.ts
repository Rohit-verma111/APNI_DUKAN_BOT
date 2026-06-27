import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface SalesStat {
  label: string;
  value: number;
  icon: string;
  change: string;
  positive: boolean;
}

interface RecentOrder {
  orderId: string;
  customer: string;
  amount: number;
  status: string;
  paymentType: string;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  ownerName = 'Ram Sharma';
  storeName = 'Ram General Store';
  activeTab = 'dashboard';

  stats: SalesStat[] = [
    { label: 'Today Sales', value: 4850, icon: '💰', change: '+12%', positive: true },
    { label: 'This Week', value: 28500, icon: '📈', change: '+8%', positive: true },
    { label: 'This Month', value: 98000, icon: '🗓️', change: '-3%', positive: false },
    { label: 'Total Orders', value: 142, icon: '📦', change: '+5%', positive: true },
  ];

  recentOrders: RecentOrder[] = [
    { orderId: '847392', customer: '+91 9876543210', amount: 480.43, status: 'PAID', paymentType: 'UPI', time: '10 min ago' },
    { orderId: '847391', customer: '+91 8765432109', amount: 1200.00, status: 'PENDING', paymentType: 'COD', time: '25 min ago' },
    { orderId: '847390', customer: '+91 7654321098', amount: 350.67, status: 'PAID', paymentType: 'UPI', time: '1 hr ago' },
    { orderId: '847389', customer: '+91 6543210987', amount: 890.12, status: 'FAILED', paymentType: 'UPI', time: '2 hr ago' },
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    const token = localStorage.getItem('owner_token');
    if (!token) {
      this.router.navigate(['/owner/login']);
    }
  }

  logout() {
    localStorage.removeItem('owner_token');
    this.router.navigate(['/owner/login']);
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'PAID': return 'status-paid';
      case 'PENDING': return 'status-pending';
      case 'FAILED': return 'status-failed';
      default: return '';
    }
  }
}