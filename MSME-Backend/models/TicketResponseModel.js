module.exports = (sequelize, DataTypes) => {
    const Model = sequelize.define('TicketResponseModel', {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        ticket_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'contact_us',
                key: 'id'
            }
        },
        responder_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: 'admins',
                key: 'id'
            }
        },
        responder_type: {
            type: DataTypes.ENUM('admin', 'customer', 'system'),
            allowNull: false,
            defaultValue: 'admin'
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        is_internal_note: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Internal notes not visible to customers'
        },
        attachments: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of attachment file paths'
        },
        email_sent: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        email_sent_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        paranoid: true,
        timestamps: true,
        tableName: 'ticket_responses'
    });

    Model.associate = function(models) {
        // Response belongs to a ticket
        Model.belongsTo(models.ContactUsModel, {
            foreignKey: 'ticket_id',
            as: 'ticket'
        });

        // Response can be by an admin
        Model.belongsTo(models.AdminModel, {
            foreignKey: 'responder_id',
            as: 'responder'
        });

        // Response can have attachments
        Model.hasMany(models.TicketAttachmentModel, {
            foreignKey: 'response_id',
            as: 'responseAttachments'
        });
    };

    return Model;
};
