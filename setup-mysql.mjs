#!/usr/bin/env node

// ============================================
// MySQL Database Setup Script
// ============================================
// This script creates the sos_db database and notifications table

import mysql from 'mysql2/promise';

async function setupDatabase() {
  try {
    console.log('\n🔧 Setting up MySQL Database...\n');
    
    // Step 1: Connect to MySQL without specifying a database
    console.log('📝 Step 1: Connecting to MySQL...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      // Don't specify database yet - we need to create it first
    });
    console.log('✅ Connected to MySQL\n');
    
    // Step 2: Create the database
    console.log('📝 Step 2: Creating database "sos_db"...');
    try {
      await connection.query('CREATE DATABASE IF NOT EXISTS sos_db');
      console.log('✅ Database "sos_db" created (or already exists)\n');
    } catch (error) {
      console.log('⚠️  Database creation warning:', error.message, '\n');
    }
    
    // Step 3: Select the database
    console.log('📝 Step 3: Selecting database "sos_db"...');
    await connection.query('USE sos_db');
    console.log('✅ Database selected\n');
    
    // Step 4: Create notifications table
    console.log('📝 Step 4: Creating notifications table...');
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        title TEXT,
        message TEXT,
        type VARCHAR(50) DEFAULT 'broadcast',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_read INT DEFAULT 0,
        read_at TIMESTAMP NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    await connection.query(createTableSQL);
    console.log('✅ Table "notifications" created (or already exists)\n');
    
    // Step 5: Create indexes for better query performance
    console.log('📝 Step 5: Creating indexes...');
    try {
      await connection.query('CREATE INDEX IF NOT EXISTS idx_user_id ON notifications(user_id)');
      console.log('   ✅ Index on user_id created');
    } catch (e) {
      console.log('   ⚠️  Index on user_id skipped (may already exist)');
    }
    
    try {
      await connection.query('CREATE INDEX IF NOT EXISTS idx_type ON notifications(type)');
      console.log('   ✅ Index on type created');
    } catch (e) {
      console.log('   ⚠️  Index on type skipped (may already exist)');
    }
    
    try {
      await connection.query('CREATE INDEX IF NOT EXISTS idx_created_at ON notifications(created_at)');
      console.log('   ✅ Index on created_at created');
    } catch (e) {
      console.log('   ⚠️  Index on created_at skipped (may already exist)');
    }
    
    try {
      await connection.query('CREATE INDEX IF NOT EXISTS idx_user_type ON notifications(user_id, type)');
      console.log('   ✅ Index on user_id + type created\n');
    } catch (e) {
      console.log('   ⚠️  Index on user_id + type skipped (may already exist)\n');
    }
    
    // Step 6: Verify table structure
    console.log('📝 Step 6: Verifying table structure...');
    const [columns] = await connection.query('DESCRIBE notifications');
    console.log('✅ Table structure:');
    columns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });
    console.log();
    
    // Step 7: Count existing records
    console.log('📝 Step 7: Checking existing data...');
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM notifications');
    const recordCount = rows[0].count;
    console.log(`✅ Notifications table contains ${recordCount} records\n`);
    
    // Close connection
    await connection.end();
    
    // Success!
    console.log('═══════════════════════════════════════════');
    console.log('✅ DATABASE SETUP COMPLETE!');
    console.log('═══════════════════════════════════════════\n');
    console.log('📊 Summary:');
    console.log('   Database: sos_db');
    console.log('   Table: notifications');
    console.log('   Records: ' + recordCount);
    console.log('   Indexes: 4 (user_id, type, created_at, user_id+type)\n');
    console.log('🚀 You can now use the MySQL API endpoints:');
    console.log('   http://localhost:3001/api/mysql/health');
    console.log('   http://localhost:3001/api/mysql/notifications?action=all\n');
    
  } catch (error) {
    console.error('\n❌ ERROR during setup:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure MySQL is running');
    console.error('2. Check that user "root" exists with empty password');
    console.error('3. Verify MySQL is listening on localhost:3306\n');
    process.exit(1);
  }
}

// Run the setup
setupDatabase();
