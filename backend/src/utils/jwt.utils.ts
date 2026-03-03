const jwt = require('jsonwebtoken');

export interface JWTPayload {
  id: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

//  JWT Token oluşturma
export const generateToken = (payload: JWTPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

// JWT Token doğrulama
export const verifyToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.verify(token, secret);
};




