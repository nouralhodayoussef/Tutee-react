const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const loginRoute = require('./routes/login');
const findCourseRoute = require('./routes/findcourse');
const tuteeHomeRoute = require('./routes/tuteehome');
const tuteeInfoRoute = require('./routes/tuteeinfo');
const meRoute = require('./routes/me');
const tutorProfileRoute = require('./routes/tutorprofile');
const filterCourseRoutes = require('./routes/filtercourse');
const uploadRoute = require('./routes/upload');
const requestSessionRoute = require('./routes/requestsession');
const tutorRoutes = require('./routes/tutor');
const changePasswordRoute = require('./routes/changepassword');
const dropdownInfoRoute = require('./routes/dropdowninfo');
const forgotPasswordRoute = require('./routes/forgotpassword');
const logoutRoute = require('./routes/logout');
const tutorRequestsRoutes = require('./routes/tutorrequests');
const tutorSelectSlotRoute = require('./routes/tutorselectslot');

const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// ✅ Properly skip JSON body parsing for multipart/form-data
app.use((req, res, next) => {
  const isMultipart = req.headers['content-type']?.startsWith('multipart/form-data');
  if (isMultipart) return next();
  express.json()(req, res, next);
});

// ✅ Required for FormData text fields
app.use(express.urlencoded({ extended: true }));

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
app.use('/upload', uploadRoute);
app.use('/request-session', requestSessionRoute);
app.use('/tutor', tutorRoutes); // ✅ this stays
app.use('/tutor/requests', tutorRequestsRoutes); // ✅ now unique path
app.use('/dropdowninfo', dropdownInfoRoute);
app.use('/change-password', changePasswordRoute);
app.use('/forgot-password', forgotPasswordRoute);
app.use('/logout', logoutRoute);
app.use('/tutor/select-slot', tutorSelectSlotRoute);

const PORT = 4000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
