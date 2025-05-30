const express = require("express");
const cors = require("cors");
const session = require("express-session");
const http = require("http");
const setupSocket = require("./signaling/socket");
const transporter = require("./config/email");
require("dotenv").config();
const db = require("./config/db");
const cron = require("node-cron");
// Route imports

//Admin Api
const allTutors = require("./routes/admin/all-tutors");
const allTutees = require("./routes/admin/all-tutees");
const deleteTutorRoute = require("./routes/admin/delete-tutor");
const deleteTuteeRoute = require("./routes/admin/delete-tutee");

const loginRoute = require("./routes/login");
const sendOtp = require("./routes/sendotp");
const registerUser = require("./routes/registeruser");
const checkEmailRoute = require("./routes/check-email");
const registerOptions = require("./routes/register-options");
const verifyOtpRoute = require("./routes/verify-otp");
const tutorEditProfile = require("./routes/tutoreditprofile");
const findTutor = require("./routes/findtutor");
const uploadProfilePhotoRoute = require("./routes/upload-profile-photo");
const updateTutor = require("./routes/update-tutor");
const checkTutorProfileRoute = require("./routes/check-tutor-profile");
const checkTutorAvailabilityRoute = require("./routes/check-tutor-availability");
const deletePhotoRoute = require("./routes/delete-photo");
const addSkillRoute = require("./routes/add-skills");
const addCustomSkillRoute = require("./routes/add-custom-skill");
const removeSkillRoute = require("./routes/remove-skills");
const allSkillsRoute = require("./routes/skills");
const getTutorCourses = require("./routes/get-tutor-courses");
const addCourseToTutor = require("./routes/add-course-to-tutor");
const createNewCourse = require("./routes/create-new-course");
const removeCourseFromTutor = require("./routes/remove-course-from-tutor");
const cancelSessionRoute = require("./routes/cancel-session");
const notifyTutorWhenBooked = require("./routes/notify-tutor-when-booked");
const findCourseRoute = require("./routes/findcourse");
const tuteeHomeRoute = require("./routes/tuteehome");
const tuteeInfoRoute = require("./routes/tuteeinfo");
const meRoute = require("./routes/me");
const tutorProfileRoute = require("./routes/tutorprofile");
const filterCourseRoutes = require("./routes/filtercourse");
const uploadRoute = require("./routes/upload");
const requestSessionRoute = require("./routes/requestsession");
const tutorRoutes = require("./routes/tutorhome");
const changePasswordRoute = require("./routes/changepassword");
const dropdownInfoRoute = require("./routes/dropdowninfo");
const logoutRoute = require("./routes/logout");
const tutorRequestsRoutes = require("./routes/tutorrequests");
const updateTuteeRoute = require("./routes/update-tutee");
const respondSessionRoute = require("./routes/respond-session");
const tutorAvailabilityRoute = require("./routes/tutoravailability");
const scheduleSessionRoute = require("./routes/schedule-session");
const tutorBookedSessions = require("./routes/tutor/bookedSessions");
const tuteeBookedSessionsRoute = require("./routes/tutee-booked-sessions");
const addCourseToTutorRoute = require("./routes/add-course-to-tutor");
const sessionRoute = require("./routes/session");
const visitorTutors = require("./routes/visitor/visitorTutors");
const feedbackRoute = require("./routes/visitor/feedback");
const checkScheduleConflicts = require("./routes/tutor/check-schedule-conflicts");
const cancelSessionsAndRemoveAvailability = require("./routes/tutor/cancel-sessions-and-remove-availability");

//Routes for forget-password
const forgotPasswordRoute = require("./routes/forget-password/forgotpassword");
const verifyResetOtpRoute = require("./routes/forget-password/verify-reset-otp");
const resetPasswordFinalRoute = require("./routes/forget-password/reset-password-final");

//admin
const adminSummaryCards = require("./routes/admin/summary-cards");
const adminUserGrowth = require("./routes/admin/user-growth");
const adminSessionStatus = require("./routes/admin/session-status");
const adminTopTutors = require("./routes/admin/top-tutors");
const sessionsByUniversity = require("./routes/admin/sessions-by-university");
const activeUsersRoute = require("./routes/admin/active-users");
const repeatBookingRateRoute = require("./routes/admin/repeat-booking-rate");
const unratedSessionsRoute = require("./routes/admin/unrated-sessions");
const cancellationReasonsRoute = require("./routes/admin/cancellation-reasons");
const sessionsExplorerRoute = require("./routes/admin/sessions-explorer");

const app = express();
const server = http.createServer(app);

// CORS for frontend dev
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// JSON + URL parsing
app.use((req, res, next) => {
  const isMultipart = req.headers["content-type"]?.startsWith(
    "multipart/form-data"
  );
  if (isMultipart) return next();
  express.json()(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // ✅ required for local http
      sameSite: "lax", // ✅ needed for cookie to persist across localhost:3000 → localhost:4000
      httpOnly: true, // (optional but good for security)
    },
  })
);

