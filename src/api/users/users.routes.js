/* eslint-disable linebreak-style */
const express = require('express');
const { isAuthenticated } = require('../../middlewares');
const { findUserById, findAllUsers } = require('./users.services');

const router = express.Router();

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

router.get('/', async (req, res, next) => {
  try {
    const users = await findAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
