import QRCode from 'qrcode';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Product {
  id: number;
  name: string;
  price: number;
  weight: string;
  description: string;
  emoji: string;
  quantity: number;
  category: string;
  isPopular: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface OrderHistory {
  orderId: string;
  date: string;
  total: number;
  items: CartItem[];
  address: string;
}

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './store.html',
  styleUrl: './store.css'
})
export class StoreComponent implements OnInit {
  storeName = 'Ram General Store';
  customerWhatsapp = '';
  shippingAddress = '';

  // Theme
  isDarkTheme = true;

  // Active Tab
  activeTab = 'home';

  // Order Save Guard
  orderSaved = false;

  products: Product[] = [
    { id: 1, name: 'Basmati Chawal', price: 120, weight: '1kg', description: 'Premium quality, long grain rice. Aged for perfect taste.', emoji: '🍚', quantity: 0, category: 'Grains', isPopular: true },
    { id: 2, name: 'Sunflower Oil', price: 180, weight: '1L', description: 'Refined, cholesterol free. Light and healthy for daily cooking.', emoji: '🫙', quantity: 0, category: 'Oil & Ghee', isPopular: true },
    { id: 3, name: 'Aashirvaad Atta', price: 350, weight: '5kg', description: '100% whole wheat flour. Rich in fiber and nutrients.', emoji: '🌾', quantity: 0, category: 'Grains', isPopular: false },
    { id: 4, name: 'Maggi Noodles', price: 14, weight: '70g', description: '2 minute instant noodles. Classic masala flavor.', emoji: '🍜', quantity: 0, category: 'Snacks', isPopular: true },
    { id: 5, name: 'Tata Salt', price: 22, weight: '1kg', description: 'Iodized salt, pure & healthy. Vacuum evaporated.', emoji: '🧂', quantity: 0, category: 'Spices', isPopular: false },
    { id: 6, name: 'Amul Butter', price: 55, weight: '100g', description: 'Pasteurized butter from fresh cream. Perfect for bread.', emoji: '🧈', quantity: 0, category: 'Oil & Ghee', isPopular: true },
  ];

  categories = [
    { name: 'All', emoji: '🏪' },
    { name: 'Grains', emoji: '🌾' },
    { name: 'Oil & Ghee', emoji: '🫙' },
    { name: 'Snacks', emoji: '🍜' },
    { name: 'Spices', emoji: '🧂' },
    { name: 'others', emoji: '' },

  ];

  selectedProduct: Product | null = null;
  cart: CartItem[] = [];
  showCart = false;
  orderConfirmed = false;
  qrCodeUrl = '';
  finalPrice = 0;
  orderId = '';
  searchQuery = '';
  selectedCategory = 'All';
  filteredProducts: Product[] = [];

