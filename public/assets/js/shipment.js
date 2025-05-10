import { authenticatedFetch } from "/assets/js/utils/api.js";
import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";



// إضافة متغيرات العقد الذكي وMetaMask
const contractAddress = "0x23CB6bc478a5655BF5cd0b624c3a8bD3F24D8436";
const contractABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "date",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "temperature",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "humidity",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "latitude",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "longitude",
        type: "int256",
      },
    ],
    name: "SensorDataAdded",
    type: "event",
  },
  {
    inputs: [],
    name: "READING_INTERVAL",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "int256",
        name: "_temperature",
        type: "int256",
      },
      {
        internalType: "uint256",
        name: "_humidity",
        type: "uint256",
      },
      {
        internalType: "int256",
        name: "_latitude",
        type: "int256",
      },
      {
        internalType: "int256",
        name: "_longitude",
        type: "int256",
      },
    ],
    name: "addSensorData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "dailyReadings",
    outputs: [
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "int256",
        name: "temperature",
        type: "int256",
      },
      {
        internalType: "uint256",
        name: "humidity",
        type: "uint256",
      },
      {
        internalType: "int256",
        name: "latitude",
        type: "int256",
      },
      {
        internalType: "int256",
        name: "longitude",
        type: "int256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMedicineData",
    outputs: [
      {
        components: [
          {
            internalType: "int256",
            name: "minTemperature",
            type: "int256",
          },
          {
            internalType: "int256",
            name: "maxTemperature",
            type: "int256",
          },
          {
            internalType: "int256",
            name: "lastIoTTemperature",
            type: "int256",
          },
          {
            internalType: "string",
            name: "description",
            type: "string",
          },
        ],
        internalType: "struct IoTMedicineContract.MedicineData",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_date",
        type: "uint256",
      },
    ],
    name: "getReadingsCountForDate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_date",
        type: "uint256",
      },
    ],
    name: "getReadingsForDate",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
          {
            internalType: "int256",
            name: "temperature",
            type: "int256",
          },
          {
            internalType: "uint256",
            name: "humidity",
            type: "uint256",
          },
          {
            internalType: "int256",
            name: "latitude",
            type: "int256",
          },
          {
            internalType: "int256",
            name: "longitude",
            type: "int256",
          },
        ],
        internalType: "struct IoTMedicineContract.SensorData[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lastReadingTimestamp",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "medicine",
    outputs: [
      {
        internalType: "int256",
        name: "minTemperature",
        type: "int256",
      },
      {
        internalType: "int256",
        name: "maxTemperature",
        type: "int256",
      },
      {
        internalType: "int256",
        name: "lastIoTTemperature",
        type: "int256",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "int256",
        name: "_minTemperature",
        type: "int256",
      },
      {
        internalType: "int256",
        name: "_maxTemperature",
        type: "int256",
      },
      {
        internalType: "string",
        name: "_description",
        type: "string",
      },
    ],
    name: "setMedicineData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

let contract = null;
let signer = null;
let isMetaMaskConnected = false;

