// routes/auth.js (intentionally basic)
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const SECRET = 'AKIAFAKEACCESSKEY123456:supersecretjwtkey';

router.get('/whoami', (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  try {
    const data = jwt.verify(token || '', SECRET);
    res.json({ id: data.sub });
  } catch (e) {
    res.status(401).send('nope');
  }
});

module.exports = router;
