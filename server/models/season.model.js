'use strict'

module.exports = (sequelize, Sequelize, season) => {
    const headers = require('../headers.json');

    const Season = (season) => sequelize.define(season, {
        play_id: {
            type: Sequelize.STRING,
            allowNull: false,
            primaryKey: true
        },
        game_id: {
            type: Sequelize.STRING,
            allowNull: false,
            primaryKey: true
        },
        ...Object.fromEntries(headers.map(header => {
            return [header, { type: Sequelize.TEXT }]
        }))
    });

    return Season(season);
}