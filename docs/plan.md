Below is a complete plan that covers the project’s architecture, including the frontend (with responsive design), backend integration, and a robust database structure.

---

## 1. Overall Directory & File Structure

```
/project-root
├── /public                   # Static files served to the client
│   ├── /assets
│   │   ├── /css
│   │   │   ├── main.css       # Global styles (including responsive media queries)
│   │   │   ├── auth.css       # Login/Register styles
│   │   │   ├── account.css    # My Account details
│   │   │   ├── shipment.css   # New shipment & shipments tables
│   │   │   └── timeline.css   # Shipment status timeline & time-series view
│   │   ├── /js
│   │   │   ├── main.js        # App entry point & simple router (hash-based)
│   │   │   ├── auth.js        # Login/Register API calls and logic
│   │   │   ├── account.js     # User account management
│   │   │   ├── shipment.js    # New shipment creation, QR code generation
│   │   │   ├── shipments.js   # Display of active and delivered shipments
│   │   │   └── status.js      # Timeline and shipment status history
│   │   ├── /components
│   │   │   ├── header.js      # Reusable header/navigation component
│   │   │   ├── footer.js      # Reusable footer
│   │   │   ├── timeline.js    # Renders the timeline of status updates
│   │   │   └── qrcode.js      # QR code generator (or lightweight library integration)
│   ├── /templates
│   │   ├── login.html         # Login form template
│   │   ├── register.html      # Register form template
│   │   ├── account.html       # My Account view
│   │   ├── newShipment.html   # Form for requesting a new shipment
│   │   ├── shipments.html     # Active shipments & delivered shipments tables
│   │   └── status.html        # Shipment status timeline & time-series view
│   └── index.html             # Landing page (already provided)
│
├── /server                   # Express backend
│   ├── app.js                # Main Express app
│   ├── /routes
│   │   ├── auth.js           # Routes for login & registration (e.g., POST /api/auth/login)
│   │   ├── user.js           # Routes for fetching/updating user details
│   │   └── shipments.js      # Endpoints for creating shipments, updating status, fetching shipments
│   ├── /controllers          # Business logic for auth, user, and shipments
│   ├── /models               # Database connection and query functions (using pg or ORM)
│   └── /middleware           # Authentication (JWT) and error handling middleware
│
├── README.md                # Documentation and setup instructions
```

---

## 2. Frontend – Components, Responsiveness & Integration

### HTML & Templates

- **HTML Templates:**  
  Use separate HTML templates in `/public/templates` for each view (login, register, account, new shipment, shipments, shipment status).
- **Reusable Components:**  
  Define reusable components with `<template>` tags (e.g., shipment cards, timeline items) and clone them using vanilla JS.

### Vanilla JavaScript

- **Routing:**
  Implement a simple hash-based router in `main.js` to load the correct template (e.g., `#/login`, `#/shipments`) into a central container.

- **Utility Functions:**

  - Centralize common functionality in `/assets/js/utils/` directory
  - `api.js`: Authenticated fetch utility with built-in token handling and error management
  - Abstract reusable logic into modular utilities to maintain DRY principles
  - Each utility should be focused, well-documented, and handle edge cases

- **API Integration:**

  - Use modular authenticated fetch utility for all API calls
  - Consistent error handling and authentication management
  - Centralized request/response logging
  - Automatic token management and unauthorized handling

- **QR Code Generation:**
  Use a small, integrated QR code generator in `qrcode.js` to create printable QR codes for each shipment.

### CSS & Responsiveness

- **Global Styles:**  
  Write your `main.css` to include responsive media queries (e.g., using CSS flexbox or grid) to ensure the app looks good on mobile, tablet, and desktop.
- **Component-Level CSS:**  
  Each view gets its own stylesheet (e.g., `auth.css` for auth pages) with responsive adjustments (font sizes, padding, layout tweaks) to support different screen sizes.
- **Print Styles:**  
  Create a dedicated print stylesheet or use `@media print` rules in `shipment.css` to ensure QR codes and shipment details print correctly.

---

## 3. Backend – Express Integration

### Express Server Setup

- **Authentication Endpoints:**
  - `POST /api/auth/register` for new user registration.
  - `POST /api/auth/login` for user login.  
    Use JWT for session management.
- **User Account:**
  - `GET /api/user` for fetching account details.
  - `PUT /api/user` for updating user data.
- **Shipment Endpoints:**
  - `POST /api/shipments`: Create a new shipment (store description, requester, Arduino ID, etc.).
  - `GET /api/shipments`: Retrieve active shipments.
  - `GET /api/shipments/delivered`: Retrieve past/delivered shipments.
  - `GET /api/shipments/:id/status`: Get the timeline and time-series history for a specific shipment.
- **Middleware:**  
  Include error handling and JWT verification middleware to secure routes.

### API Communication

- **CORS/Static Serving:**  
  Either serve the frontend from Express or configure CORS headers if deployed separately.

---

## 4. Database Structure

### 4.1. Users Table

Stores basic user info (login, contact details).

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2. Shipments Table

Holds shipment requests and metadata.

```sql
CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    requester INTEGER REFERENCES users(id),
    arduino_id VARCHAR(50),       -- ID of the connected Arduino unit
    qr_token VARCHAR(255),        -- Token/data for generating a QR code
    current_status VARCHAR(50),   -- Latest status (optional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3. Shipment Status (Time-Series) Table

Logs each status update and sensor readings with optional blockchain-like fields.

```sql
CREATE TABLE shipment_status (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES shipments(id),
    status VARCHAR(50) NOT NULL,  -- e.g., 'Request Created', 'Request Received', 'Delivering', 'Done Delivering'
    gps_lat NUMERIC(10, 6),       -- Optional: latitude reading
    gps_long NUMERIC(10, 6),      -- Optional: longitude reading
    temperature NUMERIC(5, 2),    -- Optional: sensor temperature reading
    humidity NUMERIC(5, 2),       -- Optional: sensor humidity reading
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hash VARCHAR(255),            -- Optional: record hash for blockchain-like integrity
    previous_hash VARCHAR(255)    -- Optional: link to the previous record's hash
);
```

> **Additional Notes:**
>
> - Use indexes (especially on `shipment_id` in `shipment_status`) to speed up queries.
> - Consider TimescaleDB extension for optimized time-series operations if necessary.
> - Always hash passwords using bcrypt (or similar) and secure your endpoints with HTTPS and JWT.

---

## 5. Additional Technical Considerations

- **Security:**
  - Secure password storage using a strong hashing algorithm.
  - Secure API endpoints with JWT-based authentication.
- **Error Handling:**
  - Implement proper error messages and status codes in your Express API.
  - Frontend should show user-friendly error alerts.
- **Responsiveness:**
  - Test across devices using browser dev tools to adjust breakpoints in CSS.
  - Use fluid layouts (flexbox or grid) and media queries to adapt content.
- **Printability:**
  - Design a print stylesheet for QR codes and shipment details to ensure they are printer-friendly.

This plan integrates the frontend template and component structure, backend Express endpoints, and a scalable database structure, all while emphasizing a responsive design for a robust shipment tracking application.
