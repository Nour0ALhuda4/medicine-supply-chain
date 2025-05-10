// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract IoTMedicineContract {
    // هيكل لتخزين بيانات حساسات IoT
    struct SensorData {
        uint256 timestamp;  // وقت تسجيل البيانات
        int256 temperature; // درجة الحرارة مضروبة في 100
        uint256 humidity;   // الرطوبة مضروبة في 100
        int256 latitude;    // خط العرض مضروب في 1000000
        int256 longitude;   // خط الطول مضروب في 1000000
    }

    // هيكل لتخزين بيانات الدواء
    struct MedicineData {
        int256 minTemperature;  // الحد الأدنى للحرارة مضروب في 100
        int256 maxTemperature;  // الحد الأقصى للحرارة مضروب في 100
        int256 lastIoTTemperature; // آخر حرارة مأخوذة من IoT مضروبة في 100
        string description;     // وصف الدواء
    }

    // تخزين قراءات IoT حسب التاريخ
    mapping(uint256 => SensorData[]) public dailyReadings;

    // تخزين بيانات الدواء
    MedicineData public medicine;

    // متغير لتخزين وقت آخر قراءة
    uint256 public lastReadingTimestamp;

    // المدة بين القراءات (12 ساعة = 43200 ثانية)
    uint256 public constant READING_INTERVAL = 12 hours;

    // حدث عند إضافة قراءة جديدة من IoT
    event SensorDataAdded(
        uint256 indexed date,
        int256 temperature,
        uint256 humidity,
        int256 latitude,
        int256 longitude
    );

    // دالة لإضافة بيانات الدواء
    function setMedicineData(
        int256 _minTemperature,
        int256 _maxTemperature,
        string memory _description
    ) public {
        medicine = MedicineData({
            minTemperature: _minTemperature,
            maxTemperature: _maxTemperature,
            lastIoTTemperature: medicine.lastIoTTemperature, // يبقى كما هو حتى يتم تحديثه من IoT
            description: _description
        });
    }

    // دالة لإضافة قراءة جديدة من حساسات IoT
    function addSensorData(
        int256 _temperature,
        uint256 _humidity,
        int256 _latitude,
        int256 _longitude
    ) public {
        uint256 timestamp = block.timestamp;
        uint256 date = timestamp / 86400;

        // التحقق من مرور 12 ساعة منذ آخر قراءة
        require(
            lastReadingTimestamp == 0 || (timestamp - lastReadingTimestamp) >= READING_INTERVAL,
            "Must wait 12 hours between readings"
        );

        SensorData memory newData = SensorData({
            timestamp: timestamp,
            temperature: _temperature,
            humidity: _humidity,
            latitude: _latitude,
            longitude: _longitude
        });

        dailyReadings[date].push(newData);

        // تحديث آخر حرارة مأخوذة من IoT في بيانات الدواء
        medicine.lastIoTTemperature = _temperature;

        // تحديث وقت آخر قراءة
        lastReadingTimestamp = timestamp;

        emit SensorDataAdded(date, _temperature, _humidity, _latitude, _longitude);
    }

    // استرجاع جميع القراءات ليوم معين
    function getReadingsForDate(uint256 _date) public view returns (SensorData[] memory) {
        return dailyReadings[_date];
    }

    // استرجاع بيانات الدواء
    function getMedicineData() public view returns (MedicineData memory) {
        return medicine;
    }

    // استرجاع عدد القراءات في يوم معين
    function getReadingsCountForDate(uint256 _date) public view returns (uint256) {
        return dailyReadings[_date].length;
    }
}