#!/usr/bin/env node
/**
 * Admin Seed Script
 * 
 * Creates the initial admin user for the CMS.
 * Run this once during initial setup: npm run seed:admin
 * 
 * Usage:
 *   npm run seed:admin
 *   node scripts/seedAdmin.js
 *   
 * Environment variables (optional):
 *   ADMIN_EMAIL - Admin email (default: admin@msme.gov.sz)
 *   ADMIN_PASSWORD - Admin password (default: generated)
 *   ADMIN_NAME - Admin name (default: System Admin)
 */

require('dotenv').config();
const crypto = require('crypto');

// Set environment for database connection
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const db = require('../models');

async function seedAdmin() {
    console.log('\n🌱 MSME Admin Seed Script\n');
    console.log('═'.repeat(50));

    try {
        // Connect to database
        await db.sequelize.authenticate();
        console.log('✓ Database connected');

        // Check if admin already exists
        const existingAdmin = await db.AdminModel.findOne({
            where: { user_type: 'admin' }
        });

        if (existingAdmin) {
            console.log('\n⚠️  An admin user already exists:');
            console.log(`   Email: ${existingAdmin.email}`);
            console.log(`   Name: ${existingAdmin.name}`);
            console.log('\n   To create another admin, use the CMS after logging in.');
            process.exit(0);
        }

        // Get admin details from env or use defaults
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@msme.gov.sz';
        const adminName = process.env.ADMIN_NAME || 'System Admin';
        
        // Generate secure password if not provided
        let adminPassword = process.env.ADMIN_PASSWORD;
        let passwordGenerated = false;
        
        if (!adminPassword) {
            adminPassword = crypto.randomBytes(12).toString('base64').slice(0, 16);
            passwordGenerated = true;
        }

        // Hash password
        const hashedPassword = await db.AdminModel.hashPassword(adminPassword);

        // Create admin
        const admin = await db.AdminModel.create({
            email: adminEmail,
            password: hashedPassword,
            name: adminName,
            user_type: 'admin'
        });

        console.log('\n✓ Admin user created successfully!\n');
        console.log('═'.repeat(50));
        console.log('\n📧 Admin Credentials:\n');
        console.log(`   Email:    ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        console.log(`   Name:     ${adminName}`);
        
        if (passwordGenerated) {
            console.log('\n⚠️  IMPORTANT: Save this password securely!');
            console.log('   It was auto-generated and will not be shown again.');
        }

        console.log('\n═'.repeat(50));
        console.log('\n🔐 You can now login to the CMS at /login\n');

    } catch (error) {
        console.error('\n❌ Error creating admin:', error.message);
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            console.log('\n   An admin with this email already exists.');
        }
        
        process.exit(1);
    } finally {
        await db.sequelize.close();
    }
}

// Run if called directly
if (require.main === module) {
    seedAdmin();
}

module.exports = seedAdmin;
