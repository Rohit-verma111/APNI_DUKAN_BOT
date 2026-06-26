const { getUserSession, setUserSession } = require('./sessionService');

async function handleIncomingMessage(whatsappNumber, messageText) {
  const text = messageText.trim().toLowerCase();
  
  let session = await getUserSession(whatsappNumber);
  if (!session) {
    session = { state: 'WELCOME' };
  }

  let replyMessage = '';

  // 1. अगर यूजर पहली बार आया या Hi/Hello भेजा
  if (text === 'hi' || text === 'hello' || session.state === 'WELCOME') {
    replyMessage = `नमस्ते! 🙏 *अपनी दुकान* में आपका स्वागत है।\n\nनीचे दिए गए विकल्पों में से चुनें:\n1️⃣ *दुकान से खरीदारी करें (Buy)*\n2️⃣ *रिटर्न और एक्सचेंज (Return/Exchange)*`;
    session.state = 'AWAITING_CHOICE';
    await setUserSession(whatsappNumber, session);
    return replyMessage;
  }

  // 2. चॉइस हैंडलिंग
  if (session.state === 'AWAITING_CHOICE') {
    if (text === '1') {
      // 🟢 यहाँ मैजिक है: लिंक के साथ यूजर का नंबर टोकन बनाकर भेज रहे हैं
      const dashboardLink = `http://localhost:3000/dashboard?user=${whatsappNumber}`;
      
      replyMessage = `🛍️ *शानदार!* नीचे दिए गए लिंक पर क्लिक करके हमारी दुकान का डैशबोर्ड खोलें, प्रोडक्ट्स ब्राउज़ करें और अपना ऑर्डर प्लेस करें:\n\n🔗 ${dashboardLink}\n\n*नोट:* ऑर्डर कन्फर्म होते ही इनवॉइस और पेमेंट QR आपको इसी व्हाट्सएप पर मिल जाएगा!`;
      session.state = 'WELCOME'; // रीसेट ताकि दोबारा Hi करने पर मेनू आए
    } else if (text === '2') {
      replyMessage = `🔄 *रिटर्न और एक्सचेंज:*\nकृपया अपने ऑर्डर की डिटेल्स और समस्या यहाँ टाइप करें, हमारे टीम मेंबर आपसे जल्द ही संपर्क करेंगे।`;
      session.state = 'WELCOME';
    } else {
      replyMessage = `❌ अमान्य विकल्प! कृपया *1* या *2* टाइप करें, या मुख्य मेनू के लिए *Hi* भेजें।`;
    }
    await setUserSession(whatsappNumber, session);
  }

  return replyMessage;
}

module.exports = { handleIncomingMessage };