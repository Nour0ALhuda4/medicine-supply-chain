const express = require('express'); // استيراد مكتبة Express
const router = express.Router(); // إنشاء راوتر للـ Express
const pool = require('../models/db'); // استيراد الاتصال بقاعدة البيانات
const { authenticateToken } = require('../middleware/auth'); // استيراد الميدل وير للتحقق من التوكن

// ميدل وير لفحص إذا كان المستخدم هو "أدمن"
const isAdmin = async (req, res, next) => {
    console.log('Checking admin status for user:', req.user); // طباعة المستخدم للتحقق من بياناته
    if (req.user && req.user.username === 'admin') { // إذا كان المستخدم "أدمن"
        console.log('Admin access granted'); // تم منح صلاحية الأدمن
        next(); // أكمل تنفيذ الطلب
    } else { // إذا لم يكن المستخدم "أدمن"
        console.log('Admin access denied'); // رفض الوصول
        res.status(403).json({ ok: false, error: 'Admin access required' }); // إرجاع خطأ مع رسالة
    }
};

// Update status for latest shipment (Arduino data) - No auth required
router.post('/latest/status', async (req, res) => { // تحديث حالة آخر شحنة (بيانات أردوينو) بدون مصادقة
    try {
        const { status, temperature, humidity, gps_lat, gps_long } = req.body; // استخراج البيانات المدخلة

        // Get the latest active shipment (not delivered)
        const latestShipment = await pool.query(
            "SELECT id FROM shipments WHERE current_status != 'تم التوصيل' ORDER BY created_at DESC LIMIT 1" // جلب آخر شحنة نشطة لم يتم توصيلها بعد
        );

        if (latestShipment.rows.length === 0) { // إذا لم توجد شحنات نشطة
            return res.status(404).json({
                ok: false,
                error: 'No active shipments found' // إرجاع رسالة خطأ
            });
        }

        const shipmentId = latestShipment.rows[0].id; // أخذ ID آخر شحنة

        // Update shipment status
        await pool.query(
            'UPDATE shipments SET current_status = $1 WHERE id = $2', // تحديث حالة الشحنة
            [status, shipmentId]
        );

        // Create status history entry
        await pool.query(
            'INSERT INTO shipment_status (shipment_id, status, temperature, humidity, gps_lat, gps_long, timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW())', // إضافة حالة جديدة لتاريخ الشحنة
            [shipmentId, status, temperature, humidity, gps_lat, gps_long]
        );

        res.json({
            ok: true,
            data: {
                shipmentId,
                status,
                timestamp: new Date() // إرسال الاستجابة مع البيانات المحدثة
            }
        });

    } catch (error) {
        console.error('Error updating latest shipment status:', error); // طباعة الخطأ في حال حدوثه
        res.status(500).json({
            ok: false,
            error: 'Failed to update shipment status' // إرسال رسالة فشل للمستخدم
        });
    }
});

// البحث عن شحنة باستخدام ID
router.get('/lookup/:id', authenticateToken, async (req, res) => { 
    try {
        const { id } = req.params; // استخراج ID الشحنة من الرابط
        console.log(`Looking up shipment with ID: ${id}`); // طباعة الـ ID في الكونسول

        // استعلام لجلب تفاصيل الشحنة مع آخر حالة لها
        const result = await pool.query(
            `SELECT 
                s.id as shipment_number,
                s.description,
                s.arduino_id,
                u.username as user_name,
                (SELECT ss.timestamp 
                 FROM shipment_status ss 
                 WHERE ss.shipment_id = s.id 
                 ORDER BY ss.timestamp DESC 
                 LIMIT 1) as last_update,
                (SELECT ss.status
                 FROM shipment_status ss
                 WHERE ss.shipment_id = s.id
                 ORDER BY ss.timestamp DESC 
                 LIMIT 1) as current_status
             FROM shipments s 
             JOIN users u ON s.requester = u.id 
             WHERE s.id = $1`,
            [id]
        );

        if (result.rows.length === 0) { // إذا ما كانت الشحنة موجودة
            console.log(`No shipment found with ID: ${id}`); // طباعة أنه ما في شحنة بهذا الـ ID
            return res.status(404).json({ 
                ok: false, 
                error: 'Shipment not found' // إرجاع رسالة خطأ
            });
        }

        console.log('Shipment found:', result.rows[0]); // طباعة تفاصيل الشحنة
        res.json({ 
            ok: true, 
            shipment: result.rows[0] // إرجاع تفاصيل الشحنة في الاستجابة
        });
    } catch (error) {
        console.error('Error looking up shipment:', error); // في حال حدوث خطأ
        res.status(500).json({ 
            ok: false, 
            error: 'Internal server error' // إرجاع رسالة خطأ
        });
    }
});

