const express = require('express');
const cors = require('cors');
const session = require('express-session');
const http = require('http');
const setupSocket = require('./signaling/socket');
require('dotenv').config();

// Route imports
const loginRoute = require('./routes/login');
// const checkUser = require('./routes/check-username'); // useless for now
const sendOtp = require('./routes/sendotp')
const registerUser = require('./routes/registeruser');
const checkEmailRoute = require('./routes/check-email');
const registerOptions = require('./routes/register-options');
const verifyOtpRoute = require('./routes/verify-otp');
const tutorEditProfile = require('./routes/tutoreditprofile');
const updateTutor = require('./routes/update-tutor');
const checkTutorProfileRoute = require('./routes/check-tutor-profile');
const checkTutorAvailabilityRoute = require('./routes/check-tutor-availability');

const addSkillRoute = require('./routes/add-skills');
const removeSkillRoute = require('./routes/remove-skills');
const allSkillsRoute = require('./routes/skills');
const getTutorCourses = require('./routes/get-tutor-courses');
const addCourseToTutor = require('./routes/add-course-to-tutor');
const createNewCourse = require('./routes/create-new-course');
const removeCourseFromTutor = require('./routes/remove-course-from-tutor');

const findCourseRoute = require('./routes/findcourse');
const tuteeHomeRoute = require('./routes/tuteehome');
const tuteeInfoRoute = require('./routes/tuteeinfo');
const meRoute = require('./routes/me');
const tutorProfileRoute = require('./routes/tutorprofile');
const filterCourseRoutes = require('./routes/filtercourse');
const uploadRoute = require('./routes/upload');
const requestSessionRoute = require('./routes/requestsession');
const tutorRoutes = require('./routes/tutorhome');
const changePasswordRoute = require('./routes/changepassword');
const dropdownInfoRoute = require('./routes/dropdowninfo');
const forgotPasswordRoute = require('./routes/forgotpassword');
const logoutRoute = require('./routes/logout');
const tutorRequestsRoutes = require('./routes/tutorrequests');
const updateTuteeRoute = require('./routes/update-tutee');
const respondSessionRoute = require('./routes/respond-session');
const tutorAvailabilityRoute = require('./routes/tutoravailability');
const scheduleSessionRoute = require("./routes/schedule-session");
const tutorBookedSessions = require('./routes/tutor/bookedSessions');
const tuteeBookedSessionsRoute = require('./routes/tutee-booked-sessions');
const addCourseToTutorRoute = require('./routes/add-course-to-tutor');
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
app.use('/check-session', require('./routes/security/check-session'));
// app.use('/check-username', checkUser);//useless for now
app.use('/send-otp', sendOtp);
app.use('/register-user', registerUser);
app.use('/check-email', checkEmailRoute);
app.use('/register', registerOptions);
app.use('/verify-otp', verifyOtpRoute);
app.use('/tutoreditprofile', tutorEditProfile);
app.use('/update-tutor', updateTutor);
app.use('/check-tutor-profile', checkTutorProfileRoute);
app.use('/check-tutor-availability', checkTutorAvailabilityRoute);
app.use('/add-course-to-tutor', addCourseToTutorRoute);
app.use('/add-skills', addSkillRoute);
app.use('/remove-skills', removeSkillRoute);
app.use('/skills', allSkillsRoute);
app.use('/remove-courses-from-tutor', removeCourseFromTutor);
app.use('/add-new-course', require('./routes/add-new-course'));
app.use('/get-filtered-courses', require('./routes/get-filtered-courses'));
app.use('/tutor/courses', getTutorCourses);
app.use('/tutor/add-course', addCourseToTutor);
app.use('/tutor/create-course', createNewCourse);
app.use('/tutor/remove-course', removeCourseFromTutor);
app.use('/get-tutor-courses', getTutorCourses);
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
app.use('/tutee/booked-sessions', tuteeBookedSessionsRoute);

// Sockets
setupSocket(server);

// Start server
const PORT = 4000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
