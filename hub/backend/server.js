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

const fs = require('fs');
const path = require('path');

// Determine the correct public directory
// Check 'public' (Docker/standard) and '../frontend/dist' (Monorepo/Dev)
let publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  const potentialDir = path.join(__dirname, '../frontend/dist');
  if (fs.existsSync(potentialDir)) {
    publicDir = potentialDir;
  }
}

console.log(`Serving static files from: ${publicDir}`);

// Serve static files from the React app
app.use(express.static(publicDir));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error(`Frontend not found at ${indexPath}`);
    res.status(404).send('Frontend application not found. Please ensure it is built.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
