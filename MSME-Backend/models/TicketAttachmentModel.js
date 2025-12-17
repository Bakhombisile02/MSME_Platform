module.exports = (sequelize, DataTypes) => {
    const Model = sequelize.define('TicketAttachmentModel', {
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
        response_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: 'ticket_responses',
                key: 'id'
            }
        },
        file_name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        file_path: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        file_type: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        file_size: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'File size in bytes'
        },
        uploaded_by: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: 'admins',
                key: 'id'
            }
        },
        uploaded_by_type: {
            type: DataTypes.ENUM('admin', 'customer'),
            allowNull: false,
            defaultValue: 'customer'
        }
    }, {
        paranoid: true,
        timestamps: true,
        tableName: 'ticket_attachments'
    });

    Model.associate = function(models) {
        // Attachment belongs to a ticket
        Model.belongsTo(models.ContactUsModel, {
            foreignKey: 'ticket_id',
            as: 'ticket'
        });

        // Attachment may belong to a response
        Model.belongsTo(models.TicketResponseModel, {
            foreignKey: 'response_id',
            as: 'response'
        });

        // Attachment may be uploaded by admin
        Model.belongsTo(models.AdminModel, {
            foreignKey: 'uploaded_by',
            as: 'uploader'
        });
    };

    return Model;
};
