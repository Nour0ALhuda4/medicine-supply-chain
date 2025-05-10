# Phase 4: Database Structure Checklist

## Database Setup

- [ ] Configure database connection
  - [ ] Set up connection parameters
  - [ ] Implement connection pooling
  - [ ] Test database connectivity

## Users Table

- [ ] Create users table

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

- [ ] Add indexes
  - [ ] Index on username for faster lookups
- [ ] Create triggers
  - [ ] Updated_at timestamp trigger

## Shipments Table

- [ ] Create shipments table

```sql
CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    requester INTEGER REFERENCES users(id),
    arduino_id VARCHAR(50),
    qr_token VARCHAR(255),
    current_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

- [ ] Add indexes
  - [ ] Index on requester for faster user lookups
  - [ ] Index on arduino_id for IoT integration
- [ ] Create triggers
  - [ ] Updated_at timestamp trigger

## Shipment Status Table

- [ ] Create shipment_status table

```sql
CREATE TABLE shipment_status (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES shipments(id),
    status VARCHAR(50) NOT NULL,
    gps_lat NUMERIC(10, 6),
    gps_long NUMERIC(10, 6),
    temperature NUMERIC(5, 2),
    humidity NUMERIC(5, 2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hash VARCHAR(255),
    previous_hash VARCHAR(255)
);
```

- [ ] Add indexes
  - [ ] Index on shipment_id for faster lookups
  - [ ] Index on timestamp for time-series queries
- [ ] Create triggers
  - [ ] Hash generation trigger
  - [ ] Previous hash linking trigger

## Database Optimization

- [ ] Performance tuning
  - [ ] Analyze query patterns
  - [ ] Optimize indexes
  - [ ] Set up query monitoring
- [ ] Consider TimescaleDB
  - [ ] Evaluate time-series requirements
  - [ ] Test TimescaleDB extension
  - [ ] Configure partitioning if needed

## Data Integrity & Security

- [ ] Implement foreign key constraints
  - [ ] Users → Shipments
  - [ ] Shipments → Shipment Status
- [ ] Set up data validation
  - [ ] Check constraints
  - [ ] NOT NULL constraints
- [ ] Security measures
  - [ ] Set up user permissions
  - [ ] Configure backup strategy
  - [ ] Implement audit logging
