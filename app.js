// app.js - intentionally insecure demo server
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const md5 = require('md5');
const { exec } = require('child_process');
const app = express();

app.use(bodyParser.json());

// Insecure CORS: allow all
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // insecure for prod
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

// Hardcoded 'secret' (gitleaks will pick up)
const SECRET = 'AKIAFAKEACCESSKEY123456:supersecretjwtkey';

// In-memory "users"
let users = [
  { id: 1, username: 'alice', password: md5('password123') } // weak hashing
];

// Unsafe endpoint: evaluates input (vulnerable to RCE)
app.post('/admin/run', (req, res) => {
  const { cmd } = req.body;
  // WARNING: insecure - using eval
  try {
    const out = eval(cmd); // semgrep should flag eval usage
    res.json({ result: String(out) });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

// Insecure: exec direct shell command with user input
app.post('/admin/shell', (req, res) => {
  const { q } = req.body;
  exec(`echo ${q}`, (err, stdout, stderr) => {
    if (err) return res.status(500).send(stderr);
    res.send(stdout);
  });
});

// Auth: insecure JWT handling and weak hashing
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === md5(password));
  if (!user) return res.status(401).send('Invalid');
  const token = jwt.sign({ sub: user.id }, SECRET); // insecure hardcoded secret
  res.json({ token });
});

// Insecure product search (no sanitization)
app.get('/products/search', (req, res) => {
  const { q } = req.query || '';
  // pretend we call DB with a string query - potential injection example
  res.json({ message: `Searched for: ${q}`, results: [] });
});

// Insecure route that uses MongoDB native driver but no parameterization
app.get('/admin/dbcount', (req, res) => {
  // intentionally uses old mongodb driver import (dep is old)
  const MongoClient = require('mongodb').MongoClient;
  const url = 'mongodb://root:password@localhost:27017';
  MongoClient.connect(url, function(err, client) {
    if (err) return res.status(500).send('db err');
    const db = client.db('shop');
    db.collection('orders').count({}, (err, cnt) => {
      client.close();
      res.json({ count: cnt });
    });
  });
});

app.get('/', (req, res) => {
  res.send('E-commerce backend (demo insecure) running');
});

app.listen(3000, () => console.log('listening on 3000'));
