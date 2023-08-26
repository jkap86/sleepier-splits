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
                name: 'index_1',
                fields: [
                    'offense_players',
                    'pass_attempt',
                    'season',
                    'week'
                ]
            },
            {
                name: 'index_2',
                fields: [
                    'receiver_player_id',
                    'receiving_yards',
                    'season',
                    'week'
                ]
            },
            {
                name: 'index_3',
                fields: [
                    'receiver_player_id',
                    'air_yards',
                    'receiving_yards',
                    'complete_pass',
                    'touchdown',
                    'game_id',
                    'offense_players',
                    'pass_attempt',
                    'season',
                    'week'
                ]
            }
        ]
    });

    return Season(season);
}