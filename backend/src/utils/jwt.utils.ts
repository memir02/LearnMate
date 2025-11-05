const jwt = require('jsonwebtoken');

export interface JWTPayload {
  id: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

// Generate JWT Token
export const generateToken = (payload: JWTPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

// Verify JWT Token
export const verifyToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.verify(token, secret);
};




