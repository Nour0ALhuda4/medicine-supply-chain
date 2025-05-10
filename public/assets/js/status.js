import { authenticatedFetch } from "/assets/js/utils/api.js";

let temperatureChart;
let humidityChart;
let map;
let polyline;
let locationHistory = [];

// Get shipment ID from URL query parameters
function getShipmentId() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  console.log("Got shipment ID from URL:", id);
  return id;
}

// Format date to Arabic locale
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Initialize Chart.js charts
function initializeCharts() {
  Chart.defaults.font.family = "'Cairo', sans-serif";
  Chart.defaults.font.size = 14;
  Chart.defaults.color = "#4b5563";
  Chart.defaults.borderColor = "#e5e7eb";

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#1f2937",
        bodyColor: "#4b5563",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            label += context.parsed.y;
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "minute",
          displayFormats: {
            minute: "HH:mm",
          },
        },
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: "الوقت",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#f3f4f6",
        },
      },
    },
  };

  const temperatureCtx = document
    .getElementById("temperatureChart")
    .getContext("2d");
  temperatureChart = new Chart(temperatureCtx, {
    type: "line",
    data: {
      datasets: [
        {
          label: "درجة الحرارة (°C)",
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#2563eb",
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y: {
          ...commonOptions.scales.y,
          title: {
            display: true,
            text: "درجة الحرارة (°C)",
          },
        },
      },
    },
  });

  const humidityCtx = document.getElementById("humidityChart").getContext("2d");
  humidityChart = new Chart(humidityCtx, {
    type: "line",
    data: {
      datasets: [
        {
          label: "الرطوبة (%)",
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#10b981",
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y: {
          ...commonOptions.scales.y,
          title: {
            display: true,
            text: "الرطوبة (%)",
          },
        },
      },
    },
  });
}

// Initialize Leaflet map
function initializeMap() {
  // Initialize map centered on Jordan 
  map = L.map("map-container").setView([31.9539, 35.9106], 11);


  // Add OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: " OpenStreetMap contributors",
  }).addTo(map);

  // Initialize polyline with brand colors from memory
  polyline = L.polyline([], {
    color: "#4682b4", // Primary color
    weight: 3,
    opacity: 0.8,
    gradient: true,
    gradientColors: ["#a68bd8", "#4682b4"], // Secondary to Primary color gradient
  }).addTo(map);
}

// Update map with new location data
function updateMap(statusHistory) {
  if (!map || !statusHistory || statusHistory.length === 0) return;

  // Extract valid coordinates from status history
  const coordinates = statusHistory
    .filter((status) => status.gps_lat && status.gps_long)
    .map((status) => [status.gps_lat, status.gps_long])
    .reverse(); // Show oldest to newest

  if (coordinates.length === 0) return;

  // Update polyline with new coordinates
  polyline.setLatLngs(coordinates);

  // Clear existing markers
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  // Add marker at current position
  const lastPoint = coordinates[coordinates.length - 1];
  const marker = L.marker(lastPoint).addTo(map);
  marker.bindPopup("الموقع الحالي").openPopup();

  // Fit map to show all points
  map.fitBounds(polyline.getBounds().pad(0.1));
}

// Update charts with new data
function updateCharts(statusHistory) {
  const temperatureData = statusHistory.map((status) => ({
    x: new Date(status.timestamp),
    y: status.temperature,
  }));

  const humidityData = statusHistory.map((status) => ({
    x: new Date(status.timestamp),
    y: status.humidity,
  }));

  temperatureChart.data.datasets[0].data = temperatureData;
  humidityChart.data.datasets[0].data = humidityData;

  temperatureChart.update();
  humidityChart.update();
}

// Create timeline item HTML
function createTimelineItem(status, index, totalStatuses) {
  const statusMap = {
    pending: { text: "تم التجهيز", status: "processed" },
    shipped: { text: "تم الشحن", status: "shipped" },
    in_transit: { text: "في الطريق", status: "enroute" },
    delivered: { text: "تم التوصيل", status: "arrived" },
  };

  const mappedStatus = statusMap[status.status] || {
    text: status.status,
    status: "processed",
  };
  const isCompleted = index > 0;
  const isActive = index === 0;

  return `
        <div class="timeline-item ${isActive ? "active" : ""} ${
    isCompleted ? "completed" : ""
  }" 
             data-status="${mappedStatus.status}"
             style="--timeline-color: ${isCompleted ? "#a68bd8" : "#4682b4"}">
            <div class="timeline-dot ${isActive ? "glow" : ""}"></div>
            <div class="timeline-status" style="text-shadow: 1px 1px 2px rgba(0,0,0,0.2)">${
              mappedStatus.text
            }</div>
            <div class="timeline-date">${formatDate(status.timestamp)}</div>
        </div>
    `;
}

