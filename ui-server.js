const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from repo root (so pair.html, any css/js are available)
app.use(express.static(path.join(__dirname)));

// Mount your existing router at /code so pair.js's router.get('/', ...) becomes /code
try {
  const pairRouter = require('./pair');
  app.use('/code', pairRouter);
} catch (err) {
  console.warn('Warning: pair.js not found or failed to load. /code will 404.', err.message);
}

// Serve pair.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pair.html'));
});

app.listen(PORT, () => {
  console.log(`UI server listening on http://localhost:${PORT}`);
});
