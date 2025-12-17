'use strict';

/**
 * Migration: Add FULLTEXT indexes for enhanced keyword search
 * 
 * This migration adds MySQL FULLTEXT indexes on searchable columns in MSMEBusiness table
 * to improve search performance and enable relevance-based ranking.
 * 
 * FULLTEXT search benefits:
 * - Much faster than LIKE '%keyword%' queries on large datasets
 * - Supports natural language search with relevance scoring
 * - Can search across multiple columns simultaneously
 * - Built-in stopword filtering and word stemming
 * 
 * Note: FULLTEXT indexes require MySQL 5.6+ for InnoDB tables
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if we're using MySQL/MariaDB (FULLTEXT is MySQL-specific)
      const [results] = await queryInterface.sequelize.query(
        "SELECT VERSION() as version",
        { transaction }
      );
      
      const version = results[0]?.version || '';
      const isMySQL = version.toLowerCase().includes('mysql') || 
                      version.toLowerCase().includes('mariadb') ||
                      !version.toLowerCase().includes('sqlite');
      
      if (!isMySQL) {
        console.log('⚠️  FULLTEXT indexes are MySQL-specific. Skipping for this database.');
        await transaction.commit();
        return;
      }

      console.log('📦 Adding FULLTEXT indexes for enhanced search...');

      // Index 1: Primary business identity search (name + category)
      await queryInterface.sequelize.query(`
        ALTER TABLE MSMEBusiness 
        ADD FULLTEXT INDEX ft_business_identity (
          name_of_organization,
          business_category_name,
          business_sub_category_name
        )
      `, { transaction });
      console.log('✓ Created ft_business_identity index');

      // Index 2: Business description and offerings search
      await queryInterface.sequelize.query(`
        ALTER TABLE MSMEBusiness 
        ADD FULLTEXT INDEX ft_business_details (
          brief_company_description,
          product_offered,
          service_offered
        )
      `, { transaction });
      console.log('✓ Created ft_business_details index');

      // Index 3: Location search
      await queryInterface.sequelize.query(`
        ALTER TABLE MSMEBusiness 
        ADD FULLTEXT INDEX ft_location (
          town,
          region,
          inkhundla,
          street_address
        )
      `, { transaction });
      console.log('✓ Created ft_location index');

      // Index 4: Combined search (most commonly used)
      // This index covers the main searchable fields for general keyword search
      await queryInterface.sequelize.query(`
        ALTER TABLE MSMEBusiness 
        ADD FULLTEXT INDEX ft_combined_search (
          name_of_organization,
          brief_company_description,
          product_offered,
          service_offered,
          town,
          region
        )
      `, { transaction });
      console.log('✓ Created ft_combined_search index');

      await transaction.commit();
      console.log('✅ FULLTEXT indexes created successfully');
      
    } catch (error) {
      await transaction.rollback();
      
      // If indexes already exist, that's okay
      if (error.message.includes('Duplicate key name')) {
        console.log('⚠️  Some FULLTEXT indexes already exist, skipping...');
        return;
      }
      
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('📦 Removing FULLTEXT indexes...');

      // Drop indexes in reverse order
      const indexes = [
        'ft_combined_search',
        'ft_location', 
        'ft_business_details',
        'ft_business_identity'
      ];

      for (const indexName of indexes) {
        try {
          await queryInterface.sequelize.query(
            `ALTER TABLE MSMEBusiness DROP INDEX ${indexName}`,
            { transaction }
          );
          console.log(`✓ Dropped ${indexName}`);
        } catch (e) {
          // Index might not exist, continue
          console.log(`⚠️  Could not drop ${indexName}: ${e.message}`);
        }
      }

      await transaction.commit();
      console.log('✅ FULLTEXT indexes removed');
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