// Route mounting

app.use("/api/admin/all-tutors", allTutors);
app.use("/api/admin/all-tutees", allTutees);
app.use("/api/admin", deleteTutorRoute);
app.use("/api/admin", deleteTuteeRoute);

app.use("/api/admin", require("./routes/admin/universities"));
app.use("/api/admin", require("./routes/admin/majors"));
app.use("/api/admin", require("./routes/admin/courses"));
app.use("/api/admin", require("./routes/admin/update-course"));

app.use("/admin/upload-profile", require("./routes/admin/upload-profile"));
app.use("/admin/info", require("./routes/admin/info"));

app.use("/login", loginRoute);
app.use("/check-session", require("./routes/security/check-session"));
// app.use('/check-username', checkUser);//useless for now
app.use("/send-otp", sendOtp);
app.use("/register-user", registerUser);
app.use("/check-email", checkEmailRoute);
app.use("/register", registerOptions);
app.use("/verify-otp", verifyOtpRoute);
app.use("/tutoreditprofile", tutorEditProfile);
app.use("/upload-profile-photo", uploadProfilePhotoRoute);
app.use("/delete-photo", deletePhotoRoute);
app.use("/update-tutor", updateTutor);
app.use("/tutors", findTutor);
app.use("/check-tutor-profile", checkTutorProfileRoute);
app.use("/check-tutor-availability", checkTutorAvailabilityRoute);
app.use("/notify-tutor-when-booked", notifyTutorWhenBooked);
app.use("/add-course-to-tutor", addCourseToTutorRoute);
app.use("/add-skills", addSkillRoute);
app.use("/add-custom-skill", addCustomSkillRoute);
app.use("/remove-skills", removeSkillRoute);
app.use("/skills", allSkillsRoute);
app.use("/remove-courses-from-tutor", removeCourseFromTutor);
app.use("/cancel-session", cancelSessionRoute);
app.use("/add-new-course", require("./routes/add-new-course"));
app.use("/get-filtered-courses", require("./routes/get-filtered-courses"));
app.use("/tutor/courses", getTutorCourses);
app.use("/tutor/add-course", addCourseToTutor);
app.use("/tutor/create-course", createNewCourse);
app.use("/tutor/remove-course", removeCourseFromTutor);
app.use("/get-tutor-courses", getTutorCourses);
app.use("/findcourse", findCourseRoute);
app.use("/findcourse", filterCourseRoutes);
app.use("/tutee/home", tuteeHomeRoute);
app.use("/tutee/info", tuteeInfoRoute);
app.use("/tutee/tutor-profile", tutorProfileRoute);
app.use("/me", meRoute);
app.use("/upload", uploadRoute);
app.use("/request-session", requestSessionRoute);
app.use("/tutor", tutorRoutes); // ✅ general tutor routes
app.use("/tutor/availability", tutorAvailabilityRoute);
app.use("/tutor/requests", tutorRequestsRoutes);
app.use("/tutor/respond-session", respondSessionRoute);
app.use("/dropdowninfo", dropdownInfoRoute);
app.use("/change-password", changePasswordRoute);
app.use("/logout", logoutRoute);
app.use("/update-tutee", updateTuteeRoute);
app.use("/schedule-session", scheduleSessionRoute);
app.use("/tutor/booked-sessions", tutorBookedSessions);
app.use("/tutee/booked-sessions", tuteeBookedSessionsRoute);
app.use("/session", sessionRoute);
app.use("/api/visitor", visitorTutors);
app.use("/api/visitor", feedbackRoute);
app.use("/tutor/check-schedule-conflicts", checkScheduleConflicts);
app.use(
  "/tutor/cancel-sessions-and-remove-availability",
  cancelSessionsAndRemoveAvailability
);
app.use(
  "/tutee/completed-sessions",
  require("./routes/tutee/completed-sessions")
);
app.use("/tutee/rate-tutor", require("./routes/tutee/rate-tutor"));
app.use(
  "/tutee/cancelled-sessions",
  require("./routes/tutee/cancelled-sessions")
);
app.use(
  "/tutor/completed-sessions",
  require("./routes/tutor/completed-sessions")
);
app.use("/tutor/rate-tutee", require("./routes/tutor/rate-tutee"));
app.use(
  "/tutor/cancelled-sessions",
  require("./routes/tutor/cancelled-sessions")
);

// Routes for forget-password
app.use("/forgot-password", forgotPasswordRoute);
app.use("/verify-reset-otp", verifyResetOtpRoute);
app.use("/reset-password-final", resetPasswordFinalRoute);

