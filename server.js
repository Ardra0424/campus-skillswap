const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Serve files from ROOT folder (not public folder)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.post('/register', (req, res) => {
  let users = [];
  if (fs.existsSync('users.json')) {
    users = JSON.parse(fs.readFileSync('users.json'));
  }
  users.push(req.body);
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  res.json({ success: true });
});

app.get('/users', (req, res) => {
  if (!fs.existsSync('users.json')) return res.json([]);
  const users = JSON.parse(fs.readFileSync('users.json'));
  res.json(users);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server running on ' + PORT));
