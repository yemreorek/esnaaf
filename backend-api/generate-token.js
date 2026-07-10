const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const payload = { 
  sub: '34617f1a-e264-4afa-938d-618d534b5cb6', 
  phone: '753ec1cf93a22269e67eb40fc130cf20', 
  role: 'service_provider' 
};

const secret = '3305396ccb0941ddbf549e30fa8ff64e9ed7eb8329594dd2954ad78c1452b130';

const token = jwt.sign(payload, secret, { expiresIn: '15m' });
console.log(token);