// Create fixed timeline HTML
function createFixedTimeline(currentStatus, statusHistory) {
  const allStatuses = [
    { text: "تم التجهيز", status: "تم التجهيز", icon: "package" },
    { text: "تم الشحن", status: "تم الشحن", icon: "truck" },
    { text: "في الطريق", status: "في الطريق", icon: "route" },
    { text: "تم التوصيل", status: "تم التوصيل", icon: "home" },
  ];

  // Map English statuses to Arabic
  const statusMap = {
    pending: "تم التجهيز",
    shipped: "تم الشحن",
    in_transit: "في الطريق",
    delivered: "تم التوصيل",
  };

  // Convert English status to Arabic if needed
  const arabicStatus = statusMap[currentStatus] || currentStatus;

  // Find current status index
  const currentStatusIndex = allStatuses.findIndex(
    (s) => s.status === arabicStatus
  );

  // Create timeline HTML
  return `
        <div class="timeline">
            ${allStatuses
              .map((statusInfo, index) => {
                const isActive = index === currentStatusIndex;
                const isCompleted = index < currentStatusIndex;
                const statusTimestamp =
                  index === currentStatusIndex && statusHistory.length > 0
                    ? statusHistory[0].timestamp
                    : null;

                return `
                    <div class="timeline-item ${isActive ? "active" : ""} ${
                  isCompleted ? "completed" : ""
                }">
                        <div class="timeline-line ${
                          isCompleted ? "completed" : ""
                        }" style="
                            background: ${
                              isCompleted
                                ? "var(--secondary-color)"
                                : "var(--primary-color)"
                            };
                            ${
                              index < allStatuses.length - 1
                                ? ""
                                : "display: none;"
                            }
                        "></div>
                        <div class="timeline-dot ${
                          isActive ? "glow" : ""
                        }" style="
                            border-color: ${
                              isCompleted
                                ? "var(--secondary-color)"
                                : "var(--primary-color)"
                            };
                            background-color: ${
                              isCompleted || isActive
                                ? isCompleted
                                  ? "var(--secondary-color)"
                                  : "var(--primary-color)"
                                : "white"
                            };
                        ">
                            <i class="fas fa-${statusInfo.icon}"></i>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-status" style="
                                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
                            ">${statusInfo.text}</div>
                            ${
                              statusTimestamp
                                ? `
                                <div class="timeline-date">${formatDate(
                                  statusTimestamp
                                )}</div>
                            `
                                : ""
                            }
                        </div>
                    </div>
                `;
              })
              .join("")}
        </div>
    `;
}

// Update current readings display
function updateCurrentReadings(latestStatus) {
  document.getElementById("currentTemperature").textContent =
    latestStatus.temperature ? `${latestStatus.temperature}°C` : "--";
  document.getElementById("currentHumidity").textContent = latestStatus.humidity
    ? `${latestStatus.humidity}%`
    : "--";
  document.getElementById("currentLocation").textContent =
    latestStatus.gps_lat && latestStatus.gps_long
      ? `${latestStatus.gps_lat}°N, ${latestStatus.gps_long}°E`
      : "--";
}

// Update shipment info display
function updateShipmentInfo(shipment) {
  document.getElementById("shipmentId").textContent= shipment.id;
  document.getElementById("maxTemperature").textContent= shipment.max_temperature;
  document.getElementById("minTemperature").textContent=shipment.min_temperature;
  document.getElementById("shipmentDescription").textContent=shipment.description;
  document.getElementById("arduinoId").textContent = shipment.arduino_id;
  document.getElementById("currentStatus").textContent =
    shipment.current_status;
  document.getElementById("createdAt").textContent = formatDate(
    shipment.created_at
  );
}

// Function to check if a reading is abnormal
function isAbnormalReading(temperature, minTemperature, maxTemperature) {
  if (minTemperature === undefined || maxTemperature === undefined || 
      minTemperature === null || maxTemperature === null) {
    return false; // إذا لم تكن قيم الحرارة المتوقعة موجودة، نرجع false
  }
  return temperature < minTemperature || temperature > maxTemperature;
}

