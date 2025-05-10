#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');

// Use the same environment-aware configuration as db.js
const dbHost = process.env.NODE_ENV === 'production' 
    ? process.env.DB_HOST || 'foodornt-db'
    : 'localhost';

const dbPort = process.env.NODE_ENV === 'production'
    ? process.env.DB_PORT || '5432'
    : process.env.DB_PORT || '5433';

// PostgreSQL connection configuration
const pool = new Pool({
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "2004",
    host: dbHost,
    port: dbPort,
    database: process.env.DB_NAME || "world"
});

// Log connection details
console.log('Migration using connection:', {
    host: dbHost,
    port: dbPort,
    database: process.env.DB_NAME || "world",
    user: process.env.DB_USER || "postgres"
});

// Create migrations table if it doesn't exist
async function initMigrationsTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (err) {
        console.error('Error creating migrations table:', err);
        throw err;
    }
}

// Get list of applied migrations
async function getAppliedMigrations() {
    const result = await pool.query('SELECT name FROM migrations ORDER BY id');
    return result.rows.map(row => row.name);
}

// Get all migration files
async function getMigrationFiles() {
    const files = await fs.readdir(__dirname);
    return files
        .filter(file => file.endsWith('.sql'))
        .sort(); // Ensures migrations run in order (001_, 002_, etc.)
}

// Apply a single migration
async function applyMigration(fileName) {
    console.log(`Applying migration: ${fileName}`);
    const filePath = path.join(__dirname, fileName);
    const sqlContent = await fs.readFile(filePath, 'utf8');

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Apply the migration
        await client.query(sqlContent);
        
        // Record the migration
        await client.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [fileName]
        );
        
        await client.query('COMMIT');
        console.log(`Successfully applied migration: ${fileName}`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error applying migration ${fileName}:`, err);
        throw err;
    } finally {
        client.release();
    }
}

// Main migration function
async function migrate() {
    try {
        await initMigrationsTable();
        
        const applied = await getAppliedMigrations();
        const migrationFiles = await getMigrationFiles();
        
        // Find migrations that haven't been applied
        const pendingMigrations = migrationFiles.filter(file => !applied.includes(file));
        
        if (pendingMigrations.length === 0) {
            console.log('No pending migrations.');
            return;
        }

        console.log('Pending migrations:', pendingMigrations);
        
        // Apply pending migrations in sequence
        for (const migration of pendingMigrations) {
            await applyMigration(migration);
        }
        
        console.log('All migrations applied successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run migrations if this file is executed directly
if (require.main === module) {
    migrate().catch(console.error);
}

module.exports = {
    migrate,
    getAppliedMigrations,
    pool
};