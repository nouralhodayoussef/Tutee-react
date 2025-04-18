const express = require('express');
const cors = require('cors');
const session = require('express-session');
const loginRoute = require('./routes/login');
const findCourseRoute = require('./routes/findcourse'); // ✅ added

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
app.use('/findcourse', findCourseRoute); // ✅ added
// ✅ correct path if your file is here: /routes/tuteehome.js
const tuteeHomeRoute = require('./routes/tuteehome');
app.use('/tutee/home', tuteeHomeRoute);


const tuteeInfoRoute = require('./routes/tuteeinfo');
app.use('/tutee/info', tuteeInfoRoute);

// Start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
