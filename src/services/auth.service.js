const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const SALT_ROUNDS = 10;
const TOKEN_EXPIRES_IN = '7d';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    getJwtSecret(),
    { expiresIn: TOKEN_EXPIRES_IN },
  );
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

async function register({ email, password, name }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name?.trim() || null,
    },
  });

  return {
    user: toPublicUser(user),
    token: signToken(user),
  };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return {
    user: toPublicUser(user),
    token: signToken(user),
  };
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  register,
  login,
  verifyToken,
  toPublicUser,
};