// أدمن: جلب جميع الشحنات
router.get('/admin/list', authenticateToken, isAdmin, async (req, res) => { 
    try {
        console.log('Admin requesting all shipments'); // طباعة أنه الأدمن يطلب الشحنات
        const result = await pool.query(
            `SELECT 
                s.id as shipment_number,
                s.description,
                s.arduino_id,
                u.username as user_name,
                (SELECT ss.timestamp 
                 FROM shipment_status ss 
                 WHERE ss.shipment_id = s.id 
                 ORDER BY ss.timestamp DESC 
                 LIMIT 1) as last_update,
                (SELECT ss.temperature 
                 FROM shipment_status ss 
                 WHERE ss.shipment_id = s.id 
                 ORDER BY ss.timestamp DESC 
                 LIMIT 1) as temperature,
                (SELECT ss.humidity 
                 FROM shipment_status ss 
                 WHERE ss.shipment_id = s.id 
                 ORDER BY ss.timestamp DESC 
                 LIMIT 1) as humidity,
                (SELECT ss.status
                 FROM shipment_status ss
                 WHERE ss.shipment_id = s.id
                 ORDER BY ss.timestamp DESC 
                 LIMIT 1) as current_status
             FROM shipments s 
             JOIN users u ON s.requester = u.id 
             ORDER BY s.created_at DESC`
        );

        console.log(`Found ${result.rows.length} shipments`); // طباعة عدد الشحنات اللي تم العثور عليها
        console.log('First shipment sample:', result.rows[0]); // طباعة الشحنة الأولى كمثال

        res.json(result.rows); // إرجاع جميع الشحنات في الاستجابة
    } catch (error) {
        console.error('Error fetching all shipments:', error); // في حال حدوث خطأ
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch shipments' // إرجاع رسالة خطأ
        });
    }
});

// أدمن: تحديث حالة الشحنة
router.put('/admin/:id/status', authenticateToken, isAdmin, async (req, res) => { 
    try {
        const { id } = req.params; // استخراج ID الشحنة من الرابط
        const { status } = req.body; // استخراج الحالة الجديدة من جسم الطلب
        console.log(`Admin updating shipment ${id} status to:`, status); // طباعة الحالة الجديدة

        // التحقق إذا كانت الحالة صحيحة
        const validStatuses = ['تم التجهيز', 'تم الشحن', 'في الطريق', 'تم التوصيل'];
        if (!validStatuses.includes(status)) { // إذا كانت الحالة غير صحيحة
            console.log('Invalid status provided:', status); // طباعة الحالة غير الصحيحة
            return res.status(400).json({
                ok: false,
                error: 'Invalid status value' // إرجاع رسالة خطأ
            });
        }

        // تحديث حالة الشحنة
        await pool.query(
            'UPDATE shipments SET current_status = $1 WHERE id = $2',
            [status, id]
        );

        // إضافة سجل لحالة الشحنة
        await pool.query(
            'INSERT INTO shipment_status (shipment_id, status, timestamp) VALUES ($1, $2, NOW())',
            [id, status]
        );

        console.log(`Successfully updated shipment ${id} status`); // طباعة نجاح التحديث
        res.json({
            ok: true,
            message: 'Status updated successfully' // إرجاع رسالة نجاح
        });

    } catch (error) {
        console.error('Error updating shipment status:', error); // في حال حدوث خطأ
        res.status(500).json({
            ok: false,
            error: 'Failed to update shipment status' // إرجاع رسالة خطأ
        });
    }
});

// إنشاء شحنة جديدة
router.post('/', authenticateToken, async (req, res) => {
    try {
        console.log('Creating new shipment with data:', req.body);
        const { description, arduino_id, min_temperature, max_temperature, expected_humidity } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!description) {
            console.log('Validation failed: description is required');
            return res.status(400).json({
                ok: false,
                error: 'الوصف مطلوب'
            });
        }

        if (!arduino_id) {
            console.log('Validation failed: arduino_id is required');
            return res.status(400).json({
                ok: false,
                error: 'معرف الأردوينو مطلوب'
            });
        }

        if (isNaN(min_temperature) || isNaN(max_temperature)) {
            console.log('Validation failed: temperature values are required and must be numbers');
            return res.status(400).json({
                ok: false,
                error: 'درجات الحرارة المطلوبة مطلوبة'
            });
        }

        if (parseFloat(min_temperature) > parseFloat(max_temperature)) {
            console.log('Validation failed: min temperature is greater than max temperature');
            return res.status(400).json({
                ok: false,
                error: 'يجب أن تكون درجة الحرارة الدنيا أقل من درجة الحرارة القصوى'
            });
        }

        if (!expected_humidity || isNaN(expected_humidity) || expected_humidity < 0 || expected_humidity > 100) {
            console.log('Validation failed: expected humidity must be between 0 and 100');
            return res.status(400).json({
                ok: false,
                error: 'يجب أن تكون الرطوبة المتوقعة بين 0 و 100'
            });
        }

        // Create new shipment
        console.log('=== DEBUG: SHIPMENT CREATION ===');
        console.log('Request body:', req.body);      
        console.log('=============================');

        try {
            const result = await pool.query(
                'INSERT INTO shipments (description, requester, arduino_id, min_temperature, max_temperature, expected_humidity, current_status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [description, userId, arduino_id, min_temperature, max_temperature, expected_humidity, 'قيد الانتظار']
            );

            console.log('Inserted shipment:', result.rows[0]);

            res.json({
                ok: true,
                data: {
                    id: result.rows[0].id
                }
            });
        } catch (dbError) {
            console.error('Database error:', dbError);
            throw dbError;
        }
    } catch (error) {
        console.error('Error creating shipment:', error);
        res.status(500).json({
            ok: false,
            error: 'فشل في إنشاء الشحنة',
            details: error.message
        });
    }
});

