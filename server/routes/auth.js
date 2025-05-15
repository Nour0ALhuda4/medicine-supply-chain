const express = require("express"); // استدعاء مكتبة express لإنشاء الراوتر
const router = express.Router(); // إنشاء راوتر جديد للتعامل مع المسارات
const bcryptjs = require("bcryptjs"); // استدعاء مكتبة bcryptjs لتشفير كلمات السر
const jwt = require("jsonwebtoken"); // استدعاء مكتبة jwt لإنشاء والتحقق من التوكنات
const pool = require("../models/db"); // استدعاء الاتصال بقاعدة البيانات
const { jwtSecret } = require("../middleware/auth"); // استدعاء المفتاح السري المستخدم لتشفير التوكنات
   
// Register a new user
router.post("/register", async (req, res) => { // إنشاء مسار لتسجيل مستخدم جديد
    try {
        const { username, password } = req.body; // أخذ اسم المستخدم وكلمة السر من الطلب

        // Check if username already exists
        const findUserQuery = "SELECT * FROM users WHERE username = $1"; // استعلام عن وجود اسم مستخدم في قاعدة البيانات
        const result = await pool.query(findUserQuery, [username]); // تنفيذ الاستعلام

        if (result.rows.length > 0) { // إذا كان موجود، نرجع رسالة خطأ
            return res.status(400).send("Username already exists!");
        }

        // Hash the password
        const hashedPassword = await bcryptjs.hash(password, 10); // تشفير كلمة السر

        // Insert new user into the database using hashed_password column
        const insertUserQuery = "INSERT INTO users (username, hashed_password) VALUES ($1, $2) RETURNING *"; // استعلام لإدخال المستخدم الجديد مع كلمة السر المشفرة
        await pool.query(insertUserQuery, [username, hashedPassword]); // تنفيذ الاستعلام

        res.status(201).send("Registered successfully!"); // رجع رسالة نجاح التسجيل
    } catch (err) {
        console.error(err); // طباعة الخطأ إذا حدث
        res.status(500).send({ message: err.message }); // رجع رسالة خطأ
    }
});

// User login
router.post("/login", async (req, res) => { // إنشاء مسار لتسجيل الدخول
    try {
        const { username, password } = req.body; // أخذ اسم المستخدم وكلمة السر من الطلب

        // Check if the user exists by username
        const findUserQuery = "SELECT * FROM users WHERE username = $1"; // استعلام للبحث عن المستخدم في قاعدة البيانات
        const result = await pool.query(findUserQuery, [username]); // تنفيذ الاستعلام

        if (result.rows.length === 0) { // إذا ما لاقى المستخدم، رجع رسالة خطأ
            return res.status(400).send("Wrong username or password!");
        }

        const findUser = result.rows[0]; // جلب بيانات المستخدم من قاعدة البيانات

        // Compare the password with hashed_password from database
        const passwordMatch = await bcryptjs.compare(password, findUser.hashed_password); // مقارنة كلمة السر المدخلة مع المشفرة المخزنة في قاعدة البيانات
        if (passwordMatch) { // إذا تطابقوا
            // Create a JWT token with a payload
            const token = jwt.sign( // إنشاء توكن JWT
                { id: findUser.id, username: findUser.username }, // البيانات اللي رح تكون بالتوكن
                jwtSecret, // المفتاح السري لتشفير التوكن
                { expiresIn: "1d" } // مدة صلاحية التوكن (يوم واحد)
            );

            // Set the token in both HTTP-only cookie and response body
            res.cookie("token", token, { httpOnly: true, maxAge: 86400000 }); // تعيين التوكن كـ cookie محمي
            return res.status(200).json({
                message: `Logged in successfully! Welcome, ${findUser.username}`, // رسالة نجاح الدخول
                token: token // التوكن اللي تم إنشاؤه
            });
        } else { // إذا ما تطابقت كلمة السر
            return res.status(400).send("Wrong username or password!"); // رجع رسالة خطأ
        }
    } catch (err) {
        console.error(err.message); // طباعة الخطأ إذا حدث
        res.status(500).send({ message: err.message }); // رجع رسالة خطأ
    }
});

// Logout endpoint
router.post("/logout", (req, res) => { // إنشاء مسار لتسجيل الخروج
    res.clearCookie("token"); // حذف التوكن المخزن في الكوكي
    res.send("Logged out successfully!"); // رجع رسالة نجاح الخروج
});

module.exports = router; // تصدير الراوتر لاستخدامه في ملفات ثانية
