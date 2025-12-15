'use strict';

/**
 * Migration: Add Password Reset Security Fields
 * 
 * Adds the following fields to MSMEBusiness table:
 * - otp_verified: Boolean flag to track if OTP was verified
 * - reset_token: Secure token issued after OTP verification
 * - reset_token_expiry: Expiration time for the reset token
 * 
 * These fields support the secure password reset flow that prevents
 * OTP reuse and ensures passwords are never sent in URLs.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if columns already exist (for idempotency)
      const tableDescription = await queryInterface.describeTable('MSMEBusiness');
      
      // Add otp_verified column
      if (!tableDescription.otp_verified) {
        await queryInterface.addColumn('MSMEBusiness', 'otp_verified', {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false,
          comment: 'Indicates if the OTP has been verified for password reset'
        }, { transaction });
        console.log('✓ Added otp_verified column');
      } else {
        console.log('⏭ otp_verified column already exists');
      }

      // Add reset_token column
      if (!tableDescription.reset_token) {
        await queryInterface.addColumn('MSMEBusiness', 'reset_token', {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'Secure token issued after OTP verification for password reset'
        }, { transaction });
        console.log('✓ Added reset_token column');
      } else {
        console.log('⏭ reset_token column already exists');
      }

      // Add reset_token_expiry column
      if (!tableDescription.reset_token_expiry) {
        await queryInterface.addColumn('MSMEBusiness', 'reset_token_expiry', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Expiration timestamp for the password reset token'
        }, { transaction });
        console.log('✓ Added reset_token_expiry column');
      } else {
        console.log('⏭ reset_token_expiry column already exists');
      }

      // Add index on reset_token for faster lookups during password reset
      if (!tableDescription.reset_token) {
        await queryInterface.addIndex('MSMEBusiness', ['reset_token'], {
          name: 'idx_msme_reset_token',
          unique: false,
          transaction
        });
        console.log('✓ Added index on reset_token');
      }

      await transaction.commit();
      console.log('\n✅ Migration completed successfully!\n');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove index first
      try {
        await queryInterface.removeIndex('MSMEBusiness', 'idx_msme_reset_token', { transaction });
        console.log('✓ Removed index idx_msme_reset_token');
      } catch (e) {
        console.log('⏭ Index idx_msme_reset_token does not exist');
      }

      // Remove columns (check if they exist first)
      const tableDescription = await queryInterface.describeTable('MSMEBusiness');
      
      if (tableDescription.reset_token_expiry) {
        await queryInterface.removeColumn('MSMEBusiness', 'reset_token_expiry', { transaction });
        console.log('✓ Removed reset_token_expiry column');
      }
      
      if (tableDescription.reset_token) {
        await queryInterface.removeColumn('MSMEBusiness', 'reset_token', { transaction });
        console.log('✓ Removed reset_token column');
      }
      
      if (tableDescription.otp_verified) {
        await queryInterface.removeColumn('MSMEBusiness', 'otp_verified', { transaction });
        console.log('✓ Removed otp_verified column');
      }

      await transaction.commit();
      console.log('\n✅ Rollback completed successfully!\n');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }
};