// Get all shipments for authenticated user  
router.get('/', authenticateToken, async (req, res) => { // جلب جميع الشحنات للمستخدم المعتمد
    try {
        const userId = req.user.id; // أخد الـ ID من المستخدم المعتمد
        console.log('Fetching shipments for user ID:', userId);

        // Get all shipments for user with latest status
        const result = await pool.query(
            `SELECT s.*, u.phone_number, u.username as requester_name,
                    (SELECT ss.timestamp 
                     FROM shipment_status ss 
                     WHERE ss.shipment_id = s.id 
                     ORDER BY ss.timestamp DESC 
                     LIMIT 1) as last_update,
                    (SELECT ss.status
                     FROM shipment_status ss
                     WHERE ss.shipment_id = s.id
                     ORDER BY ss.timestamp DESC
                     LIMIT 1) as latest_status
             FROM shipments s 
             JOIN users u ON s.requester = u.id 
             WHERE s.requester = $1
             ORDER BY s.created_at DESC`, // استعلام لجلب الشحنات مع آخر حالة محدثة
            [userId]
        );

        console.log('Raw database result:', result.rows); // Log the raw database result
        console.log('Number of shipments found:', result.rows.length);

        // Log each shipment's details
        result.rows.forEach((row, index) => {
            console.log(`Shipment ${index + 1}:`, {
                id: row.id,
                description: row.description,
                arduino_id: row.arduino_id,
                current_status: row.latest_status || row.current_status,
                created_at: row.created_at,
                last_update: row.last_update,
                min_temperature: row.min_temperature,
                max_temperature: row.max_temperature,
                requester_name: row.requester_name
            });
        });

        res.json({
            ok: true,
            data: result.rows.map(row => ({ // تجهيز البيانات للاستجابة
                id: row.id,
                description: row.description,
                arduino_id: row.arduino_id,
                current_status: row.latest_status || row.current_status,
                created_at: row.created_at,
                last_update: row.last_update,
                min_temperature: row.min_temperature,
                max_temperature: row.max_temperature
            }))
        });

    } catch (error) {
        console.error('Error fetching user shipments:', error); // طباعة الخطأ في حال حدوثه
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch shipments' // إرسال رسالة فشل للمستخدم
        });
    }
});

// Update shipment status
router.post('/:id/status', authenticateToken, async (req, res) => { // تحديث حالة الشحنة
    try {
        const { id } = req.params; // استخراج ID الشحنة من الـ URL
        const { status, temperature, humidity, gps_lat, gps_long } = req.body; // استخراج بيانات الحالة الجديدة
        const userId = req.user.id; // أخد الـ ID للمستخدم المعتمد

        // Validate status
        const validStatuses = [ // التحقق من أن الحالة المدخلة صالحة
            'pending', 'shipped', 'in_transit', 'delivered',
            'تم التجهيز', 'تم الشحن', 'في الطريق', 'تم التوصيل'
        ];
        if (!validStatuses.includes(status)) { // إذا كانت الحالة غير صالحة
            return res.status(400).json({
                ok: false,
                error: 'Invalid status value' // إرجاع رسالة خطأ
            });
        }

        // Check if shipment exists and belongs to user
        const shipmentCheck = await pool.query(
            'SELECT id FROM shipments WHERE id = $1 AND requester = $2', // التحقق من وجود الشحنة وتطابق الـ ID
            [id, userId]
        );

        if (shipmentCheck.rows.length === 0) { // إذا كانت الشحنة غير موجودة
            return res.status(404).json({
                ok: false,
                error: 'Shipment not found' // إرجاع رسالة خطأ
            });
        }

        // Update shipment status
        await pool.query(
            'UPDATE shipments SET current_status = $1 WHERE id = $2', // تحديث حالة الشحنة
            [status, id]
        );

        // Create status history entry
        await pool.query(
            'INSERT INTO shipment_status (shipment_id, status, temperature, humidity, gps_lat, gps_long, timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW())', // إضافة حالة جديدة في تاريخ الحالة
            [id, status, temperature, humidity, gps_lat, gps_long]
        );

        res.json({
            ok: true,
            data: {
                status,
                timestamp: new Date() // إرسال الاستجابة مع الحالة الجديدة
            }
        });

    } catch (error) {
        console.error('Error updating shipment status:', error); // طباعة الخطأ في حال حدوثه
        res.status(500).json({
            ok: false,
            error: 'Failed to update shipment status' // إرسال رسالة فشل للمستخدم
        });
    }
});

