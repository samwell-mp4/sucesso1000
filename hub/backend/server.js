const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.send('Sucesso1000 Hub Backend is running');
});

// Routes will be imported here
// app.use('/api/auth', authRoutes);
// app.use('/api/robots', robotRoutes);

const path = require('path');

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'public')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
