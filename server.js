const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

const logFilePath = path.join(__dirname, 'traffic.log');
const adminPassword = 'CCFRSCTGLS';

app.use((req, res, next) => {
  const logEntry = {
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
    datetime: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    userAgent: req.headers['user-agent'] || 'unknown'
  };
  const logLine = JSON.stringify(logEntry) + '\n';
  fs.appendFile(logFilePath, logLine, err => {
    if (err) {
      console.error('Failed to write log:', err);
    }
  });
  next();
});

app.use(express.static(path.join(__dirname, 'securite-carcereal')));

function checkAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication required.');
  }
  const b64auth = auth.split(' ')[1];
  const [user, pass] = Buffer.from(b64auth, 'base64').toString().split(':');
  if (pass === adminPassword) {
    return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
  return res.status(401).send('Authentication required.');
}

app.get('/api/logs', checkAuth, (req, res) => {
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read logs' });
    }
    const logs = data.trim().split('\n').map(line => JSON.parse(line));
    res.json(logs.reverse());
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
