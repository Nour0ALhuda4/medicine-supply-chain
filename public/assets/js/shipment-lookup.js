// DOM Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const manualTab = document.getElementById('manual-tab');
const scanTab = document.getElementById('scan-tab');
const shipmentIdInput = document.getElementById('shipmentId');
const lookupBtn = document.getElementById('lookupBtn');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const preview = document.getElementById('preview');
const imageUpload = document.getElementById('imageUpload');
const imageCanvas = document.getElementById('imageCanvas');
const ctx = imageCanvas.getContext('2d');

let scanner = null;

// Tab Navigation
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const tabName = button.dataset.tab;
    
    // Update active states
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    button.classList.add('active');
    
    // Show selected tab
    if (tabName === 'manual') {
      manualTab.classList.add('active');
      stopScanner();
    } else {
      scanTab.classList.add('active');
      startScanner();
    }
  });
});

// Manual Lookup
lookupBtn.addEventListener('click', () => {
  const shipmentId = shipmentIdInput.value.trim();
  if (shipmentId) {
    lookupShipment(shipmentId);
  } else {
    showError('الرجاء إدخال رقم الشحنة');
  }
});

// Image Upload Handler
imageUpload.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const image = await loadImage(file);
    const qrCode = await processQRCodeImage(image);
    
    if (qrCode) {
      lookupShipment(qrCode);
    } else {
      showError('لم يتم العثور على رمز QR في الصورة');
    }
  } catch (error) {
    console.error('Image processing error:', error);
    showError('حدث خطأ أثناء معالجة الصورة');
  }
});

// Load image as HTMLImageElement
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Process image for QR code
async function processQRCodeImage(image) {
  // Set canvas size to match image
  imageCanvas.width = image.width;
  imageCanvas.height = image.height;
  
  // Draw image to canvas
  ctx.drawImage(image, 0, 0);
  
  // Get image data for QR code processing
  const imageData = ctx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);
  const code = jsQR(imageData.data, imageCanvas.width, imageCanvas.height);
  
  if (code) {
    return code.data;
  }
  return null;
}

// QR Code Scanner
async function startScanner() {
  try {
    if (!scanner) {
      scanner = new Instascan.Scanner({
        video: preview,
        mirror: false
      });

      scanner.addListener('scan', content => {
        // Extract shipment ID from QR code content
        // Since QR now contains just the ID, we can use it directly
        if (content && content.match(/^[a-zA-Z0-9-]+$/)) {
          lookupShipment(content);
        } else {
          showError('رمز QR غير صالح');
        }
      });
    }

    const cameras = await Instascan.Camera.getCameras();
    if (cameras.length > 0) {
      // Try to use the back camera first
      const backCamera = cameras.find(camera => camera.name.toLowerCase().includes('back'));
      await scanner.start(backCamera || cameras[0]);
    } else {
      showError('لم يتم العثور على كاميرا');
    }
  } catch (error) {
    console.error('Scanner error:', error);
    showError('حدث خطأ أثناء تشغيل الماسح الضوئي');
  }
}

function stopScanner() {
  if (scanner) {
    scanner.stop();
  }
}

async function lookupShipment(shipmentId) {
  showLoading();
  hideError();

  try {
    const response = await fetch(`/api/shipments/lookup/${shipmentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(response.status === 404 ? 'لم يتم العثور على الشحنة' : 'حدث خطأ أثناء البحث');
    }

    // Redirect to status page with query parameter
    window.location.href = `/status?id=${encodeURIComponent(shipmentId)}`;
  } catch (error) {
    console.error('Lookup error:', error);
    showError(error.message);
  } finally {
    hideLoading();
  }
}

function showLoading() {
  loadingElement.classList.remove('hidden');
}

function hideLoading() {
  loadingElement.classList.add('hidden');
}

function showError(message) {
  errorElement.querySelector('p').textContent = message;
  errorElement.classList.remove('hidden');
}

function hideError() {
  errorElement.classList.add('hidden');
}

// Clean up scanner when page is unloaded
window.addEventListener('beforeunload', () => {
  stopScanner();
});
