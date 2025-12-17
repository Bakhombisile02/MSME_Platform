'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create ticket_categories table
    await queryInterface.createTable('ticket_categories', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      color: {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: '#3B82F6' // Default blue color
      },
      sla_hours: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 48, // Default 48 hours SLA
        comment: 'Expected response time in hours'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // 2. Add help desk fields to contact_us table
    await queryInterface.addColumn('contact_us', 'ticket_id', {
      type: Sequelize.STRING(20),
      allowNull: true,
      unique: true,
      comment: 'Unique ticket identifier (e.g., TKT-20251217-001)'
    });

    await queryInterface.addColumn('contact_us', 'status', {
      type: Sequelize.ENUM('open', 'in_progress', 'awaiting_response', 'resolved', 'closed'),
      allowNull: false,
      defaultValue: 'open'
    });

    await queryInterface.addColumn('contact_us', 'priority', {
      type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium'
    });

    await queryInterface.addColumn('contact_us', 'category_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'ticket_categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('contact_us', 'assigned_to', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'admins',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('contact_us', 'due_date', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Calculated based on SLA from category'
    });

    await queryInterface.addColumn('contact_us', 'first_response_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When the first response was sent'
    });

    await queryInterface.addColumn('contact_us', 'resolved_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('contact_us', 'closed_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('contact_us', 'last_activity_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });

    await queryInterface.addColumn('contact_us', 'response_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('contact_us', 'is_read', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('contact_us', 'satisfaction_rating', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'User satisfaction rating 1-5'
    });

    await queryInterface.addColumn('contact_us', 'satisfaction_feedback', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // 3. Create ticket_responses table for conversation threads
    await queryInterface.createTable('ticket_responses', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      ticket_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'contact_us',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      responder_id: {
        type: Sequelize.BIGINT,
        allowNull: true, // null for customer responses
        references: {
          model: 'admins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      responder_type: {
        type: Sequelize.ENUM('admin', 'customer', 'system'),
        allowNull: false,
        defaultValue: 'admin'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      is_internal_note: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Internal notes not visible to customers'
      },
      attachments: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of attachment file paths'
      },
      email_sent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether email notification was sent'
      },
      email_sent_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // 4. Create ticket_attachments table for file uploads
    await queryInterface.createTable('ticket_attachments', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      ticket_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'contact_us',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      response_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'ticket_responses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      file_type: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'File size in bytes'
      },
      uploaded_by: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'admins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      uploaded_by_type: {
        type: Sequelize.ENUM('admin', 'customer'),
        allowNull: false,
        defaultValue: 'customer'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // 5. Add indexes for better query performance
    await queryInterface.addIndex('contact_us', ['ticket_id'], {
      name: 'idx_contact_us_ticket_id'
    });

    await queryInterface.addIndex('contact_us', ['status'], {
      name: 'idx_contact_us_status'
    });

    await queryInterface.addIndex('contact_us', ['priority'], {
      name: 'idx_contact_us_priority'
    });

    await queryInterface.addIndex('contact_us', ['assigned_to'], {
      name: 'idx_contact_us_assigned_to'
    });

    await queryInterface.addIndex('contact_us', ['category_id'], {
      name: 'idx_contact_us_category_id'
    });

    await queryInterface.addIndex('contact_us', ['email'], {
      name: 'idx_contact_us_email'
    });

    await queryInterface.addIndex('contact_us', ['status', 'priority'], {
      name: 'idx_contact_us_status_priority'
    });

    await queryInterface.addIndex('ticket_responses', ['ticket_id'], {
      name: 'idx_ticket_responses_ticket_id'
    });

    await queryInterface.addIndex('ticket_responses', ['responder_id'], {
      name: 'idx_ticket_responses_responder_id'
    });

    await queryInterface.addIndex('ticket_attachments', ['ticket_id'], {
      name: 'idx_ticket_attachments_ticket_id'
    });

    // 6. Seed default ticket categories
    await queryInterface.bulkInsert('ticket_categories', [
      {
        name: 'General Inquiry',
        description: 'General questions and information requests',
        color: '#3B82F6',
        sla_hours: 48,
        is_active: true,
        display_order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Business Registration',
        description: 'Help with MSME business registration process',
        color: '#10B981',
        sla_hours: 24,
        is_active: true,
        display_order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Technical Support',
        description: 'Technical issues with the platform',
        color: '#EF4444',
        sla_hours: 12,
        is_active: true,
        display_order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Account Issues',
        description: 'Login problems, password reset, account access',
        color: '#F59E0B',
        sla_hours: 8,
        is_active: true,
        display_order: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Feedback & Suggestions',
        description: 'Platform feedback and improvement suggestions',
        color: '#8B5CF6',
        sla_hours: 72,
        is_active: true,
        display_order: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Partnership Inquiry',
        description: 'Partnership and collaboration inquiries',
        color: '#EC4899',
        sla_hours: 48,
        is_active: true,
        display_order: 6,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // 7. Update existing contact_us records with ticket_id
    const [existingTickets] = await queryInterface.sequelize.query(
      'SELECT id FROM contact_us WHERE ticket_id IS NULL ORDER BY id ASC'
    );

    for (let i = 0; i < existingTickets.length; i++) {
      const ticket = existingTickets[i];
      const ticketNumber = String(i + 1).padStart(4, '0');
      const ticketId = `TKT-LEGACY-${ticketNumber}`;
      
      await queryInterface.sequelize.query(
        `UPDATE contact_us SET ticket_id = '${ticketId}', last_activity_at = createdAt WHERE id = ${ticket.id}`
      );
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('contact_us', 'idx_contact_us_ticket_id');
    await queryInterface.removeIndex('contact_us', 'idx_contact_us_status');
    await queryInterface.removeIndex('contact_us', 'idx_contact_us_priority');
    await queryInterface.removeIndex('contact_us', 'idx_contact_us_assigned_to');
    await queryInterface.removeIndex('contact_us', 'idx_contact_us_category_id');
    await queryInterface.removeIndex('contact_us', 'idx_contact_us_email');
    await queryInterface.removeIndex('contact_us', 'idx_contact_us_status_priority');
    await queryInterface.removeIndex('ticket_responses', 'idx_ticket_responses_ticket_id');
    await queryInterface.removeIndex('ticket_responses', 'idx_ticket_responses_responder_id');
    await queryInterface.removeIndex('ticket_attachments', 'idx_ticket_attachments_ticket_id');

    // Drop tables
    await queryInterface.dropTable('ticket_attachments');
    await queryInterface.dropTable('ticket_responses');
    await queryInterface.dropTable('ticket_categories');

    // Remove columns from contact_us
    await queryInterface.removeColumn('contact_us', 'ticket_id');
    await queryInterface.removeColumn('contact_us', 'status');
    await queryInterface.removeColumn('contact_us', 'priority');
    await queryInterface.removeColumn('contact_us', 'category_id');
    await queryInterface.removeColumn('contact_us', 'assigned_to');
    await queryInterface.removeColumn('contact_us', 'due_date');
    await queryInterface.removeColumn('contact_us', 'first_response_at');
    await queryInterface.removeColumn('contact_us', 'resolved_at');
    await queryInterface.removeColumn('contact_us', 'closed_at');
    await queryInterface.removeColumn('contact_us', 'last_activity_at');
    await queryInterface.removeColumn('contact_us', 'response_count');
    await queryInterface.removeColumn('contact_us', 'is_read');
    await queryInterface.removeColumn('contact_us', 'satisfaction_rating');
    await queryInterface.removeColumn('contact_us', 'satisfaction_feedback');
  }
};
