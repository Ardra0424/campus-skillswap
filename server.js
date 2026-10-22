const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Serve ALL files from root (css, js, html)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  const dashboardPath = path.join(__dirname, 'dashboard.html');
  if (fs.existsSync(dashboardPath)) {
    res.sendFile(dashboardPath);
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});
app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/register', (req, res) => {
  let users = [];
  if (fs.existsSync('users.json')) {
    try { users = JSON.parse(fs.readFileSync('users.json')); } catch(e) { users = []; }
  }
  users.push(req.body);
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  res.json({ success: true });
});

app.get('/users', (req, res) => {
  if (!fs.existsSync('users.json')) return res.json([]);
  try {
    const users = JSON.parse(fs.readFileSync('users.json'));
    res.json(users);
  } catch(e) { res.json([]); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Running on ' + PORT));