document.addEventListener("DOMContentLoaded", async () => {
  const shipmentForm = document.getElementById("shipmentForm");
  const errorMessage = document.getElementById("error-message");
  const successMessage = document.getElementById("success-message");
  const minTemperature = document.getElementById("minTemperature");
  const maxTemperature = document.getElementById("maxTemperature");

  // إضافة عناصر مؤشر حالة MetaMask
  const metamaskIndicator = document.getElementById("metamask-indicator");
  const metamaskStatusText = document.getElementById("metamask-status-text");

  // تحقق من حالة Ethers.js
  console.log(
    "Ethers.js Status:",
    typeof ethers !== "undefined"
      ? "✅ تم تحميل المكتبة"
      : "❌ فشل تحميل المكتبة"
  );

  // دوال MetaMask
  function checkMetaMaskInstallation() {
    if (typeof window.ethereum === "undefined") {
      showError("يرجى تثبيت MetaMask أولاً!");
      return false;
    }
    return true;
  }

  async function initializeContract() {
    try {
      if (!checkMetaMaskInstallation()) {
        updateMetaMaskStatus(false);
        return false;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error(
          "فشل الاتصال بـ MetaMask. يرجى السماح بالاتصال والمحاولة مرة أخرى."
        );
      }

      const walletAddress = accounts[0];
      console.log("Connected to MetaMask:", walletAddress);

      const provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();

      contract = new ethers.Contract(contractAddress, contractABI, signer);
      console.log("Smart contract initialized");

      updateMetaMaskStatus(true);
      return true;
    } catch (error) {
      console.error("Error initializing contract:", error);
      showError(error.message || "حدث خطأ في الاتصال بـ MetaMask");
      updateMetaMaskStatus(false);
      return false;
    }
  }

  function updateMetaMaskStatus(connected) {
    if (metamaskIndicator && metamaskStatusText) {
      if (connected) {
        metamaskIndicator.classList.remove("status-disconnected");
        metamaskIndicator.classList.add("status-connected");
        metamaskStatusText.textContent = "MetaMask متصل";
        isMetaMaskConnected = true;
      } else {
        metamaskIndicator.classList.remove("status-connected");
        metamaskIndicator.classList.add("status-disconnected");
        metamaskStatusText.textContent = "MetaMask غير متصل";
        isMetaMaskConnected = false;
      }
    } else {
      // تخزين الحالة في حالة عدم وجود العناصر في DOM
      isMetaMaskConnected = connected;
      console.log("MetaMask connection status updated:", connected);
    }
  }

  // محاولة الاتصال بـ MetaMask عند تحميل الصفحة
  try {
    if (checkMetaMaskInstallation()) {
      const accounts = await window.ethereum.request({
        method: "eth_accounts", // هذا لا يطلب الاتصال، فقط يتحقق مما إذا كان متصل بالفعل
      });

      if (accounts && accounts.length > 0) {
        await initializeContract();
      }
    }
  } catch (error) {
    console.error("Initial MetaMask check:", error);
  }

  // الاستماع لتغييرات الحساب
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", async (accounts) => {
      if (accounts.length === 0) {
        updateMetaMaskStatus(false);
      } else {
        await initializeContract();
      }
    });
  }

  // الدوال الموجودة بالفعل
  function validateTemperatureRange() {
    const min = minTemperature?.value;
    const max = maxTemperature?.value;

    if (!min || !max) {
      return true;
    }

    const minNum = parseFloat(min);
    const maxNum = parseFloat(max);

    if (isNaN(minNum) || isNaN(maxNum)) {
      showError("يرجى إدخال درجات حرارة صحيحة");
      return false;
    }

    if (minNum > maxNum) {
      showError("درجة الحرارة الدنيا يجب أن تكون أقل من درجة الحرارة القصوى");
      return false;
    }
    return true;
  }

  minTemperature?.addEventListener("input", validateTemperatureRange);
  maxTemperature?.addEventListener("input", validateTemperatureRange);

  function showError(message) {
    console.log("Showing error:", message);
    errorMessage.textContent = message;
    errorMessage.classList.add("visible");
    setTimeout(() => {
      errorMessage.classList.remove("visible");
    }, 5000);
  }

  function showSuccess(message) {
    console.log("Showing success:", message);
    successMessage.textContent = message;
    successMessage.classList.add("visible");
  }

  function setLoading(isLoading) {
    const submitButton = shipmentForm.querySelector('button[type="submit"]');
    if (isLoading) {
      submitButton.classList.add("loading");
      submitButton.textContent = "جاري الإنشاء...";
    } else {
      submitButton.classList.remove("loading");
      submitButton.textContent = "إنشاء الشحنة";
    }
  }

  // تعديل معالج النموذج ليتضمن MetaMask والبلوكشين
  shipmentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Form submitted");

    // مسح الرسائل السابقة
    errorMessage.classList.remove("visible");
    successMessage.classList.remove("visible");

    // تأكد من اتصال MetaMask أولاً
    if (!isMetaMaskConnected) {
      const connected = await initializeContract();
      if (!connected) {
        showError("يجب الاتصال بـ MetaMask أولاً لإنشاء الشحنة");
        return;
      }
    }

    // الحصول على بيانات النموذج
    const description = shipmentForm.description.value.trim();
    const arduinoId = shipmentForm.arduinoId.value.trim();
    const minTempValue = minTemperature?.value
      ? parseFloat(minTemperature.value)
      : undefined;
    const maxTempValue = maxTemperature?.value
      ? parseFloat(maxTemperature.value)
      : undefined;
    const expectedHumidity = shipmentForm.expected_humidity?.value
      ? parseFloat(shipmentForm.expected_humidity.value)
      : undefined;

    // التحقق الأساسي
    if (!description || !arduinoId) {
      showError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (!minTempValue || !maxTempValue) {
      showError("يرجى إدخال درجات الحرارة المطلوبة");
      return;
    }

    if (isNaN(minTempValue) || isNaN(maxTempValue)) {
      showError("يرجى إدخال درجات حرارة صحيحة");
      return;
    }

    if (!expectedHumidity || isNaN(expectedHumidity)) {
      showError("يرجى إدخال درجة الرطوبة المطلوبة");
      return;
    }

    if (expectedHumidity < 0 || expectedHumidity > 100) {
      showError("درجة الرطوبة يجب أن تكون بين 0 و 100");
      return;
    }

    if (!validateTemperatureRange()) {
      return;
    }

    try {
      setLoading(true);

      // تحويل درجات الحرارة لتنسيق البلوكشين (مضروبة في 10 للتعامل مع الأرقام العشرية)
      const minTempBlockchain = Math.round(minTempValue * 10);
      const maxTempBlockchain = Math.round(maxTempValue * 10);

      // إظهار رسالة المعالجة
      showSuccess("جاري معالجة الطلب على البلوكشين...");

      // استدعاء دالة العقد الذكي لتعيين بيانات الدواء
      const tx = await contract.setMedicineData(
        minTempBlockchain,
        maxTempBlockchain,
        description,
        { gasLimit: 6721975 } // تعيين حد الغاز
      );

      // انتظار تأكيد المعاملة
      showSuccess("جاري تأكيد المعاملة على البلوكشين...");
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      // في حالة نجاح معاملة البلوكشين، إرسال النموذج إلى الخادم الخلفي
      showSuccess("تم تسجيل البيانات على البلوكشين، جاري حفظ الشحنة...");

      const formData = {
        description,
        arduino_id: arduinoId,
        min_temperature: minTempValue,
        max_temperature: maxTempValue,
        expected_humidity: expectedHumidity,
        blockchain_tx: tx.hash, // إضافة رقم المعاملة للتخزين في قاعدة البيانات
      };

      console.log("Sending POST request to /api/shipments");
      console.log("Request body:", JSON.stringify(formData));

      const response = await authenticatedFetch("/api/shipments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(response.error || "حدث خطأ أثناء إنشاء الشحنة");
      }

      // إظهار رسالة النجاح النهائية
      showSuccess("تم إنشاء الشحنة بنجاح وتسجيلها على البلوكشين");

      // إعادة توجيه بعد ثانيتين
      setTimeout(() => {
        if (response.data && response.data.id) {
          window.location.href = `/status?id=${response.data.id}`;
        } else {
          window.location.href = "/templates/shipments.html";
        }
      }, 2000);
    } catch (error) {
      console.error("Error creating shipment:", error);
      showError(error.message || "حدث خطأ أثناء إنشاء الشحنة");
    } finally {
      setLoading(false);
    }
  });
});
