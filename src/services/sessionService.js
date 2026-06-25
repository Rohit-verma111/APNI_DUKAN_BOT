const redisClient = require('../config/redis');

// Session expiry time: 30 minutes (1800 seconds)
const SESSION_TTL = 1800;

async function setUserSession(whatsappNumber, sessionData) {
  try {
    const key = `session:${whatsappNumber}`;
    // Store data as a stringified JSON object
    await redisClient.set(key, JSON.stringify(sessionData), {
      EX: SESSION_TTL
    });
    return true;
  } catch (error) {
    console.error('Error setting redis session:', error);
    return false;
  }
}

async function getUserSession(whatsappNumber) {
  try {
    const key = `session:${whatsappNumber}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting redis session:', error);
    return null;
  }
}

async function clearUserSession(whatsappNumber) {
  try {
    const key = `session:${whatsappNumber}`;
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Error clearing redis session:', error);
    return false;
  }
}

module.exports = {
  setUserSession,
  getUserSession,
  clearUserSession
};