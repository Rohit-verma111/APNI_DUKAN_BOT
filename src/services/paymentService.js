const razorpayInstance = require('../config/razorpay');

async function createPaymentLink(orderId, amountInRs, customerNumber) {
  try {
    const options = {
      amount: amountInRs * 100, // Razorpay पैसे हमेशा पैसे (paise) में लेता है (Rs. 100 = 10000 पैसे)
      currency: "INR",
      accept_partial: false,
      reference_id: `ORDER_${orderId}`,
      description: `Payment for Order #${orderId} on Apni Dukan`,
      customer: {
        name: "Valued Customer",
        contact: `+${customerNumber}` // व्हाट्सएप नंबर
      },
      notify: {
        sms: false,
        email: false
      },
      reminder_enable: true,
      // पेमेंट सफल होने के बाद कस्टमर इस पेज पर रीडायरेक्ट होगा (अभी के लिए डमी यूआरएल)
      callback_url: "https://yourwebsite.com/payment-success",
      callback_method: "get"
    };

    const paymentLink = await razorpayInstance.paymentLink.create(options);
    return paymentLink.short_url; // यह हमें पेमेंट करने का शॉर्ट लिंक देगा
  } catch (error) {
    console.error("❌ Razorpay Payment Link Error:", error);
    return null;
  }
}

module.exports = {
  createPaymentLink
};