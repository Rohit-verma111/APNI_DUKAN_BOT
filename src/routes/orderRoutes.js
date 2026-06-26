const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const QRCode = require('qrcode');
const axios = require('axios');

// 🚀 डैशबोर्ड से ऑर्डर रिसीव करने का एंडपॉइंट
router.post('/create', async (req, res) => {
  try {
    const { customer_whatsapp, items, base_price, shipping_address } = req.body;

    // 1. छह अंकों का रैंडम ऑर्डर आईडी बनाओ
    const orderId = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. 🟢 मैजिक ट्रिक: बेस प्राइस के साथ .01 से .99 के बीच रैंडम पैसे लॉक करो
    const randomPaise = (Math.floor(Math.random() * 99) + 1) / 100;
    const totalPrice = parseFloat((parseFloat(base_price) + randomPaise).toFixed(2));

    const shopUPI = "yourname@upi"; // अपनी असली UPI ID
    const shopName = "Apni Dukan";

    // 3. डेटाबेस में नया JSONB स्कीमा के साथ ऑर्डर सेव करो[cite: 1]
    const itemsData = JSON.stringify(items);
    await pool.query(
      'INSERT INTO orders (order_id, customer_whatsapp, items, total_price, shipping_address, status) VALUES ($1, $2, $3::jsonb, $4, $5, $6)',
      [orderId, customer_whatsapp, itemsData, totalPrice, shipping_address, 'PENDING']
    );

    // 4. UPI स्ट्रिंग और क्यूआर कोड जनरेट करो
    const upiString = `upi://pay?pa=${shopUPI}&pn=${encodeURIComponent(shopName)}&am=${totalPrice}&cu=INR&tn=Order_${orderId}`;
    const qrCodeImage = await QRCode.toDataURL(upiString);

    // 5. व्हाट्सएप पर ऑटोमैटिक इनवॉइस और क्यूआर भेजने का मैसेज तैयार करो
    const itemsListText = items.map(i => `• ${i.prod_code} (Qty: ${i.qty})`).join('\n');
    const invoiceMessage = `🛍️ *आपका ऑर्डर दर्ज कर लिया गया है!* \n\n🆔 *ऑर्डर आईडी:* #${orderId}\n📦 *आइटम्स:*\n${itemsListText}\n📍 *पता:* ${shipping_address}\n💵 *कुल सटीक राशि (Locked):* ₹${totalPrice}\n\n👇 *पेमेंट करने के लिए इस QR कोड को स्कैन करें:*\n\n⚠️ *ज़रूरी नोट:* कृपया राशि में बदलाव न करें। पूरे ₹${totalPrice} का भुगतान होने पर ही बोट तुरंत आर्डर कन्फर्म करेगा।`;

    // 6. Axios से सीधे व्हाट्सएप बोट वेबहुक को ट्रिगर मारो
    const WHATSAPP_API_URL = "http://localhost:5000/api/whatsapp/webhook";
    try {
      await axios.post(WHATSAPP_API_URL, {
        from: customer_whatsapp,
        message: invoiceMessage
      });
      console.log(`🟢 Invoice & QR sent via WhatsApp to ${customer_whatsapp}`);
    } catch (wsError) {
      console.error("⚠️ Failed to send WhatsApp invoice:", wsError.message);
    }

    return res.status(201).json({ success: true, orderId, totalPrice });

  } catch (error) {
    console.error("❌ Order Creation Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;