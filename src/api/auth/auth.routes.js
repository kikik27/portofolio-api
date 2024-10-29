/* eslint-disable linebreak-style */
/* eslint-disable consistent-return */
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { check, validationResult, matchedData } = require('express-validator');
const { isAuthenticated } = require('../../middlewares');
const {
  findUserByEmail,
  createUser,
  findUserById,
} = require('../users/users.services');
const { generateTokens } = require('../../utils/jwt');
const {
  addRefreshTokenToWhitelist,
  findRefreshTokenById,
  deleteRefreshToken,
  revokeTokens,
} = require('./auth.services');
const { hashToken } = require('../../utils/hashTokens');

const router = express.Router();

router.post('/register', [
  check('email').isEmail().withMessage('Invalid email address'),
  check('name').notEmpty(),
  check('password').isLength({ min: 6, max: 30 }).withMessage('Password must be between 6 and 30 characters'),
], async (req, res, next) => {
  try {
    const { email, password, name } = matchedData(req);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      res.status(400);
      throw new Error('Email already in use.');
    }

    const user = await createUser({ email, password, name });
    const jti = uuidv4();
    const { accessToken, refreshToken } = generateTokens(user, jti);
    await addRefreshTokenToWhitelist({ jti, refreshToken, userId: user.id });

    res.json({
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
});
router.post('/login', [
  check('email').isEmail().withMessage('Invalid email address'),
  check('password').isLength({ min: 6, max: 30 }).withMessage('Password must be between 6 and 30 characters'),
// eslint-disable-next-line consistent-return
], async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existingUser = await findUserByEmail(email);

    if (!existingUser) {
      res.status(403);
      throw new Error('Email is not registered');
    }

    const validPassword = await bcrypt.compare(password, existingUser.password);
    if (!validPassword) {
      res.status(403);
      throw new Error('Password is not correct');
    }

    const jti = uuidv4();
    const { accessToken, refreshToken } = generateTokens(existingUser, jti);
    await addRefreshTokenToWhitelist({ jti, refreshToken, userId: existingUser.id });

    res.json({
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/refreshToken', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400);
      throw new Error('Missing refresh token.');
    }
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const savedRefreshToken = await findRefreshTokenById(payload.jti);

    if (!savedRefreshToken || savedRefreshToken.revoked === true) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const hashedToken = hashToken(refreshToken);
    if (hashedToken !== savedRefreshToken.hashedToken) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const user = await findUserById(payload.userId);
    if (!user) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    await deleteRefreshToken(savedRefreshToken.id);
    const jti = uuidv4();
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user, jti);
    await addRefreshTokenToWhitelist({ jti, refreshToken: newRefreshToken, userId: user.id });

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
});

// This endpoint is only for demo purpose.
// Move this logic where you need to revoke the tokens( for ex, on password reset)
router.post('/revokeRefreshTokens', async (req, res, next) => {
  try {
    const { userId } = req.body;
    await revokeTokens(userId);
    res.json({ message: `Tokens revoked for user with id #${userId}` });
  } catch (err) {
    next(err);
  }
});

router.get('/profile', isAuthenticated, async (req, res, next) => {
  try {
    const { userId } = req.payload;
    const user = await findUserById(userId);
    delete user.password;
    res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
