const express = require('express');
const cors = require('cors');
const session = require('express-session');
const loginRoute = require('./routes/login');
const findCourseRoute = require('./routes/findcourse');
const tuteeHomeRoute = require('./routes/tuteehome');
const tuteeInfoRoute = require('./routes/tuteeinfo');
const meRoute = require('./routes/me');
require('dotenv').config();

const app = express();

// Enable CORS for the frontend
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Change to true if using HTTPS
}));

// Routes
app.use('/login', loginRoute);
app.use('/findcourse', findCourseRoute);
app.use('/tutee/home', tuteeHomeRoute);
app.use('/tutee/info', tuteeInfoRoute);
app.use('/me', meRoute); // ✅ mount the route
const tutorProfileRoute = require('./routes/tutorprofile');
app.use('/tutee/tutor-profile', tutorProfileRoute);



const PORT = 4000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
