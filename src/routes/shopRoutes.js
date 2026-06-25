const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 1. Shop Registration API
router.post('/register', async (req, res) => {
  const { shop_name, owner_whatsapp } = req.body;
  try {
    const newShop = await pool.query(
      'INSERT INTO shops (shop_name, owner_whatsapp) VALUES ($1, $2) RETURNING *',
      [shop_name, owner_whatsapp]
    );
    res.status(201).json({ success: true, data: newShop.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Add Product with Auto-Generated Product Code (e.g., A1, A2)
router.post('/product', async (req, res) => {
  const { shop_id, name, price, weight, is_dairy } = req.body;
  try {
    // Count existing products to increment code sequence
    const countRes = await pool.query('SELECT COUNT(*) FROM products WHERE shop_id = $1', [shop_id]);
    const nextCount = parseInt(countRes.rows[0].count) + 1;
    const product_code = `A${nextCount}`;

    const newProduct = await pool.query(
      'INSERT INTO products (shop_id, product_code, name, price, weight, is_dairy) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [shop_id, product_code, name, price, weight, is_dairy]
    );
    res.status(201).json({ success: true, data: newProduct.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Live Dashboard Analytics
router.get('/analytics/:shop_id', async (req, res) => {
  const { shop_id } = req.params;
  try {
    const metrics = await pool.query(
      `SELECT 
        COUNT(CASE WHEN status = 'PAID' OR status = 'PENDING' THEN 1 END) as total_orders,
        COUNT(CASE WHEN status = 'RETURNED' THEN 1 END) as total_returns,
        COUNT(CASE WHEN status = 'EXCHANGED' THEN 1 END) as total_exchanges
       FROM orders WHERE shop_id = $1`,
      [shop_id]
    );
    res.json({ success: true, analytics: metrics.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
const { generateCatalogPDF } = require('../services/pdfService');

// 4. Trigger PDF Generation via Dashboard
router.post('/generate-pdf', async (req, res) => {
  const { shop_id } = req.body;
  try {
    const pdfUrl = await generateCatalogPDF(shop_id);
    res.json({ success: true, message: "Catalog generated successfully!", pdf_url: pdfUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
module.exports = router;