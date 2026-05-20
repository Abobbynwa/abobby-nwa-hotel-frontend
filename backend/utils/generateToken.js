import jwt from 'jsonwebtoken';

const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET || 'abobby-hotel-safe-dev-secret-change-in-production';
  const expiresIn = process.env.JWT_EXPIRE || '30d';

  return jwt.sign({ id, role }, secret, { expiresIn });
};

export default generateToken;