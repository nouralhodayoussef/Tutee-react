const express = require('express');
const cors = require('cors');
const session = require('express-session');
const loginRoute = require('./routes/login');
const findCourseRoute = require('./routes/findcourse');
const tuteeHomeRoute = require('./routes/tuteehome');
const tuteeInfoRoute = require('./routes/tuteeinfo');
const meRoute = require('./routes/me');
const tutorProfileRoute = require('./routes/tutorprofile');
const filterCourseRoutes = require('./routes/filtercourse'); // ✅ only this
const changePasswordRoute = require('./routes/changepassword');
const dropdownInfoRoute = require('./routes/dropdowninfo');
const forgotPasswordRoute = require('./routes/forgotpassword');
require('dotenv').config();

const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Mount routes
app.use('/login', loginRoute);
app.use('/findcourse', findCourseRoute);         
app.use('/findcourse', filterCourseRoutes);      
app.use('/tutee/home', tuteeHomeRoute);
app.use('/tutee/info', tuteeInfoRoute);
app.use('/tutee/tutor-profile', tutorProfileRoute);
app.use('/me', meRoute);
app.use('/dropdowninfo', dropdownInfoRoute);
app.use('/change-password', changePasswordRoute);
app.use('/forgot-password', forgotPasswordRoute);
const PORT = 4000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
