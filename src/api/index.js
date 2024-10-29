const express = require('express');
const auth = require('./auth/auth.routes');
const users = require('./users/users.routes');
const portfolio = require('./portofolio/portofolio.routes');
const path = require('path');
const router = express.Router();

router.use('/auth', auth);
router.use('/user', users);
router.use('/portofolio', portfolio);
router.use('/public/uploads/:file', (req, res) => {
  res.sendFile(path.join(__dirname, `../../public/uploads/${req.params.file}`));
});
module.exports = router;
