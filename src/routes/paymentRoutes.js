const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const axios = require('axios'); // 🚀 बाहर मैसेज भेजने के लिए axios इम्पोर्ट किया

// 🚀 UPI Webhook Receiver
router.post('/upi-webhook', async (req, res) => {
  try {
    const { notificationText } = req.body; 
    console.log("📱 New Notification Received:", notificationText);

    if (!notificationText) {
      return res.status(400).json({ error: "No text found" });
    }

    const amountRegex = /999\.\d{2}/;
    const match = notificationText.match(amountRegex);

    if (!match) {
      return res.status(200).json({ message: "Notification ignored (Amount format didn't match)" });
    }

    const receivedAmount = parseFloat(match[0]);
    console.log(`🎯 Extracted Locked Amount from SMS: ₹${receivedAmount}`);

    // ⚡ डेटाबेस में PENDING ऑर्डर को ढूंढो
    const orderCheck = await pool.query(
      "SELECT * FROM orders WHERE total_price = $1 AND status = 'PENDING'",
      [receivedAmount]
    );

    if (orderCheck.rowCount === 0) {
      return res.status(200).json({ message: `No pending order found for amount ₹${receivedAmount}` });
    }

    const currentOrder = orderCheck.rows[0];
    const customerPhone = currentOrder.customer_whatsapp;
    const shopId = currentOrder.shop_id; // ओनर का नंबर निकालने के लिए

    // 🔄 ऑर्डर स्टेटस को PAID कर दो
    await pool.query(
      "UPDATE orders SET status = 'PAID' WHERE id = $1",
      [currentOrder.id]
    );

    console.log(`✅ MATCH FOUND! Order #${currentOrder.id} updated to PAID for user ${customerPhone}`);

    // =========================================================================
    // 📩 व्हाट्सएप नोटिफिकेशन भेजने का असली जादू (WhatsApp Alerts)
    // =========================================================================
    
    // 1. ग्राहक के लिए बधाई संदेश
    const customerMessage = `✅ *भुगतान सफल (Payment Successful)!*\n\nलाडले, आपका ₹${receivedAmount} का पेमेंट हमें मिल गया है।\n📦 आपका ऑर्डर नंबर *#${currentOrder.id}* अब कन्फर्म हो चुका है और दुकान से तैयार किया जा रहा है।\n\nहमारे साथ शॉपिंग करने के लिए धन्यवाद! 🙏`;

    // 2. दुकान के मालिक (Owner) को अलर्ट निकालने के लिए डेटाबेस से उसका नंबर लाओ
    const shopCheck = await pool.query("SELECT owner_whatsapp FROM shops WHERE id = $1", [shopId]);
    const ownerPhone = shopCheck.rowCount > 0 ? shopCheck.rows[0].owner_whatsapp : null;

    // 🟢 नोट: यहाँ नीचे तुम जो भी व्हाट्सएप गेटवे की API यूज़ कर रहे हो, उसका असली URL डालना होगा।
    // अभी मैं एक डमी या जो तुम्हारा लोकल/लाइव प्रोवाइडर एंडपॉइंट है, उसका ढांचा बना रहा हूँ।
    const WHATSAPP_API_URL = "http://localhost:5000/api/whatsapp/webhook"; // या तुम्हारा असली प्रोवाइडर URL

    try {
      // ग्राहक को मैसेज भेजो
      await axios.post(WHATSAPP_API_URL, {
        from: customerPhone, // जिसे भेजना है
        message: customerMessage
      });
      console.log(`📩 Success Alert Sent to Customer: ${customerPhone}`);

      // ओनर को अलर्ट भेजो (अगर ओनर का नंबर मौजूद है)
      if (ownerPhone) {
        const ownerMessage = `💰 *नया पेमेंट रिसीव हुआ!*\n\nदुकान जी, ग्राहक (${customerPhone}) से ₹${receivedAmount} का भुगतान प्राप्त हो गया है।\n📦 कृपया ऑर्डर नंबर *#${currentOrder.id}* का सामान पैक करना शुरू करें!`;
        
        await axios.post(WHATSAPP_API_URL, {
          from: ownerPhone,
          message: ownerMessage
        });
        console.log(`📩 Order Alert Sent to Shop Owner: ${ownerPhone}`);
      }

    } catch (wsError) {
      // अगर व्हाट्सएप API डाउन हो या कोई एरर आए तो सर्वर क्रैश नहीं होना चाहिए, सिर्फ लॉग दिखेगा
      console.error("⚠️ WhatsApp Sending Trigger Failed:", wsError.message);
    }
    // =========================================================================

    return res.status(200).json({ 
      success: true, 
      message: `Order verified automatically for amount ₹${receivedAmount}` 
    });

  } catch (error) {
    console.error("❌ Webhook Processing Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;