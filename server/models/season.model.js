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
    }, {
        indexes: [
            {
                fields: [
                    'offense_personnel',
                    'air_yards',
                    'receiving_yards',
                    'complete_pass',
                    'touchdown',
                    'game_id',
                    'offense_players',
                    'receiver_player_id',
                    'pass_attempt',
                    'season',
                    'week'
                ]
            }
        ]
    });

    return Season(season);
}