// Get shipment details and status history
router.get('/:id', authenticateToken, async (req, res) => { // جلب تفاصيل الشحنة وتاريخ الحالة
    try {
        console.log('GET /api/shipments/:id - Params:', req.params); // طباعة البيانات الواردة في الـ URL
        console.log('User ID from token:', req.user.id); // طباعة الـ ID للمستخدم المعتمد

        const shipmentId = req.params.id; // استخراج الـ ID للشحنة
        const userId = req.user.id; // أخذ الـ ID للمستخدم

        // Get shipment details
        console.log('Fetching shipment details for:', { shipmentId, userId }); // طباعة بيانات الشحنة التي سيتم جلبها
        const shipmentResult = await pool.query(
            `SELECT s.*, u.phone_number, u.username as requester_name,
                    s.min_temperature, s.max_temperature
             FROM shipments s 
             JOIN users u ON s.requester = u.id 
             WHERE s.id = $1 AND s.requester = $2`, // استعلام لجلب تفاصيل الشحنة
            [shipmentId, userId]
        );

        if (shipmentResult.rows.length === 0) { // إذا لم يتم العثور على الشحنة
            console.log('Shipment not found:', { shipmentId, userId }); // طباعة رسالة خطأ
            return res.status(404).json({
                ok: false,
                error: 'Shipment not found' // إرجاع رسالة خطأ
            });
        }

        const shipment = shipmentResult.rows[0]; // أخذ تفاصيل الشحنة
        console.log('Found shipment:', shipment); // طباعة تفاصيل الشحنة

        // Get status history
        console.log('Fetching status history for shipment:', shipmentId); // طباعة طلب جلب تاريخ الحالة
        const statusResult = await pool.query(
            `SELECT id, status, gps_lat, gps_long, temperature, humidity, timestamp 
             FROM shipment_status 
             WHERE shipment_id = $1 
             ORDER BY timestamp DESC`, // استعلام لجلب تاريخ الحالة
            [shipmentId]
        );

        const statusHistory = statusResult.rows; // أخذ تاريخ الحالة
        console.log('Found status history:', statusHistory); // طباعة تاريخ الحالة

        // Send response
        const response = {
            ok: true,
            data: {
                shipment: {
                    id: shipment.id,
                    description: shipment.description,
                    arduino_id: shipment.arduino_id,
                    current_status: shipment.current_status,
                    created_at: shipment.created_at,
                    phone_number: shipment.phone_number,
                    requester_name: shipment.requester_name,
                    min_temperature: shipment.min_temperature,
                    max_temperature: shipment.max_temperature
                },
                statusHistory: statusHistory
            }
        };
        console.log('Sending response:', response); // طباعة الاستجابة النهائية
        res.json(response); // إرسال الاستجابة للمستخدم

    } catch (error) {
        console.error('Error fetching shipment:', error); // طباعة الخطأ في حال حدوثه
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch shipment data' // إرسال رسالة فشل للمستخدم
        });
    }
});

// Get abnormal readings for a shipment
router.get('/:id/abnormal-readings', authenticateToken, async (req, res) => {
    try {
        const shipmentId = req.params.id;
        
        // Verify the shipment exists and belongs to the user
        const shipment = await pool.query(
            'SELECT id FROM shipments WHERE id = $1 AND requester = $2',
            [shipmentId, req.user.id]
        );
        
        if (shipment.rows.length === 0) {
            return res.status(404).json({
                ok: false,
                error: 'Shipment not found or access denied'
            });
        }
        
        // Get abnormal readings from shipment_status table
        const result = await pool.query(
            `SELECT id, temperature, humidity, gps_lat, gps_long, timestamp 
             FROM shipment_status 
             WHERE shipment_id = $1 
             AND (temperature < (SELECT min_temperature FROM shipments WHERE id = $1)
                  OR temperature > (SELECT max_temperature FROM shipments WHERE id = $1))
             ORDER BY timestamp DESC`,
            [shipmentId]
        );
        
        res.json({
            ok: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching abnormal readings:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch abnormal readings'
        });
    }
});

module.exports = router; // تصدير الـ router لاستخدامه في أماكن أخرى
