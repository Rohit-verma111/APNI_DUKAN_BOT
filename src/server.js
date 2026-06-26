const express = require('express');
const cors = require('cors'); // 👈 CORS इम्पोर्टेड
require('dotenv').config();
const pool = require('./config/db');
const redisClient = require('./config/redis');

// 1. Route Imports
const paymentRoutes = require('./routes/paymentRoutes');
const shopRoutes = require('./routes/shopRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes'); 
const orderRoutes = require('./routes/orderRoutes'); // 👈 नया एंगुलर डैशबोर्ड आर्डर रूट इम्पोर्ट किया

const app = express();

// 🟢 CORS कॉन्फ़िगरेशन - जो एंगुलर (Port 4200) को एक्सप्रेस (Port 5000) से जोड़ेगा
app.use(cors({
  origin: 'http://localhost:4200', // तुम्हारे एंगुलर का URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use('/catalogs', express.static('public/catalogs'));

// 2. Route Registration
app.use('/api/payments', paymentRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/whatsapp', whatsappRoutes); 
app.use('/api/orders', orderRoutes); // 👈 एंगुलर डैशबोर्ड के लिए नया एंडपॉइंट रजिस्टर किया

app.get('/', (req, res) => {
  res.send('🏪 APNI DUKAN BOT Server is Running Perfectly! 🚀');
});

// FIXED: Defining PORT only once here
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 APNI DUKAN BOT Server is running on port ${PORT}`);
  console.log(`===================================================`);
  
  // Debug: Print all registered routes in terminal
  console.log("📍 ACTIVE ROUTES REGISTERED IN EXPRESS:");
  if (app._router && app._router.stack) {
    app._router.stack.forEach(function(r){
      if (r.route && r.route.path){
        console.log(`   -> [${Object.keys(r.route.methods).join(',').toUpperCase()}] ${r.route.path}`);
      } else if (r.handle && r.handle.stack) {
        r.handle.stack.forEach(function(si){
          if(si.route) {
            let baseRoute = r.regexp.toString().replace(/[^a-zA-Z0-9/]/g, '');
            // क्लीन राउट नेम दिखाने के लिए फॉर्मेटिंग
            if (!baseRoute.startsWith('/')) baseRoute = '/' + baseRoute;
            console.log(`   -> [${Object.keys(si.route.methods).join(',').toUpperCase()}] ${baseRoute}${si.route.path}`);
          }
        });
      }
    });
  }
  console.log(`===================================================`);
});