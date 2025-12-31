// server.js — serves pair.html and pair.js backend
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PAIR_PORT || 3001;

// Serve static frontend
app.use(express.static(path.join(__dirname)));

// Pairing API
const pairRouter = require('./pair'); // your new pair.js
app.use('/api', pairRouter);

app.listen(PORT, () => {
  console.log(`✅ BUGBOT Pairing server running on port ${PORT}`);
  console.log(`👉 Visit http://<your-domain> to pair your WhatsApp`);
});
