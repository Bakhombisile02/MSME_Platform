'use strict';
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const db = {};
const CONFIG = require('../config/config.js');

let EnvName = process.env.NODE_ENV;

console.log('EnvironmentVariable Name:', EnvName);

const sequelize = new Sequelize(CONFIG[EnvName].database, CONFIG[EnvName].username, CONFIG[EnvName].password, {
    host: CONFIG[EnvName].host,
    dialect: CONFIG[EnvName].dialect,
    port: CONFIG[EnvName].port,
    logging: CONFIG[EnvName].logging,
    // Connection pool configuration for better performance
    pool: {
        max: parseInt(process.env.DB_POOL_MAX) || 10,      // Maximum connections
        min: parseInt(process.env.DB_POOL_MIN) || 2,       // Minimum connections
        acquire: 30000,  // Max time (ms) to get connection before throwing error
        idle: 10000      // Max time (ms) a connection can be idle before release
    },
    // Retry logic for transient failures
    retry: {
        max: 3
    }
});

fs.readdirSync(__dirname)
    .filter((file) => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach((file) => {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes)
        db[model.name] = model;
    });

Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});



db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
