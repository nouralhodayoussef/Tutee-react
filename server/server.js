const express = require('express');
const cors = require('cors');
const session = require('express-session');
const http = require('http');
const setupSocket = require('./signaling/socket');
require('dotenv').config();

// Route imports
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
const updateTuteeRoute = require('./routes/update-tutee');
const respondSessionRoute = require('./routes/respond-session');
const tutorAvailabilityRoute = require('./routes/tutoravailability'); // ✅ stays separate now
const scheduleSessionRoute = require("./routes/schedule-session");
const tutorBookedSessions = require('./routes/tutor/bookedSessions');

const app = express();
const server = http.createServer(app);

// CORS for frontend dev
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// JSON + URL parsing
app.use((req, res, next) => {
  const isMultipart = req.headers['content-type']?.startsWith('multipart/form-data');
  if (isMultipart) return next();
  express.json()(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Route mounting
app.use('/login', loginRoute);
app.use('/findcourse', findCourseRoute);
app.use('/findcourse', filterCourseRoutes);
app.use('/tutee/home', tuteeHomeRoute);
app.use('/tutee/info', tuteeInfoRoute);
app.use('/tutee/tutor-profile', tutorProfileRoute);
app.use('/me', meRoute);
app.use('/upload', uploadRoute);
app.use('/request-session', requestSessionRoute);
app.use('/tutor', tutorRoutes); // ✅ general tutor routes
app.use('/tutor/availability', tutorAvailabilityRoute); // ✅ now scoped and isolated
app.use('/tutor/requests', tutorRequestsRoutes);
app.use('/tutor/respond-session', respondSessionRoute);
app.use('/dropdowninfo', dropdownInfoRoute);
app.use('/change-password', changePasswordRoute);
app.use('/forgot-password', forgotPasswordRoute);
app.use('/logout', logoutRoute);
app.use('/update-tutee', updateTuteeRoute);
app.use("/schedule-session", scheduleSessionRoute);
app.use('/tutor/booked-sessions', tutorBookedSessions);

// Sockets
setupSocket(server);

// Start server
const PORT = 4000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
