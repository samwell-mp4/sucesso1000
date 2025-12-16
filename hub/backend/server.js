const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/', (req, res) => {
  res.send('Sucesso1000 Hub Backend is running');
});

// Routes will be imported here
// app.use('/api/auth', authRoutes);
// app.use('/api/robots', robotRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
