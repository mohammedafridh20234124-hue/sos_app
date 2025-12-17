import express from 'express';

const app = express();
const PORT = 3001;

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

console.log('Starting simple server...');
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server listening on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.close();
});
