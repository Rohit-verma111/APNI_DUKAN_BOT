const express = require('express');
const router = express.Router();
const { handleIncomingMessage } = require('../services/chatbotService');

// Make sure it is /webhook here, because /api/whatsapp comes from server.js
router.post('/webhook', async (req, res) => {
  try {
    const { from, message } = req.body;

    if (!from || !message) {
      return res.status(400).json({ error: 'Missing from or message parameter' });
    }

    const reply = await handleIncomingMessage(from, message);

    return res.status(200).json({
      to: from,
      reply: reply
    });
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// CRITICAL: Check this exact line at the bottom!
module.exports = router;