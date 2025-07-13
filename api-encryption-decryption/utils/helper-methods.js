// module imports
const crypto = require('crypto');

const API_SECRET_KEY = 'Y2TrTtFSFJ9IgQ2Db9rAy3+H8RfDnslLD+j5TVQ2C2I='; // Example key, replace with your own

exports.encryptData = (data) => {
  const key = Buffer.from(API_SECRET_KEY, 'base64');
  if (key.length !== 32) throw new Error('Encryption key must be 32 bytes (256 bits)');

  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted,
  };
};

exports.decryptData = ({ iv, tag, data }) => {
  const key = Buffer.from(API_SECRET_KEY, 'base64');
  if (key.length !== 32) throw new Error('Encryption key must be 32 bytes (256 bits)');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));

  decipher.setAuthTag(Buffer.from(tag, 'base64'));

  let decrypted = decipher.update(data, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
};
