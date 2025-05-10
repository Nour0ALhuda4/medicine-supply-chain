const express = require("express");
// هون استدعينا مكتبة express عشان نستخدمها بإنشاء السيرفر والمسارات.

const router = express.Router();
// عملنا راوتر جديد من express عشان نحدد المسارات اللي رح يتعامل معها السيرفر.

const pool = require("../models/db");
// هون استدعينا قاعدة البيانات (PostgreSQL) من ملف الـ db.

// هاي هي المسار اللي بيستقبل البيانات من الأردوينو وبيحدث حالة الشحنة، ما في داعي توثيق.
router.post("/status", async (req, res) => {
  try {
    const { temperature, humidity, gps_lat, gps_long } = req.body;
    // هون أخدنا البيانات اللي وصلت من الأردوينو: حرارة، رطوبة، إحداثيات.

    // التحقق إذا كانت البيانات فيها مشكلة (نجوم بدل القيم الحقيقية).
    if (
      temperature === "*****" ||
      humidity === "*****" ||
      gps_lat === "*****" ||
      gps_long === "*****"
    ) {
      return res.status(400).json({
        ok: false,
        error: "Invalid sensor data", // البيانات غير صالحة
      });
    }

    // نسحب أحدث شحنة مش متم توصيلها (يعني شغالة حالياً)
    const latestShipment = await pool.query(
      "SELECT id, min_temperature, max_temperature FROM shipments WHERE current_status != 'تم التوصيل' ORDER BY created_at DESC LIMIT 1"
    );

    // إذا ما في شحنات حالياً، نرجع خطأ
    if (latestShipment.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "No active shipments found",
      });
    }

    // إذا لقينا شحنة، ناخد رقمها ودرجات الحرارة المتوقعة إلها
    const shipmentId = latestShipment.rows[0].id;
    const minTemperature = parseFloat(latestShipment.rows[0].min_temperature);
    const maxTemperature = parseFloat(latestShipment.rows[0].max_temperature);
    const currentTemperature = parseFloat(temperature);

    // هون بنقارن الحرارة الحالية مع نطاق الحرارة المسموح به
    const isAbnormal = currentTemperature < minTemperature || currentTemperature > maxTemperature;

    // نثبت الحالة كـ "في الطريق" حسب ما الأردوينو بحدد
    const status = "في الطريق";

    // نحدث جدول الشحنات بالحالة والقراءة الغريبة إذا في
    await pool.query(
      "UPDATE shipments SET current_status = $1 WHERE id = $2",
      [status, shipmentId]
    );

    // نضيف سجل بالتاريخ والبيانات الجديدة في جدول حالة الشحنة
    await pool.query(
      "INSERT INTO shipment_status (shipment_id, status, temperature, humidity, gps_lat, gps_long, timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW())",
      [shipmentId, status, temperature, humidity, gps_lat, gps_long]
    );

    // إذا كانت القراءة غير طبيعية، نضيفها إلى جدول القراءات غير الطبيعية
    if (isAbnormal) {
      await pool.query(
        "INSERT INTO abnormal_readings (shipment_id, temperature, humidity, gps_lat, gps_long, min_temperature, max_temperature, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())",
        [shipmentId, temperature, humidity, gps_lat, gps_long, minTemperature, maxTemperature]
      );
      console.log("Abnormal reading saved to database:", {
        temperature,
        minTemperature,
        maxTemperature,
        isAbnormal
      });
    }

    // نرجع رد فيه التفاصيل كلها
    res.json({
      ok: true,
      data: {
        shipmentId,
        status,
        temperature,
        humidity,
        gps_lat,
        gps_long,
        isAbnormal,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    // إذا صار خطأ بأي خطوة، نطبع الخطأ ونرجع رد فشل
    console.error("Error updating shipment status:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to update shipment status",
    });
  }
});

module.exports = router;
// بنصدر الراوتر عشان نستخدمه بالملف الرئيسي تبع السيرفر
