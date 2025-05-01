const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

const logFilePath = path.join(__dirname, 'traffic.log');

// Middleware to log requests
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

// Serve static files from securite-carcereal directory
app.use(express.static(path.join(__dirname, 'securite-carcereal')));

// Endpoint to get logs for admin panel
app.get('/api/logs', (req, res) => {
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
