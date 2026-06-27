
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-owner-login',
  standalone: true, // अगर स्टैंडअलोन है तो
  imports: [CommonModule, FormsModule], // 👈 यहाँ जोड़ दो
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  // तुम्हारी HTML के साथ 100% कंपैटिबल वेरिएबल्स
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(private http: HttpClient, private router: Router) {}

  // तुम्हारी HTML का कॉलिंग फंक्शन
  login() {
    if (!this.email || !this.password) {
      this.error = 'Please enter both Email and Password.';
      return;
    }

    this.loading = true;
    this.error = '';

    // एक्सप्रेस बैकएंड के लिए क्रेडेंशियल्स का पैकेट
    // नोट: बैकएंड में .env में OWNER_USERNAME के साथ मैच करने के लिए ईमेल ही जा रहा है
    const loginData = { username: this.email, password: this.password };

    this.http.post<any>('http://localhost:5000/api/owner/login', loginData).subscribe({
      next: (response) => {
        if (response.success) {
          // टोकन को तिजोरी (Local Storage) में लॉक करना
          localStorage.setItem('owner_token', response.token);
          // सीधे ओनर डैशबोर्ड पर सेफ एंट्री
          this.router.navigate(['/owner/dashboard']);
        }
        this.loading = false;
      },
      error: (err) => {
        // अगर क्रेडेंशियल गलत हैं तो एरर मैसेज दिखाना
        this.error = err.error?.message || 'Authentication failed. Please try again.';
        this.loading = false;
      }
    });
  }
}