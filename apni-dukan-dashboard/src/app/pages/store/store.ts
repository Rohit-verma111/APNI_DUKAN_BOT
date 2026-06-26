import QRCode from 'qrcode';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router'; // 🔍 URL से ?user= पैरामीटर खींचने के लिए
import { HttpClient, HttpClientModule } from '@angular/common/http'; // 🚀 एक्सप्रेस बैकएंड API हिट करने के लिए
import { FormsModule } from '@angular/forms'; // ✍️ डिलीवरी एड्रेस [(ngModel)] बाइंडिंग के लिए

interface Product {
  id: number;
  name: string;
  price: number;
  weight: string;
  description: string;
  emoji: string;
  quantity: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule], // 🟢 ज़रूरी मॉड्यूल्स इम्पोर्ट किए
  templateUrl: './store.html',
  styleUrl: './store.css'
})
export class StoreComponent implements OnInit {
  storeName = 'Ram General Store';
  customerWhatsapp = ''; // 📱 ग्राहक का व्हाट्सएप नंबर
  shippingAddress = '';  // 📍 ग्राहक का डिलीवरी एड्रेस

  products: Product[] = [
    { id: 1, name: 'Basmati Chawal', price: 120, weight: '1kg', description: 'Premium quality, long grain rice', emoji: '🍚', quantity: 0 },
    { id: 2, name: 'Sunflower Oil', price: 180, weight: '1L', description: 'Refined, cholesterol free', emoji: '🫙', quantity: 0 },
    { id: 3, name: 'Aashirvaad Atta', price: 350, weight: '5kg', description: '100% whole wheat flour', emoji: '🌾', quantity: 0 },
    { id: 4, name: 'Maggi Noodles', price: 14, weight: '70g', description: '2 minute instant noodles', emoji: '🍜', quantity: 0 },
    { id: 5, name: 'Tata Salt', price: 22, weight: '1kg', description: 'Iodized salt, pure & healthy', emoji: '🧂', quantity: 0 },
  ];
  
  selectedProduct: Product | null = null;
  cart: CartItem[] = [];
  showCart = false;
  orderConfirmed = false;
  qrCodeUrl = '';
  finalPrice = 0; // 💵 तुम्हारी HTML फाइल में {{ finalPrice }} है, इसे यहाँ सिंक कर दिया
  orderId = '';

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    // 🔍 बोट द्वारा भेजे गए लिंक में से ग्राहक का व्हाट्सएप नंबर निकालो
    this.route.queryParams.subscribe(params => {
      this.customerWhatsapp = params['user'] || '';
      console.log('🎯 WhatsApp User Tracked on Dashboard:', this.customerWhatsapp);
    });
  }

  openProduct(product: Product) {
    this.selectedProduct = product;
  }

  closeProduct() {
    this.selectedProduct = null;
  }

  addToCartFromModal(product: Product) {
    this.addToCart(product);
    this.closeProduct();
  }

  addToCart(product: Product) {
    const existing = this.cart.find(item => item.product.id === product.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.cart.push({ product, quantity: 1 });
    }
  }

  removeFromCart(item: CartItem) {
    this.cart = this.cart.filter(i => i.product.id !== item.product.id);
  }

  increaseQty(item: CartItem) {
    item.quantity++;
  }

  decreaseQty(item: CartItem) {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      this.removeFromCart(item);
    }
  }

  getTotal(): number {
    return this.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }

  getTotalItems(): number {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  // 🚀 असली मैजिक: अब आर्डर सीधे एक्सप्रेस बैकएंड पर जाएगा
  async confirmOrder() {
    if (!this.customerWhatsapp) {
      alert('❌ क्रिटिकल एरर: व्हाट्सएप सेशन नहीं मिला! कृपया बोट के लिंक से दोबारा खोलें।');
      return;
    }

    // 📍 आर्डर कन्फर्म करने से पहले एड्रेस मांगो (अगर खाली है)
    if (!this.shippingAddress || !this.shippingAddress.trim()) {
      const addressInput = prompt('📍 कृपया अपना पूरा डिलीवरी एड्रेस (Delivery Address) दर्ज करें:');
      if (addressInput && addressInput.trim()) {
        this.shippingAddress = addressInput;
      } else {
        alert('⚠️ बिना एड्रेस के आर्डर प्रोसेस नहीं किया जा सकता!');
        return;
      }
    }

    // 1. फ्रंटएंड के लिए आर्डर आईडी और डायनामिक लॉक्ड अमाउंट सेट करो
    this.orderId = Math.floor(100000 + Math.random() * 900000).toString();
    const basePrice = this.getTotal();
    const randomPaise = (Math.floor(Math.random() * 99) + 1) / 100;
    this.finalPrice = parseFloat((basePrice + randomPaise).toFixed(2));

    // 2. एक्सप्रेस बैकएंड के लिए डेटा पैकेट तैयार करो
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

    // 3. एक्सप्रेस के `orderRoutes` API एंडपॉइंट पर डेटा पोस्ट करो
    this.http.post('http://localhost:5000/api/orders/create', orderPayload)
      .subscribe({
        next: async (res: any) => {
          console.log('✅ Order saved in DB and WhatsApp Triggered!');
          
          // 4. बैकएंड पर सक्सेसफुली सेव होने के बाद यूपीआई क्यूआर कोड रेंडर करो
          const shopUPI = "yourname@upi"; // अपनी यूपीआई आईडी बदल लेना
          const upiString = `upi://pay?pa=${shopUPI}&pn=${encodeURIComponent(this.storeName)}&am=${this.finalPrice}&cu=INR&tn=Order_${this.orderId}`;
          this.qrCodeUrl = await QRCode.toDataURL(upiString);
          
          this.orderConfirmed = true;
          this.showCart = false;
        },
        error: (err) => {
          console.error('❌ DB Order Post Failed:', err);
          alert('डेटाबेस एपीआई डाउन है। कृपया बैकएंड सर्वर चेक करें!');
        }
      });
  }

  resetOrder() {
    this.cart = [];
    this.shippingAddress = '';
    this.orderConfirmed = false;
    this.orderId = '';
    this.showCart = false;
  }
}