// Function to update abnormal readings table
function updateAbnormalReadingsTable(readings) {
  const table = document.getElementById("filteredReadingsTable");
  const tbody = table.querySelector("tbody") || table.createTBody();
  tbody.innerHTML = ""; // Clear existing rows
  console.log("Abnormal readings:", readings);

  if (readings.length === 0) {
    const row = tbody.insertRow();
    const cell = row.insertCell(0);
    cell.colSpan = 5;
    cell.textContent = "لا توجد قراءات غير طبيعية";
    cell.style.textAlign = "center";
    cell.style.padding = "1rem";
    return;
  }

  readings.forEach((reading) => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = `${reading.temperature}°C`;
    row.insertCell(1).textContent = `${reading.humidity}%`;
    row.insertCell(2).textContent = new Date(
      reading.timestamp
    ).toLocaleDateString("ar-SA");
    row.insertCell(3).textContent = new Date(
      reading.timestamp
    ).toLocaleTimeString("ar-SA");
    row.insertCell(
      4
    ).textContent = `${reading.gps_lat}°N, ${reading.gps_long}°E`;
  });
}

// Load shipment data and update UI
async function loadShipmentData() {
  try {
    const shipmentId = getShipmentId();
    if (!shipmentId) { 
      document.getElementById("error-message").textContent =
        "رقم الشحنة غير صحيح";
      return;
    }

    const response = await authenticatedFetch(`/api/shipments/${shipmentId}`);

    if (!response || !response.ok) {
      throw new Error(response?.error || "Failed to fetch shipment data");
    }

    const { data } = response;
    if (!data || !data.shipment || !data.statusHistory) {
      throw new Error("Invalid response format");
    }

    const { shipment, statusHistory } = data;

    // Log shipment temperature range
    console.log('=== SHIPMENT TEMPERATURE RANGE ===');
    console.log(`Shipment ID: ${shipment.id}`);
    console.log(`Min Temperature: ${shipment.min_temperature}°C`);
    console.log(`Max Temperature: ${shipment.max_temperature}°C`);
    console.log('-----------------------------------');

    // Update shipment info
    updateShipmentInfo(shipment);

    // Update timeline with fixed points
    document.getElementById("timeline").innerHTML = createFixedTimeline(
      shipment.current_status,
      statusHistory
    );

    // Update current readings and visualizations if we have status history
    if (statusHistory && statusHistory.length > 0) {
      updateCurrentReadings(statusHistory[0]); // Most recent status
      updateCharts(statusHistory);
      updateMap(statusHistory);
    }

    // Fetch abnormal readings for this shipment
    const abnormalResponse = await authenticatedFetch(`/api/shipments/${shipmentId}/abnormal-readings`);
    if (abnormalResponse && abnormalResponse.ok && abnormalResponse.data) {
      updateAbnormalReadingsTable(abnormalResponse.data);
    } else {
      console.error("Failed to fetch abnormal readings:", abnormalResponse?.error);
      updateAbnormalReadingsTable([]);
    }
  } catch (error) {
    console.error("Error loading shipment data:", error);
    document.getElementById("error-message").textContent =
      "حدث خطأ أثناء تحميل بيانات الشحنة";
  }
}

// Start polling for updates
function startPolling() {
  // Poll every 5 seconds to match Arduino data frequency
  setInterval(loadShipmentData, 5000);
}

// Modal elements
const modal = document.getElementById("qrModal");
const qrCodeBtn = document.getElementById("qrCodeBtn");
const closeBtn = document.querySelector(".close");
const qrCodeContainer = document.getElementById("qrcode");
const copyQrBtn = document.getElementById("copyQrBtn");
const printQrBtn = document.getElementById("printQrBtn");

// QR Code modal functionality
qrCodeBtn.onclick = function () {
  const shipmentId = getShipmentId();
  if (shipmentId) {
    generateQRCode(shipmentId);
    modal.style.display = "block";
  }
};

closeBtn.onclick = function () {
  modal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

let qrcode = null;
let currentQrUrl = "";

// Generate QR code for shipment ID
function generateQRCode(shipmentId) {
  if (qrcode) {
    qrcode.clear();
    qrcode.makeCode(shipmentId);
    currentQrUrl = shipmentId;
  } else {
    qrcode = new QRCode(document.getElementById("qrcode"), {
      text: shipmentId,
      width: 256,
      height: 256,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });
    currentQrUrl = shipmentId;
  }
}

// Copy QR code URL
document.getElementById("copyQrBtn").onclick = function () {
  navigator.clipboard.writeText(currentQrUrl).then(() => {
    const button = this;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> تم النسخ';
    setTimeout(() => {
      button.innerHTML = originalText;
    }, 2000);
  });
};

// Open print page
printQrBtn.onclick = function () {
  const shipmentId = getShipmentId();
  if (shipmentId) {
    window.open(`/templates/print-qr.html?id=${shipmentId}`, "_blank");
  }
};

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing status page");
  initializeCharts();
  initializeMap();
  loadShipmentData();
  startPolling();
});
