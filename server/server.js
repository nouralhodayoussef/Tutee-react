// server/server.js
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const loginRoute = require('./routes/login');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // change to true if using HTTPS
}));

// Routes
app.use('/login', loginRoute);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
