const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Basic health check
app.get('/health', (req, res) => {
  res.send('Sucesso1000 Hub Backend is running');
});

// OpenAI Usage Endpoint
app.get('/api/openai/usage', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    // Calculate start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startTime = Math.floor(startOfMonth.getTime() / 1000);

    // 1. Test Key Validity (Fetch Models)
    try {
      const modelsResponse = await fetch('https://api.openai.com/v1/models?limit=1', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      if (!modelsResponse.ok) {
        throw new Error(`Invalid API Key (Models check failed: ${modelsResponse.status})`);
      }
    } catch (modelError) {
      console.error('Key validation failed:', modelError);
      return res.status(401).json({
        error: 'Invalid API Key',
        details: 'A chave não funcionou nem para listar modelos. Verifique se ela está ativa.'
      });
    }

    // 2. Fetch Usage
    const response = await fetch(`https://api.openai.com/v1/organization/usage/completions?start_time=${startTime}&limit=10`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', errorText);

      if (response.status === 403) {
        return res.status(403).json({
          error: 'Permission Denied',
          details: 'Sua chave funciona para modelos, mas não tem permissão de LEITURA DE USO (Organization Usage). Chaves de Projeto (sk-proj) muitas vezes não têm esse acesso. Tente usar uma chave de Usuário (User Key) ou Admin.'
        });
      }

      throw new Error(`OpenAI API responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching OpenAI usage:', error);
    res.status(500).json({ error: 'Failed to fetch OpenAI usage data', details: error.message });
  }
});

// Webhook Proxy to bypass CORS
app.post('/api/webhook-proxy', async (req, res) => {
  try {
    const targetUrl = 'http://evolution-n8n.o9g2gq.easypanel.host/webhook-test/3f5f1ee0-5f73-4ee5-afbd-20be06985eef';

    console.log('Proxying request to:', targetUrl);

    // Log payload size approximation
    const payloadSize = JSON.stringify(req.body).length;
    console.log(`Payload size: ${(payloadSize / 1024 / 1024).toFixed(2)} MB`);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    // Forward the status code and text/json
    const responseData = await response.text();
    console.log(`Target response status: ${response.status}`);

    if (!response.ok) {
      console.error('Target response body:', responseData);
    }

    res.status(response.status).send(responseData);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Failed to proxy request', details: error.message });
  }
});

// Routes will be imported here
// app.use('/api/auth', authRoutes);
// app.use('/api/robots', robotRoutes);

const fs = require('fs');
const path = require('path');

// Determine the correct public directory
// Deployment structure shows: /app/backend (current dir) and /app/frontend/dist (target)
const possiblePaths = [
  path.join(__dirname, 'public'),              // /app/backend/public (Docker standard)
  path.join(__dirname, '../frontend/dist'),    // /app/frontend/dist (Nixpacks monorepo)
  path.join(__dirname, '../../frontend/dist'), // Fallback
  '/app/frontend/dist',                        // Absolute path (Nixpacks)
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

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
// Helper to list directories
const listDir = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) return `[${dirPath} does not exist]`;
    return JSON.stringify(fs.readdirSync(dirPath), null, 2);
  } catch (e) {
    return `[Error reading ${dirPath}: ${e.message}]`;
  }
};

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
      <p>Files in ../: ${listDir(path.join(__dirname, '../'))}</p>
      <p>Files in ../frontend: ${listDir(path.join(__dirname, '../frontend'))}</p>
      <p>Files in ../frontend/dist: ${listDir(path.join(__dirname, '../frontend/dist'))}</p>
    `;

    res.status(404).send(debugInfo);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server V2 running on port ${PORT}`);
  console.log(`Current directory: ${__dirname}`);
});
