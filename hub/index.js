const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

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

// Determine the correct public directory
// Server runs from /app, frontend build is at /app/frontend/dist
const possiblePaths = [
  path.join(__dirname, 'frontend/dist'),       // /app/frontend/dist (Nixpacks from root)
  path.join(__dirname, 'backend/public'),      // /app/backend/public (Docker standard)
  '/app/frontend/dist',                        // Absolute path fallback
];

let publicDir = possiblePaths[0];
console.log('Checking for frontend build in the following locations:');
for (const testPath of possiblePaths) {
  const exists = fs.existsSync(testPath);
  console.log(`  ${testPath}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
  if (exists && publicDir === possiblePaths[0]) {
    publicDir = testPath;
  }
}

console.log(`✓ Serving static files from: ${publicDir}`);

// Serve static files from the React app
app.use(express.static(publicDir));

// Helper to list directories
const listDir = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) return `[${dirPath} does not exist]`;
    return JSON.stringify(fs.readdirSync(dirPath), null, 2);
  } catch (e) {
    return `[Error reading ${dirPath}: ${e.message}]`;
  }
};

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error(`Frontend not found at ${indexPath}`);

    // DEBUG INFO
    const debugInfo = `
      <h1>Frontend not found</h1>
      <p>Checked: ${indexPath}</p>
      <p>Current Dir (__dirname): ${__dirname}</p>
      <p>Files in current dir: ${listDir(__dirname)}</p>
      <p>Files in frontend: ${listDir(path.join(__dirname, 'frontend'))}</p>
      <p>Files in frontend/dist: ${listDir(path.join(__dirname, 'frontend/dist'))}</p>
    `;

    res.status(404).send(debugInfo);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server V3 running on port ${PORT}`);
  console.log(`Current directory: ${__dirname}`);
});
