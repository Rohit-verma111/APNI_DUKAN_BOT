const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');
const redisClient = require('./config/redis');
const paymentRoutes = require('./routes/paymentRoutes');
// 1. Route Imports
const shopRoutes = require('./routes/shopRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes'); 

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/payments', paymentRoutes);
app.use('/catalogs', express.static('public/catalogs'));

// 2. Route Registration
app.use('/api/shop', shopRoutes);
app.use('/api/whatsapp', whatsappRoutes); 

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
            console.log(`   -> [${Object.keys(si.route.methods).join(',').toUpperCase()}] ${r.regexp.toString().replace(/[^a-zA-Z0-9/]/g, '')}${si.route.path}`);
          }
        });
      }
    });
  }
  console.log(`===================================================`);
});