const QRCode = require('qrcode');
const pool = require('../config/db');
const { getUserSession, setUserSession, clearUserSession } = require('./sessionService');
const { createPaymentLink } = require('./paymentService');

async function handleIncomingMessage(whatsappNumber, messageText) {
  const text = messageText.trim().toLowerCase();
  
  // 1. पुराना सेशन गेट करो, अगर नहीं है तो नया 'WELCOME' स्टेट बनाओ
  let session = await getUserSession(whatsappNumber);
  if (!session) {
    session = { state: 'WELCOME', cart: [] };
  }

  let replyMessage = '';

  // 2. State Machine Logic
  switch (session.state) {
    
    case 'WELCOME':
      replyMessage = `नमस्ते! 🙏 *अपनी दुकान BOT* में आपका स्वागत है।\n\nनीचे दिए गए विकल्पों में से चुनें:\n1️⃣ *कैटलॉग देखें* (Type: 1)\n2️⃣ *आर्डर स्टेटस* (Type: 2)`;
      session.state = 'MAIN_MENU';
      await setUserSession(whatsappNumber, session);
      break;

    case 'MAIN_MENU':
      if (text === '1') {
        replyMessage = `🛍️ *हमारा कैटलॉग:*\nयहाँ हमारे बेहतरीन步 प्रोडक्ट्स हैं।\n\n*आइटम कोड्स:*\n👉 *PROD101* - Premium Shirt (Rs. 999)\n👉 *PROD102* - Casual Shoes (Rs. 1499)\n\nखरीदने के लिए आइटम कोड टाइप करें (जैसे: *PROD101*):`;
        session.state = 'ADD_TO_CART';
      } else if (text === '2') {
        replyMessage = `📦 कृपया अपना आर्डर नंबर (Order ID) डालें:`;
        session.state = 'CHECK_STATUS';
      } else {
        replyMessage = `❌ अमान्य विकल्प! कृपया मेनू देखने के लिए *Hi* या *Hello* भेजें।`;
        session.state = 'WELCOME';
      }
      await setUserSession(whatsappNumber, session);
      break;

    case 'ADD_TO_CART':
      if (text.startsWith('prod')) {
        const itemCode = messageText.toUpperCase();
        session.cart.push(itemCode);
        replyMessage = `✅ *${itemCode}* आपके कार्ट में जोड़ दिया गया है!\n\n🏠 अपना डिलीवरी एड्रेस (Delivery Address) टाइप करें:`;
        session.state = 'PROVIDE_ADDRESS';
      } else {
        replyMessage = `❌ गलत कोड! कृपया सही प्रोडक्ट कोड टाइप करें (जैसे: PROD101):`;
      }
      await setUserSession(whatsappNumber, session);
      break;

    case 'PROVIDE_ADDRESS':
      session.address = messageText;
      replyMessage = `🛒 *आर्डर की समीक्षा (Review Order):*\n\n📦 आइटम्स: ${session.cart.join(', ')}\n📍 पता: ${session.address}\n\nआर्डर कन्फर्म करने के लिए *YES* टाइप करें या कैंसिल करने के लिए *NO* टाइप करें।`;
      session.state = 'CONFIRM_ORDER';
      await setUserSession(whatsappNumber, session);
      break;
      
    case 'CONFIRM_ORDER':
      if (text === 'yes') {
        const orderId = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 🟢 मैजिक ट्रिक: ₹999 के साथ .01 से .99 के बीच रैंडम पैसे जोड़ो
        const basePrice = 999;
        const randomPaise = (Math.floor(Math.random() * 99) + 1) / 100;
        const totalPrice = parseFloat((basePrice + randomPaise).toFixed(2));

        const customerWhatsapp = whatsappNumber.toString();
        const itemsData = JSON.stringify([{ prod_code: "PROD101", qty: 1, price: basePrice }]);
        const shopId = null;

        // अपनी असली UPI ID और दुकान का नाम यहाँ डालो
        const shopUPI = "yourname@upi"; 
        const shopName = "Apni Dukan";

        try {
          // डेटाबेस में इस यूनिक अमाउंट (total_price) के साथ ऑर्डर सेव करो
          await pool.query(
            'INSERT INTO orders (shop_id, customer_whatsapp, items, total_price, status) VALUES ($1, $2, $3::jsonb, $4, $5)',
            [shopId, customerWhatsapp, itemsData, totalPrice, 'PENDING']
          );

          // NPCI के नियम के अनुसार UPI स्ट्रिंग बनाई
          const upiString = `upi://pay?pa=${shopUPI}&pn=${encodeURIComponent(shopName)}&am=${totalPrice}&cu=INR&tn=Order_${orderId}`;
          const qrCodeImage = await QRCode.toDataURL(upiString);

          replyMessage = `🎉 *आपका आर्डर दर्ज कर लिया गया है!* \n🆔 *आर्डर आईडी:* #${orderId}\n💵 *कुल सटीक राशि:* ₹${totalPrice}\n\n👇 *पेमेंट करने के लिए इस QR कोड को स्कैन करें:*\n\n⚠️ *ज़रूरी नोट:* कृपया राशि में बदलाव न करें (यह पहले से लॉक है)। पूरे ₹${totalPrice} का भुगतान होने पर ही बोट तुरंत आर्डर कन्फर्म करेगा।`;

          console.log(`🟢 QR Generated for ${customerWhatsapp} | Amount locked: ₹${totalPrice}`);

        } catch (dbError) {
          console.log("=== DATABASE ERROR ===", dbError);
          replyMessage = `⚠️ आर्डर प्रोसेस करने में कुछ तकनीकी दिक्कत आई है। कृपया दोबारा प्रयास करें।`;
        }

        await clearUserSession(whatsappNumber);
      } else {
        replyMessage = `❌ आर्डर कैंसिल कर दिया गया है। मुख्य मेनू पर जाने के लिए *Hi* लिखें।`;
        await clearUserSession(whatsappNumber);
      }
      break;

    default:
      replyMessage = `नमस्ते! मुख्य मेनू पर जाने के लिए कृपया *Hi* टाइप करें।`;
      session.state = 'WELCOME';
      await setUserSession(whatsappNumber, session);
  }

  return replyMessage;
}

module.exports = {
  handleIncomingMessage
};