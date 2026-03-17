require('dotenv').config();
const express = require('express');
const chatRouter = require('./routes/chat');

const app = express();
app.use(express.json());

// API route
app.use('/api/chat', chatRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
