const express = require("express"); // استدعاء مكتبة express عشان نستخدمها ببناء السيرفر
const cookieParser = require("cookie-parser"); // استدعاء مكتبة عشان نحلل الـ cookies اللي بتيجي مع الطلبات
const cors = require("cors"); // استدعاء مكتبة عشان نسمح بالطلبات من دومينات مختلفة
const path = require("path"); // استدعاء مكتبة عشان نتعامل مع مسارات الملفات

const authRoutes = require("./routes/auth"); // استدعاء مسارات التوثيق (auth)
const userRoutes = require("./routes/user"); // استدعاء مسارات المستخدمين
const shipmentRoutes = require("./routes/shipments"); // استدعاء مسارات الشحنات
const arduinoRoutes = require("./routes/arduino"); // استدعاء مسارات الأردوينو

const app = express(); // إنشاء تطبيق express
const port = 3000; // تحديد رقم المنفذ اللي السيرفر رح يشتغل عليه

// Middleware
app.use(
  cors({
    origin: true, // السماح للطلبات تجي من أي مكان
    credentials: true, // السماح بإرسال الـ cookies مع الطلبات
  })
);
app.use(express.json()); // استخدام الـ middleware عشان نحلل الـ JSON من الطلبات
app.use(cookieParser()); // استخدام الـ middleware عشان نحلل الـ cookies
app.use(express.static("public")); // تعريف المجلد العام اللي السيرفر رح يخدم منه الملفات الثابتة

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err); // طباعة الخطأ بالكونسول
  res.status(err.status || 500).json({
    ok: false, // إرجاع response إنو في مشكلة
    error: err.message || "Internal Server Error", // رسالة الخطأ اللي رح تنعرض
  });
});

// Routes
app.use("/api/auth", authRoutes); // استخدام مسارات التوثيق
app.use("/api/user", userRoutes); // استخدام مسارات المستخدمين
app.use("/api/shipments", shipmentRoutes); // استخدام مسارات الشحنات
app.use("/api/arduino", arduinoRoutes); // استخدام مسارات الأردوينو

// Clean URLs for auth pages
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/auth/login.html")); // عرض صفحة تسجيل الدخول
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/auth/register.html")); // عرض صفحة التسجيل
});

// Account and related pages
app.get("/account", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/account.html")); // عرض صفحة الحساب
});

app.get("/status", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/status.html")); // عرض صفحة حالة الحساب
});

app.get("/shipments", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/shipments.html")); // عرض صفحة الشحنات
});

app.get("/newShipment", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/newShipment.html")); // عرض صفحة إضافة شحنة جديدة
});

app.get("/shipment-lookup", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/shipment-lookup.html")); // عرض صفحة البحث عن شحنة
});

// Home route (public)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html")); // عرض الصفحة الرئيسية
});

// Handle 404
app.use((req, res) => {
  console.log("404 Not Found:", req.url); // طباعة خطأ 404 بالكونسول
  res.status(404).json({
    ok: false, // إرجاع استجابة إنو في خطأ
    error: "Page not found", // رسالة الخطأ لما الصفحة مش موجودة
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`); // بدء السيرفر وطباعة إنو شغال على المنفذ المحدد
});

module.exports = app; // تصدير التطبيق عشان نقدر نستخدمه بمكان ثاني