//admin
app.use("/api/admin/summary-cards", adminSummaryCards);
app.use("/api/admin/user-growth", adminUserGrowth);
app.use("/api/admin/session-status", adminSessionStatus);
app.use("/api/admin/top-tutors", adminTopTutors);
app.use("/api/admin/sessions-by-university", sessionsByUniversity);
app.use("/api/admin/active-users", activeUsersRoute);
app.use("/api/admin/repeat-booking-rate", repeatBookingRateRoute);
app.use("/api/admin/unrated-sessions", unratedSessionsRoute);
app.use("/api/admin/cancellation-reasons", cancellationReasonsRoute);
app.use("/api/admin", require("./routes/admin/feedback"));
app.use("/api/admin/sessions-explorer", sessionsExplorerRoute);

// Sockets
setupSocket(server);

// Start server
async function setupMySQLEventScheduler() {
  try {
    // Enable event scheduler (if not already)
    await db.promise().query("SET GLOBAL event_scheduler = ON");
    // Create event to auto-complete sessions (edit query to fit your schema)
    await db.promise().query(`
      CREATE EVENT IF NOT EXISTS auto_complete_sessions
      ON SCHEDULE EVERY 10 MINUTE
      DO
        UPDATE scheduled_sessions ss
        JOIN session_slots sl ON ss.slot_id = sl.id
        SET ss.status = 'completed'
        WHERE ss.status = 'scheduled'
          AND DATE_ADD(CONCAT(ss.scheduled_date, ' ', sl.slot_time), INTERVAL sl.duration_minutes MINUTE) < NOW()
    `);
    console.log(
      "✅ MySQL event scheduler is enabled and auto-complete event set up"
    );
  } catch (err) {
    console.error("❌ Error setting up MySQL event scheduler:", err);
  }
}

// Call the setup BEFORE starting the server
setupMySQLEventScheduler();

const PORT = 4000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

// === Cron Job: Run every hour ===

cron.schedule("0 * * * *", async () => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        ss.id,
        ss.scheduled_date,
        sl.slot_time,
        c.course_name,
        t.first_name AS tutee_first,
        t.last_name AS tutee_last,
        tut.first_name AS tutor_first,
        tut.last_name AS tutor_last,
        u1.email AS tutee_email,
        u2.email AS tutor_email
      FROM scheduled_sessions ss
      JOIN session_slots sl ON ss.slot_id = sl.id
      JOIN courses c ON ss.course_id = c.id
      JOIN tutees t ON ss.tutee_id = t.id
      JOIN users u1 ON t.user_id = u1.id
      JOIN tutors tut ON ss.tutor_id = tut.id
      JOIN users u2 ON tut.user_id = u2.id
      WHERE ss.status = 'scheduled'
        AND ss.scheduled_date = CURDATE()
    `);

    const lebanonNow = new Date(); // ✅ Use local system time

    for (const session of rows) {
      const dateOnly =
        session.scheduled_date.getFullYear() +
        "-" +
        String(session.scheduled_date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(session.scheduled_date.getDate()).padStart(2, "0");

      const slotTimeStr = session.slot_time?.toString().padStart(8, "0");
      const dateTimeStr = `${dateOnly}T${slotTimeStr}`;
      const sessionTime = new Date(dateTimeStr);

      if (isNaN(sessionTime.getTime())) {
        console.warn(
          `⚠️ Invalid session time for session ID ${session.id}:`,
          dateTimeStr
        );
        continue;
      }

      const diffMinutes =
        (sessionTime.getTime() - lebanonNow.getTime()) / (60 * 1000);

      console.log(
        `🕒 Lebanon Now: ${lebanonNow.toLocaleString()}, Session: ${sessionTime.toLocaleString()}, Diff: ${diffMinutes.toFixed(
          2
        )} min`
      );

      if (diffMinutes >= 50 && diffMinutes <= 60) {
        console.log(`📨 Sending reminder for session ID ${session.id}`);

        // Email to Tutee
        await transporter.sendMail({
          from: `"Tutee Team" <${process.env.EMAIL_USER}>`,
          to: session.tutee_email,
          subject: "⏰ Reminder: Your Upcoming Tutee Session",
          text: `Dear ${session.tutee_first} ${session.tutee_last},

Your online session for the course "${session.course_name}" with ${session.tutor_first} ${session.tutor_last} is starting soon (in about 1 hour).

This is just a friendly reminder so you don't miss the chance!

Tutee Team`,
        });

        // Email to Tutor
        await transporter.sendMail({
         from: `"Tutee Team" <${process.env.EMAIL_USER}>`,
          to: session.tutor_email,
          subject: "⏰ Reminder: Your Upcoming Tutee Session",
          text: `Dear ${session.tutor_first} ${session.tutor_last},

Your online session for the course "${session.course_name}" with ${session.tutee_first} ${session.tutee_last} is starting soon (in about 1 hour).

This is just a friendly reminder so you don't miss the chance!

Tutee Team`,
        });
      }
    }
  } catch (err) {
    console.error("❌ Reminder job error:", err);
  }
});
