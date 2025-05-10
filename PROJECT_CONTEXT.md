# Pharma Shipment Tracking System

## Current System Overview

- **Purpose**: Track pharmaceutical shipments using Arduino-based IoT devices
- **Hardware Components**:
  - Arduino chip
  - GPS module
  - Temperature & Humidity sensors

## Existing Features

1. Authentication System

2. Shipment Management
   - Creation of shipments
   - Status tracking

3. Monitoring Interface
   - Temperature readings over time
   - Humidity readings over time
   - GPS tracking visualization (polygon map)

4. Historical Data
   - Tables of previous shipments
   - Blockchain-like database structure

5. QR Code Features 
   - QR code generation with copy functionality
   - Print-friendly QR code page
   - Arabic UI with RTL support

## Enhancement Plan

1. QR Code Integration 
   - Add QR code generator on status page
   - Make QR codes printable
   - QR codes link directly to shipment status
   - Added copy URL functionality

2. New Shipment Lookup Page (Next)
   - Redirect third account page button from /status
   - Create new interface for shipment lookup
   - Support both:
     - Manual shipment number entry
     - QR code scanning

## Detailed Implementation Plan

### 1. Backend Changes

1. Add New Route in `/server/routes/shipments.js`:
```javascript
// GET /api/shipments/lookup/:id
// - Validate shipment ID
// - Return shipment details if found
// - Handle not found cases
```

2. Update Database Schema:
- No schema changes needed (using existing shipments table)
- Shipment data already includes:
  - ID (used for QR code)
  - Status history
  - Temperature/Humidity
  - GPS coordinates

### 2. Frontend Implementation

#### 2.1 New Shipment Lookup Page

1. Create Files:
```plaintext
/public/templates/shipment-lookup.html
/public/assets/css/shipment-lookup.css
/public/assets/js/shipment-lookup.js
```

2. HTML Structure:
- RTL layout matching existing design
- Two-tab interface:
  - Manual ID entry
  - QR code scanner
- Error handling UI
- Loading states

3. JavaScript Implementation:
```javascript
// Core features:
- QR code scanning using instascan.js
- Camera access handling
- Input validation
- API integration with /api/shipments/lookup
- Redirect to status page on success
```

4. CSS Styling:
- Match existing RTL design
- Responsive layout
- Camera viewport styling
- Loading/error states

#### 2.2 Status Page QR Code Generation

1. Update Files:
```plaintext
/public/templates/status.html
/public/assets/css/status.css
/public/assets/js/status.js
```

2. Add QR Code Section:
- Generate QR using qrcode.js
- Print-friendly layout
- Shipment details included

3. JavaScript Changes:
```javascript
// New functions:
- generateQRCode(shipmentId)
- setupPrintLayout()
- handleQRCodeDownload()
```

4. CSS Updates:
- QR code container styling
- Print media queries
- Download button styling

#### 2.3 Account Page Update

1. Modify `/public/templates/account.html`:
- Update third button href to "/shipment-lookup"
- Keep existing RTL styling

### 3. Dependencies

1. Add New Libraries:
```json
{
  "dependencies": {
    "qrcode": "^1.5.3",      // QR generation
    "instascan": "^1.0.0"    // QR scanning
  }
}
```

### 4. Testing Plan

1. Unit Tests:
- Shipment lookup route
- QR code generation
- Input validation

2. Integration Tests:
- End-to-end shipment lookup flow
- QR code scan to status page
- Print layout verification

3. Browser Testing:
- RTL layout consistency
- Mobile responsiveness
- Camera access on different devices

### 5. Implementation Order

1. Backend route for shipment lookup
2. QR code generation in status page
3. New shipment lookup page
4. QR code scanning integration
5. Account page button update
6. Testing and refinement

### 6. Security Considerations

1. Input Validation:
- Sanitize shipment ID inputs
- Validate QR code content

2. Rate Limiting:
- Prevent lookup abuse

3. Error Handling:
- Graceful failure modes
- User-friendly error messages

## Implementation Progress

### Completed Features

#### 1. QR Code Integration
1. Added QR code icon to status page header using Font Awesome

2. Implemented QR code generation using qrcode.js CDN

3. Created print-friendly QR code page with Arabic UI

4. Added copy URL functionality with success feedback

5. Styled with RTL support matching existing design

### Next Steps

1. Create shipment lookup page:
   - Create new HTML template
   - Implement QR code scanning
   - Add manual ID entry

2. Update account page navigation

3. Complete testing phase
