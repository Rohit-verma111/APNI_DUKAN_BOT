import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-owner-products',
  templateUrl: './products.html',
  standalone: true, 
  imports: [CommonModule, FormsModule], 
  styleUrls: ['./products.css']
})
export class Products implements OnInit {
  productsList: any[] = [];
  isLoading = false;

  // नए प्रॉडक्ट का फॉर्म मॉडल
  newProduct = {
    name: '',
    price: null,
    weight: '',
    stock: null,
    category: 'Veggies',
    image_url: ''
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchProducts();
  }

  // डेटाबेस से लिस्ट लोड करना
  fetchProducts() {
    this.isLoading = true;
    this.http.get<any>('http://localhost:5000/api/owner/products').subscribe({
      next: (res) => {
        if (res.success) this.productsList = res.data;
        this.isLoading = false;
      },error: (err) => { 
        this.isLoading = false; 
      } 
    });
  }

  addProduct(name: string, price: any, weight: string, stock: any, category: string, imageUrl: string) {
    if (!name || !price || !weight) {
      alert('Please fill product Name, Price and Weight.');
      return;
    }

    const productData = {
      name: name,
      price: parseFloat(price),
      weight: weight,
      stock: stock ? parseInt(stock) : 0,
      category: category,
      image_url: imageUrl
    };

    this.http.post<any>('http://localhost:5000/api/owner/products', productData).subscribe({
      next: (res) => {
        if (res.success) {
          this.productsList.unshift(res.data); // डेटाबेस से आया फ्रेश डेटा तुरंत लिस्ट में ऐड
        }
      },
      error: (err) => {
        alert('Failed to save product to database.');
      }
    });
  }
  // लिस्ट से आइटम डिलीट करना
  deleteProduct(id: number) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.http.delete<any>(`http://localhost:5000/api/owner/products/${id}`).subscribe({
        next: (res) => {
          if (res.success) {
            this.productsList = this.productsList.filter(p => p.id !== id);
          }
        }
      });
    }
  }
}