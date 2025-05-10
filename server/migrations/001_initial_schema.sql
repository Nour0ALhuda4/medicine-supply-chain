-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add updated_at trigger for users
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index on username for faster lookups
CREATE INDEX idx_users_username ON users(username);

-- Shipments table
CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    requester INTEGER REFERENCES users(id),
    arduino_id VARCHAR(50),
    qr_token VARCHAR(255),
    current_status VARCHAR(50),
    min_temperature NUMERIC(5, 2),
    max_temperature NUMERIC(5, 2),
    expected_humidity NUMERIC(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_requester
        FOREIGN KEY(requester) 
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- Add updated_at trigger for shipments
CREATE TRIGGER update_shipments_updated_at
    BEFORE UPDATE ON shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for shipments
CREATE INDEX idx_shipments_requester ON shipments(requester);
CREATE INDEX idx_shipments_arduino_id ON shipments(arduino_id);
CREATE INDEX idx_shipments_current_status ON shipments(current_status);

-- Shipment Status table
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
    previous_hash VARCHAR(255),
    CONSTRAINT fk_shipment
        FOREIGN KEY(shipment_id) 
        REFERENCES shipments(id)
        ON DELETE CASCADE
);

-- Create indexes for shipment_status
CREATE INDEX idx_shipment_status_shipment_id ON shipment_status(shipment_id);
CREATE INDEX idx_shipment_status_timestamp ON shipment_status(timestamp);
CREATE INDEX idx_shipment_status_status ON shipment_status(status);

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;