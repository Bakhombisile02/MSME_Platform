
module.exports = (sequelize, DataTypes) => {
    const Model = sequelize.define('ContactUsModel', {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        ticket_id: {
            type: DataTypes.STRING(20),
            allowNull: true,
            unique: true,
            comment: 'Unique ticket identifier (e.g., TKT-20251217-001)'
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: false,
            minlength: [3, 'name must be at least 3 characters long'],
        },
        mobile: {
            type: DataTypes.STRING(100),
            allowNull: false,
            minlength: [3, 'name must be at least 3 characters long'],
        },
        email: {
            type: DataTypes.STRING(200),
            allowNull: false,
            minlength: [3, 'name must be at least 3 characters long'],
        },
        subject: {
            type: DataTypes.STRING(200),
            allowNull: false,
            minlength: [3, 'Subject must be at least 3 characters long'],
        },
        message: {
            type: DataTypes.STRING(750),
            allowNull: false,
            minlength: [3, 'description must be at least 3 characters long'],
        },
        // Help Desk Fields
        status: {
            type: DataTypes.ENUM('open', 'in_progress', 'awaiting_response', 'resolved', 'closed'),
            allowNull: false,
            defaultValue: 'open'
        },
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
            allowNull: false,
            defaultValue: 'medium'
        },
        category_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: 'ticket_categories',
                key: 'id'
            }
        },
        assigned_to: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: 'admins',
                key: 'id'
            }
        },
        due_date: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Calculated based on SLA from category'
        },
        first_response_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'When the first response was sent'
        },
        resolved_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        closed_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        last_activity_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW
        },
        response_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        satisfaction_rating: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User satisfaction rating 1-5'
        },
        satisfaction_feedback: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        paranoid: true,
        timestamps: true,
        tableName: 'contact_us',
        hooks: {
            beforeCreate: async (ticket, options) => {
                // Generate unique ticket ID
                const date = new Date();
                const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
                
                // Find the last ticket of today
                const lastTicket = await Model.findOne({
                    where: {
                        ticket_id: {
                            [sequelize.Sequelize.Op.like]: `TKT-${dateStr}-%`
                        }
                    },
                    order: [['id', 'DESC']],
                    paranoid: false
                });

                let sequence = 1;
                if (lastTicket && lastTicket.ticket_id) {
                    const parts = lastTicket.ticket_id.split('-');
                    sequence = parseInt(parts[2]) + 1;
                }

                ticket.ticket_id = `TKT-${dateStr}-${String(sequence).padStart(4, '0')}`;
                ticket.last_activity_at = new Date();

                // Calculate due date if category has SLA
                if (ticket.category_id) {
                    const { TicketCategoryModel } = sequelize.models;
                    const category = await TicketCategoryModel.findByPk(ticket.category_id);
                    if (category && category.sla_hours) {
                        ticket.due_date = new Date(Date.now() + category.sla_hours * 60 * 60 * 1000);
                    }
                }
            }
        }
    });

    Model.associate = function(models) {
        // Ticket belongs to a category
        Model.belongsTo(models.TicketCategoryModel, {
            foreignKey: 'category_id',
            as: 'category'
        });

        // Ticket is assigned to an admin
        Model.belongsTo(models.AdminModel, {
            foreignKey: 'assigned_to',
            as: 'assignee'
        });

        // Ticket has many responses
        Model.hasMany(models.TicketResponseModel, {
            foreignKey: 'ticket_id',
            as: 'responses'
        });

        // Ticket has many attachments
        Model.hasMany(models.TicketAttachmentModel, {
            foreignKey: 'ticket_id',
            as: 'attachments'
        });
    };

    return Model;
};
