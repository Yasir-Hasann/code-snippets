// file imports
const { encryptData, decryptData } = require('../utils/helper-methods');

/* Decrypt Request */
exports.decryptRequest = (req, res, next) => {
  try {
    if (req.body && req.body.iv && req.body.tag && req.body.data) {
      req.body = decryptData(req.body);
    }
    next();
  } catch (err) {
    console.error('Decryption failed:', err);
    res.status(400).json({ error: 'Invalid encrypted request payload' });
  }
};

/* Encrypt Response */
exports.encryptResponse = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    try {
      const encrypted = encryptData(data);
      return originalJson.call(this, encrypted);
    } catch (err) {
      console.error('Encryption failed:', err);
      return res.status(500).json({ error: 'Encryption error' });
    }
  };

  next();
};