  // Order History
  orderHistory: OrderHistory[] = [];
  selectedHistoryOrder: OrderHistory | null = null;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    this.filteredProducts = this.products;
    this.loadHistory();
    this.route.queryParams.subscribe(params => {
      this.customerWhatsapp = params['user'] || '';
      console.log('🎯 WhatsApp User:', this.customerWhatsapp);
    });
  }

  // ── THEME ─────────────────────────────────────────
  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
  }

  get themeClass() {
    return this.isDarkTheme ? 'theme-dark' : 'theme-light';
  }

  // ── HISTORY ───────────────────────────────────────
  loadHistory() {
    const saved = localStorage.getItem('order_history_' + (this.customerWhatsapp || 'guest'));
    this.orderHistory = saved ? JSON.parse(saved) : [];
  }

  saveToHistory() {
    const newOrder: OrderHistory = {
      orderId: this.orderId,
      date: new Date().toLocaleString('hi-IN'),
      total: this.finalPrice,
      items: JSON.parse(JSON.stringify(this.cart)),
      address: this.shippingAddress
    };
    this.orderHistory.unshift(newOrder);
    localStorage.setItem('order_history_' + (this.customerWhatsapp || 'guest'),
      JSON.stringify(this.orderHistory));
  }

  openHistoryOrder(order: OrderHistory) {
    this.selectedHistoryOrder = order;
  }

  closeHistoryOrder() {
    this.selectedHistoryOrder = null;
  }

  // ── SEARCH & FILTER ───────────────────────────────
  filterProducts() {
    this.filteredProducts = this.products.filter(p =>
      p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) &&
      (this.selectedCategory === 'All' || p.category === this.selectedCategory)
    );
  }

  selectCategory(cat: string) {
    this.selectedCategory = cat;
    this.filterProducts();
  }

  // ── CART HELPERS ──────────────────────────────────
  isInCart(product: Product): boolean {
    return this.cart.some(i => i.product.id === product.id);
  }

  getCartQty(product: Product): number {
    return this.cart.find(i => i.product.id === product.id)?.quantity || 0;
  }

  decreaseQtyByProduct(product: Product) {
    const item = this.cart.find(i => i.product.id === product.id);
    if (item) this.decreaseQty(item);
  }

  // ── MODAL ─────────────────────────────────────────
  openProduct(product: Product) { this.selectedProduct = product; }
  closeProduct() { this.selectedProduct = null; }
  addToCartFromModal(product: Product) {
    this.addToCart(product);
    this.closeProduct();
  }

  // ── CART ACTIONS ──────────────────────────────────
  addToCart(product: Product) {
    const existing = this.cart.find(item => item.product.id === product.id);
    if (existing) { existing.quantity++; }
    else { this.cart.push({ product, quantity: 1 }); }
  }

  removeFromCart(item: CartItem) {
    this.cart = this.cart.filter(i => i.product.id !== item.product.id);
  }

  increaseQty(item: CartItem) { item.quantity++; }

  decreaseQty(item: CartItem) {
    if (item.quantity > 1) { item.quantity--; }
    else { this.removeFromCart(item); }
  }

  getTotal(): number {
    return this.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }

  getTotalItems(): number {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  // ── ORDER CONFIRM ─────────────────────────────────
  async confirmOrder() {
    if (!this.customerWhatsapp) {
      alert('❌ व्हाट्सएप सेशन नहीं मिला! बोट के लिंक से खोलें।');
      return;
    }

    if (!this.shippingAddress?.trim()) {
      const addr = prompt('📍 डिलीवरी एड्रेस दर्ज करें:');
      if (addr?.trim()) { this.shippingAddress = addr; }
      else { alert('⚠️ एड्रेस ज़रूरी है!'); return; }
    }

    this.orderId = Math.floor(100000 + Math.random() * 900000).toString();
    const basePrice = this.getTotal();
    const randomPaise = (Math.floor(Math.random() * 99) + 1) / 100;
    this.finalPrice = parseFloat((basePrice + randomPaise).toFixed(2));

    const orderPayload = {
      customer_whatsapp: this.customerWhatsapp,
      items: this.cart.map(item => ({
        prod_code: item.product.name,
        qty: item.quantity,
        price: item.product.price
      })),
      base_price: basePrice,
      shipping_address: this.shippingAddress
    };

    this.http.post('http://localhost:5000/api/orders/create', orderPayload)
      .subscribe({
        next: async () => {
          if (this.orderSaved) return; // ✅ Guard — dobara save nahi hoga
          this.orderSaved = true;

          const shopUPI = "yourname@upi";
          const upiString = `upi://pay?pa=${shopUPI}&pn=${encodeURIComponent(this.storeName)}&am=${this.finalPrice}&cu=INR&tn=Order_${this.orderId}`;
          this.qrCodeUrl = await QRCode.toDataURL(upiString);
          this.saveToHistory();
          this.orderConfirmed = true;
          this.showCart = false;
        },
        error: (err) => {
          console.error('❌ Error:', err);
          alert('बैकएंड सर्वर चेक करें!');
        }
      });
  }

  resetOrder() {
    this.cart = [];
    this.shippingAddress = '';
    this.orderConfirmed = false;
    this.orderId = '';
    this.showCart = false;
    this.qrCodeUrl = '';
    this.finalPrice = 0;
    this.orderSaved = false; // ✅ Guard reset
    this.activeTab = 'home';
  }
}