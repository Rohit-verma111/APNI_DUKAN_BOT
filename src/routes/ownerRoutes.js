const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// 1. GET: सारे प्रॉडक्ट्स की लिस्ट लाना (डैशबोर्ड पर दिखाने के लिए)
router.get('/products', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products ORDER BY id DESC');
    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// 2. POST: नया प्रॉडक्ट ऐड करना
router.post('/products', async (req, res) => {
  const { name, price, weight, stock, image_url, category } = req.body;
  try {
    const query = `
      INSERT INTO products (name, price, weight, stock, image_url, category)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const values = [name, price, weight, stock, image_url, category];
    const result = await db.query(query, values);
    
    return res.status(201).json({ success: true, message: 'Product added!', data: result.rows[0] });
  } catch (error) {
    console.error('Error adding product:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// 3. DELETE: प्रॉडक्ट हटाना
router.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM products WHERE id = $1', [id]);
    return res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});
module.exports = router;
