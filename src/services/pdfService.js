const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function generateCatalogPDF(shopId) {
  return new Promise(async (resolve, reject) => {
    try {
      const shopRes = await pool.query('SELECT shop_name FROM shops WHERE id = $1', [shopId]);
      const productsRes = await pool.query('SELECT * FROM products WHERE shop_id = $1 ORDER BY id ASC', [shopId]);
      
      if (shopRes.rows.length === 0) return reject('Shop not found');
      
      const shopName = shopRes.rows[0].shop_name;
      const products = productsRes.rows;

      // Ensure directory exists
      const pdfFolder = path.join(__dirname, '../../public/catalogs');
      if (!fs.existsSync(pdfFolder)) {
        fs.mkdirSync(pdfFolder, { recursive: true });
      }
      const filePath = path.join(pdfFolder, `catalog_${shopId}.pdf`);
      
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // PDF Branding Header
      doc.fontSize(24).fillColor('#128C7E').text(shopName.toUpperCase(), { align: 'center' });
      doc.fontSize(10).fillColor('#555555').text('Powered by APNI DUKAN BOT', { align: 'center' });
      doc.moveDown(2);

      // Table Columns Layout
      doc.fontSize(12).fillColor('#000000').text('CODE', 50, doc.y, { width: 60 });
      doc.text('ITEM NAME', 120, doc.y - 12, { width: 200 });
      doc.text('WEIGHT', 320, doc.y - 12, { width: 80 });
      doc.text('PRICE', 420, doc.y - 12, { width: 80 });
      
      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#128C7E');
      doc.moveDown(1);

      // Loop over items
      products.forEach(item => {
        let currentY = doc.y;
        doc.fontSize(11).fillColor('#333333');
        doc.text(item.product_code, 50, currentY);
        doc.text(item.name, 120, currentY);
        doc.text(item.weight, 320, currentY);
        doc.text(`Rs. ${item.price}`, 420, currentY);
        doc.moveDown(0.8);
      });

      doc.end();

      stream.on('finish', () => {
        resolve(`/catalogs/catalog_${shopId}.pdf`);
      });

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateCatalogPDF };