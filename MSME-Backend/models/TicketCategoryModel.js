module.exports = (sequelize, DataTypes) => {
    const Model = sequelize.define('TicketCategoryModel', {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        color: {
            type: DataTypes.STRING(20),
            allowNull: true,
            defaultValue: '#3B82F6'
        },
        sla_hours: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 48,
            comment: 'Expected response time in hours'
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        display_order: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        }
    }, {
        paranoid: true,
        timestamps: true,
        tableName: 'ticket_categories'
    });

    Model.associate = function(models) {
        // A category can have many tickets
        Model.hasMany(models.ContactUsModel, {
            foreignKey: 'category_id',
            as: 'tickets'
        });
    };

    return Model;
};
