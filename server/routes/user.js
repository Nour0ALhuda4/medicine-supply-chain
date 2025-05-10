const express = require("express"); // استدعاء مكتبة express
const router = express.Router(); // إنشاء راوتر جديد للتعامل مع المسارات
const pool = require("../models/db"); // استدعاء الاتصال بقاعدة البيانات
const { authenticateToken } = require("../middleware/auth"); // استدعاء ميدلوير للتحقق من التوكن

// Get current user info (both /api/user and /api/user/whoami work)
router.get(["/", "/whoami"], authenticateToken, async (req, res) => { // مسار للحصول على بيانات المستخدم الحالي
    try {
        // Get full user data from database
        const result = await pool.query( // استعلام لجلب بيانات المستخدم من قاعدة البيانات
            "SELECT id, username, created_at FROM users WHERE id = $1", // جلب البيانات بناءً على الـ id
            [req.user.id] // استخدام الـ id من التوكن
        );

        if (result.rows.length === 0) { // إذا ما لاقى المستخدم في قاعدة البيانات
            console.log('User not found in database:', req.user.id); // طباعة رسالة خطأ في الكونسول
            return res.status(404).json({ message: "User not found" }); // رجع رسالة خطأ
        }

        console.log('Returning user data for:', req.user.username); // طباعة بيانات المستخدم في الكونسول
        res.json(result.rows[0]); // رجع بيانات المستخدم كـ JSON
    } catch (err) {
        console.error('Error fetching user data:', err); // طباعة الخطأ إذا حدث
        res.status(500).json({ message: "Error fetching user data" }); // رجع رسالة خطأ
    }
});

// Get list of users (protected route)
router.get("/list", authenticateToken, async (req, res) => { // مسار لجلب قائمة المستخدمين
    try {
        const result = await pool.query("SELECT id, username FROM users"); // استعلام لجلب جميع المستخدمين
        res.json(result.rows); // رجع البيانات كـ JSON
    } catch (err) {
        console.error(err); // طباعة الخطأ إذا حدث
        res.status(500).send({ message: err.message }); // رجع رسالة خطأ
    }
});

// Protected route example
router.get("/protected", authenticateToken, (req, res) => { // مسار محمي
    res.send(`This is a protected route. Hello, ${req.user.username}!`); // رجع رسالة مع اسم المستخدم
});

module.exports = router; // تصدير الراوتر لاستخدامه في ملفات ثانية
