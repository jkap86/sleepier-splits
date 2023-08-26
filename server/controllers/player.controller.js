'use strict'

const db = require('../models');
const Op = db.Sequelize.Op;
const Sequelize = db.Sequelize;
const s2022 = db['2022'];
const fs = require('fs');
const zlib = require('zlib');
const csv = require('csv-parser');


exports.loadpbp = (req, res) => {
    const csvGzPath = './play_by_play_2016.csv.gz';
    const gunzip = zlib.createGunzip();

    const readStream = fs.createReadStream(csvGzPath);

    const rows = [];

    readStream
        .pipe(gunzip)
        .pipe(csv())
        .on('data', (row) => {

            rows.push(row);

        })
        .on('end', async () => {
            const batchSize = 100;

            for (let i = 0; i < rows.length; i += batchSize) {
                console.log(`INSERTING ${i}-${i + batchSize} of ${rows.length} Plays...`)
                try {
                    await s2022.bulkCreate(rows.slice(i, i + batchSize), { ignoreDuplicates: true });
                } catch (error) {
                    console.log(error.message)
                }
            }

            console.log(`SUCCESS...`)

            res.json(
                rows.slice(0, 25)
            );

        })
        .on('error', (err) => {
            console.error('Error reading or parsing CSV:', err);
            res.status(500).send('Internal Server Error');
        });
}

exports.addParticipation = (req, res) => {
    const csvGzPath = './pbp_participation_2016.csv';

    const readStream = fs.createReadStream(csvGzPath);

    const rows = [];

    readStream
        .pipe(csv())
        .on('data', (row) => {
            if (row.play_id && row.game_id) {
                rows.push(row);
            }
        })
        .on('end', async () => {
            const batchSize = 100;

            for (let i = 0; i < rows.length; i += batchSize) {
                console.log(`UPDATING ${i}-${i + batchSize} of ${rows.length} Plays...`)
                try {
                    await s2022.bulkCreate(
                        rows.slice(i, i + batchSize), {
                        updateOnDuplicate: [
                            'game_id',
                            "offense_formation",
                            "offense_personnel",
                            "defenders_in_box",
                            "defense_personnel",
                            "number_of_pass_rushers",
                            "players_on_play",
                            "offense_players",
                            "defense_players",
                        ]
                    });

                } catch (error) {
                    console.log(error.message)
                }
            }
            console.log(`SUCCESS...`)
            res.json(
                {
                    array: rows.length,
                    set: Array.from(new Set(rows.map(r => `${r.play_id}-${r.game_id}`))).length
                }
            );

        })
        .on('error', (err) => {
            console.error('Error reading or parsing CSV:', err);
            res.status(500).send('Internal Server Error');
        });
}

exports.headers = (req, res) => {
    const csvGzPath = './play_by_play_2022.csv.gz';
    const gunzip = zlib.createGunzip();

    const readStream = fs.createReadStream(csvGzPath);

    let headers;
    readStream
        .pipe(gunzip)
        .pipe(csv())
        .on('headers', (headerList) => {
            headers = headerList;
        })
        .on('data', () => { })  // Just to ensure the 'end' event is triggered.
        .on('end', () => {
            fs.writeFileSync('./headers.json', JSON.stringify(headers))
            res.send(headers);
        })
        .on('error', (err) => {
            res.status(500).send('Error reading the CSV file.');
            console.error(err);
        });
}

exports.player_ids = async (req, res) => {
    const csvGzPath = './players.csv';

    const readStream = fs.createReadStream(csvGzPath);

    const rows = [];

    readStream
        .pipe(csv())
        .on('data', (row) => {
            rows.push(row);
        })
        .on('end', async () => {
            fs.writeFileSync('player_ids.json', JSON.stringify(rows))
            res.send('done');

        })
        .on('error', (err) => {
            console.error('Error reading or parsing CSV:', err);
            res.status(500).send('Internal Server Error');
        });
}

exports.getFieldOptions = async (req, res) => {
    let allEntries = await s2022.findAll({
        attributes: ['weather'],
        raw: true
    })

    const options = Array.from(
        new Set(
            allEntries.map(entry => entry.weather)
        )
    )

    fs.writeFileSync('weather.json', JSON.stringify(options))
}

exports.wrsummary = async (req, res) => {
    let player;
    let total;
    let total_seasons;
    let total_player;

    const filters = [];

    if (req.query.include.includes('-')) {
        console.log('include ' + req.query.include)
        filters.push({ [Op.like]: `%${req.query.include}%` })
    }

    if (req.query.exclude.includes('-')) {
        console.log('exclude ' + req.query.exclude)

        filters.push({ [Op.notLike]: `%${req.query.exclude}%` })
    }

    let attributes = [
        'offense_personnel',
        'air_yards',
        'receiving_yards',
        'complete_pass',
        'touchdown',
        'game_id'
    ]

    if (req.query.breakoutby === 'aDot') {
        attributes.push(
            [Sequelize.literal(`CASE
                    WHEN air_yards = '' THEN 'Unknown'
                    WHEN CAST(air_yards AS INTEGER) < 5 THEN '<5'
                    WHEN CAST(air_yards AS INTEGER) BETWEEN 5 AND 9 THEN '5-9'
                    WHEN CAST(air_yards AS INTEGER) BETWEEN 10 AND 14 THEN '10-14'
                    ELSE '15+'
                END`), 'air_yards_range']
        )
    }
    try {
        total = await s2022.findAll({
            attributes: attributes,
            where: {
                [Op.and]: [
                    {
                        offense_players: {
                            [Op.and]: [
                                { [Op.like]: `%${req.query.player_id}%` },
                                ...filters
                            ]
                        }
                    },
                    {
                        pass_attempt: "1"
                    },
                    {
                        [Op.and]: [
                            Sequelize.literal(`CAST(season AS INTEGER) >= ${req.query.startSeason}`),
                            Sequelize.literal(`CAST(week AS INTEGER) >= ${req.query.startWeek}`)
                        ]
                    },
                    {
                        [Op.and]: [
                            Sequelize.literal(`CAST(season AS INTEGER) <= ${req.query.endSeason}`),
                            Sequelize.literal(`CAST(week AS INTEGER) <= ${req.query.endWeek}`)
                        ]
                    }
                ]
            },
            raw: true
        })

        player = await s2022.findAll({
            attributes: attributes,
            where: {
                [Op.and]: [
                    {
                        offense_players: {
                            [Op.and]: [
                                { [Op.like]: `%${req.query.player_id}%` },
                                ...filters
                            ]
                        }
                    },
                    {
                        receiver_player_id: `${req.query.player_id}`
                    },
                    {
                        pass_attempt: "1"
                    },
                    {
                        [Op.and]: [
                            Sequelize.literal(`CAST(season AS INTEGER) >= ${req.query.startSeason}`),
                            Sequelize.literal(`CAST(week AS INTEGER) >= ${req.query.startWeek}`)
                        ]
                    },
                    {
                        [Op.and]: [
                            Sequelize.literal(`CAST(season AS INTEGER) <= ${req.query.endSeason}`),
                            Sequelize.literal(`CAST(week AS INTEGER) <= ${req.query.endWeek}`)
                        ]
                    }
                ]
            },
            raw: true
        })

        if (['season', 'passer_player_id'].includes(req.query.breakoutby)) {
            total_seasons = await s2022.findAll({
                attributes: [
                    req.query.breakoutby,
                    [Sequelize.fn('SUM', Sequelize.literal(`CASE
                            WHEN air_yards = '' THEN 0
                            ELSE CAST(air_yards AS INTEGER)
                        END`)), 'air_yards'],
                    [Sequelize.fn('SUM', Sequelize.literal(`CASE
                            WHEN receiving_yards = '' THEN 0
                            ELSE CAST(receiving_yards AS INTEGER)
                        END`)), 'receiving_yards'],
                    [Sequelize.fn('SUM', Sequelize.literal(`CASE
                            WHEN complete_pass = '' THEN 0
                            ELSE CAST(complete_pass AS INTEGER)
                        END`)), 'complete_pass'],
                    [Sequelize.fn('SUM', Sequelize.literal(`CASE
                            WHEN touchdown = '' THEN 0
                            ELSE CAST(touchdown AS INTEGER)
                        END`)), 'touchdown'],
                    [Sequelize.fn('ARRAY_AGG', Sequelize.col('game_id')), 'game_id']
                ],
                where: {
                    [Op.and]: [
                        {
                            offense_players: {
                                [Op.and]: [
                                    { [Op.like]: `%${req.query.player_id}%` },
                                    ...filters
                                ]
                            }
                        },
                        {
                            pass_attempt: "1"
                        },
                        {
                            [Op.and]: [
                                Sequelize.literal(`CAST(season AS INTEGER) >= ${req.query.startSeason}`),
                                Sequelize.literal(`CAST(week AS INTEGER) >= ${req.query.startWeek}`)
                            ]
                        },
                        {
                            [Op.and]: [
                                Sequelize.literal(`CAST(season AS INTEGER) <= ${req.query.endSeason}`),
                                Sequelize.literal(`CAST(week AS INTEGER) <= ${req.query.endWeek}`)
                            ]
                        }
                    ]
                },
                group: [req.query.breakoutby],
                raw: true
            })

            total_player = await s2022.findAll({
                attributes: [
                    req.query.breakoutby,
                    [Sequelize.fn('SUM', Sequelize.literal(`CASE
                            WHEN air_yards = '' THEN 0
                            ELSE CAST(air_yards AS INTEGER)
                        END`)), 'air_yards'],
                    [Sequelize.fn('SUM', Sequelize.literal(`CASE
                            WHEN receiving_yards = '' THEN 0
                            ELSE CAST(receiving_yards AS INTEGER)
                        END`)), 'receiving_yards'],
                    [Sequelize.fn('SUM', Sequelize.literal(`CASE
                            WHEN complete_pass = '' THEN 0
                            ELSE CAST(complete_pass AS INTEGER)
                        END`)), 'complete_pass'],
                    [Sequelize.fn('SUM', Sequelize.literal(`CASE
                            WHEN touchdown = '' THEN 0
                            ELSE CAST(touchdown AS INTEGER)
                        END`)), 'touchdown'],
                    [Sequelize.fn('ARRAY_AGG', Sequelize.col('game_id')), 'game_id']
                ],
                where: {
                    [Op.and]: [
                        {
                            offense_players: {
                                [Op.and]: [
                                    { [Op.like]: `%${req.query.player_id}%` },
                                    ...filters
                                ]
                            }
                        },
                        {
                            receiver_player_id: `${req.query.player_id}`
                        },
                        {
                            pass_attempt: "1"
                        },
                        {
                            [Op.and]: [
                                Sequelize.literal(`CAST(season AS INTEGER) >= ${req.query.startSeason}`),
                                Sequelize.literal(`CAST(week AS INTEGER) >= ${req.query.startWeek}`)
                            ]
                        },
                        {
                            [Op.and]: [
                                Sequelize.literal(`CAST(season AS INTEGER) <= ${req.query.endSeason}`),
                                Sequelize.literal(`CAST(week AS INTEGER) <= ${req.query.endWeek}`)
                            ]
                        }
                    ]
                },
                group: [req.query.breakoutby],
                raw: true
            })
        }
    } catch (err) {
        console.log(err.message + ' season QUERY')
    }

    const totals = {
        tgt_share: (player.length / total.length).toString(),
        yprr: (player.reduce((acc, cur) => acc + parseInt(cur.receiving_yards || 0), 0) / total.length).toString(),
        aDot: (player.reduce((acc, cur) => acc + parseInt(cur.air_yards || 0), 0) / player.length).toString(),
        plays: total.length,
        targets: player.length,
        rec: player.filter(p => parseInt(p.complete_pass) === 1).length,
        yards: player.reduce((acc, cur) => acc + (parseInt(cur.receiving_yards) || 0), 0),
        tds: player.reduce((acc, cur) => acc + (parseInt(cur.touchdown) || 0), 0),
        games: Array.from(new Set(player.map(p => p.game_id))).length
    }

    let two_wr, three_wr;

    let yard_under_5, yard_5_9, yard_10_14, yard_over_15;

    let season_breakout = {};

    if (req.query.breakoutby === 'formation') {
        const total_two_wr = total.filter(t => t.offense_personnel.includes('2 WR'));
        const player_two_wr = player.filter(p => p.offense_personnel.includes('2 WR'));

        two_wr = {
            tgt_share: (player_two_wr.length / total_two_wr.length).toString(),
            yprr: (player_two_wr.reduce((acc, cur) => acc + parseInt(cur.receiving_yards || 0), 0) / total_two_wr.length).toString(),
            aDot: (player_two_wr.reduce((acc, cur) => acc + parseInt(cur.air_yards || 0), 0) / player_two_wr.length).toString(),
            plays: total_two_wr.length,
            targets: player_two_wr.length,
            rec: player_two_wr.filter(p => parseInt(p.complete_pass) === 1).length,
            yards: player_two_wr.reduce((acc, cur) => acc + (parseInt(cur.receiving_yards) || 0), 0),
            tds: player_two_wr.reduce((acc, cur) => acc + (parseInt(cur.touchdown) || 0), 0),
            games: Array.from(new Set(player_two_wr.map(p => p.game_id))).length
        }

        const total_three_wr = total.filter(t => t.offense_personnel.includes('3 WR'));
        const player_three_wr = player.filter(p => p.offense_personnel.includes('3 WR'));

        three_wr = {
            tgt_share: (player_three_wr.length / total_three_wr.length).toString(),
            yprr: (player_three_wr.reduce((acc, cur) => acc + parseInt(cur.receiving_yards || 0), 0) / total_three_wr.length).toString(),
            aDot: (player_three_wr.reduce((acc, cur) => acc + parseInt(cur.air_yards || 0), 0) / player_three_wr.length).toString(),
            plays: total_three_wr.length,
            targets: player_three_wr.length,
            rec: player_three_wr.filter(p => parseInt(p.complete_pass) === 1).length,
            yards: player_three_wr.reduce((acc, cur) => acc + (parseInt(cur.receiving_yards) || 0), 0),
            tds: player_three_wr.reduce((acc, cur) => acc + (parseInt(cur.touchdown) || 0), 0),
            games: Array.from(new Set(player_three_wr.map(p => p.game_id))).length
        }
    } else if (req.query.breakoutby === 'aDot') {
        const total_under_5 = total.filter(t => t.air_yards_range === '<5');
        const player_under_5 = player.filter(p => p.air_yards_range === '<5');

        yard_under_5 = {
            tgt_share: (player_under_5.length / total_under_5.length).toString(),
            yprr: (player_under_5.reduce((acc, cur) => acc + parseInt(cur.receiving_yards || 0), 0) / total_under_5.length).toString(),
            aDot: (player_under_5.reduce((acc, cur) => acc + parseInt(cur.air_yards || 0), 0) / player_under_5.length).toString(),
            plays: total_under_5.length,
            targets: player_under_5.length,
            rec: player_under_5.filter(p => parseInt(p.complete_pass) === 1).length,
            yards: player_under_5.reduce((acc, cur) => acc + (parseInt(cur.receiving_yards) || 0), 0),
            tds: player_under_5.reduce((acc, cur) => acc + (parseInt(cur.touchdown) || 0), 0),
            games: Array.from(new Set(player_under_5.map(p => p.game_id))).length
        }

        const total_5_9 = total.filter(t => t.air_yards_range === '5-9');
        const player_5_9 = player.filter(p => p.air_yards_range === '5-9');

        yard_5_9 = {
            tgt_share: (player_5_9.length / total_5_9.length).toString(),
            yprr: (player_5_9.reduce((acc, cur) => acc + parseInt(cur.receiving_yards || 0), 0) / total_5_9.length).toString(),
            aDot: (player_5_9.reduce((acc, cur) => acc + parseInt(cur.air_yards || 0), 0) / total_5_9.length).toString(),
            plays: total_5_9.length,
            targets: player_5_9.length,
            rec: player_5_9.filter(p => parseInt(p.complete_pass) === 1).length,
            yards: player_5_9.reduce((acc, cur) => acc + (parseInt(cur.receiving_yards) || 0), 0),
            tds: player_5_9.reduce((acc, cur) => acc + (parseInt(cur.touchdown) || 0), 0),
            games: Array.from(new Set(player_5_9.map(p => p.game_id))).length
        }

        const total_10_14 = total.filter(t => t.air_yards_range === '10-14');
        const player_10_14 = player.filter(p => p.air_yards_range === '10-14');

        yard_10_14 = {
            tgt_share: (player_10_14.length / total_10_14.length).toString(),
            yprr: (player_10_14.reduce((acc, cur) => acc + parseInt(cur.receiving_yards || 0), 0) / total_10_14.length).toString(),
            aDot: (player_10_14.reduce((acc, cur) => acc + parseInt(cur.air_yards || 0), 0) / player_10_14.length).toString(),
            plays: total_10_14.length,
            targets: player_10_14.length,
            rec: player_10_14.filter(p => parseInt(p.complete_pass) === 1).length,
            yards: player_10_14.reduce((acc, cur) => acc + (parseInt(cur.receiving_yards) || 0), 0),
            tds: player_10_14.reduce((acc, cur) => acc + (parseInt(cur.touchdown) || 0), 0),
            games: Array.from(new Set(player_10_14.map(p => p.game_id))).length
        }

        const total_over_15 = total.filter(t => t.air_yards_range === '15+');
        const player_over_15 = player.filter(p => p.air_yards_range === '15+');

        yard_over_15 = {
            tgt_share: (player_over_15.length / total_over_15.length).toString(),
            yprr: (player_over_15.reduce((acc, cur) => acc + parseInt(cur.receiving_yards || 0), 0) / total_over_15.length).toString(),
            aDot: (player_over_15.reduce((acc, cur) => acc + parseInt(cur.air_yards || 0), 0) / player_over_15.length).toString(),
            plays: total_over_15.length,
            targets: player_over_15.length,
            rec: player_over_15.filter(p => parseInt(p.complete_pass) === 1).length,
            yards: player_over_15.reduce((acc, cur) => acc + (parseInt(cur.receiving_yards) || 0), 0),
            tds: player_over_15.reduce((acc, cur) => acc + (parseInt(cur.touchdown) || 0), 0),
            games: Array.from(new Set(player_over_15.map(p => p.game_id))).length
        }
    } else if (req.query.breakoutby === 'season') {
        total_seasons
            ?.forEach(total_season => {
                const player_season = total_player.find(p => p.season === total_season.season);

                season_breakout[`season_${total_season.season}`] = {
                    tgt_share: (player_season.game_id.length / total_season.game_id.length).toString(),
                    yprr: (player_season.receiving_yards / total_season.game_id.length).toString(),
                    aDot: (player_season.air_yards / player_season.game_id.length).toString(),
                    plays: total_season.game_id.length,
                    targets: player_season.game_id.length,
                    rec: player_season.complete_pass,
                    yards: player_season.receiving_yards,
                    tds: player_season.touchdown,
                    games: Array.from(new Set(player_season.game_id)).length
                }
            })
    } else if (req.query.breakoutby === 'passer_player_id') {
        total_seasons
            ?.forEach(passer => {
                const player_passer = total_player.find(p => p.passer_player_id === passer.passer_player_id);

                if (player_passer) {
                    season_breakout[`passer_${passer.passer_player_id}`] = {
                        tgt_share: (player_passer.game_id.length / passer.game_id.length).toString(),
                        yprr: (player_passer.receiving_yards / passer.game_id.length).toString(),
                        aDot: (player_passer.air_yards / player_passer.game_id.length).toString(),
                        plays: passer.game_id.length,
                        targets: player_passer.game_id.length,
                        rec: player_passer.complete_pass,
                        yards: player_passer.receiving_yards,
                        tds: player_passer.touchdown,
                        games: Array.from(new Set(player_passer.game_id)).length
                    }
                }
            })
    }

    res.send({
        ...totals,
        player_id: req.query.player_id,
        two_wr: two_wr,
        three_wr: three_wr,
        yard_under_5: yard_under_5,
        yard_5_9: yard_5_9,
        yard_10_14: yard_10_14,
        yard_over_15: yard_over_15,
        ...season_breakout
    })
}

exports.topwr = async (req, res) => {
    const topwr = await s2022.findAll({
        attributes: [
            'receiver_player_id',
            [Sequelize.fn('SUM', Sequelize.literal(`CASE
                WHEN ${req.query.statistic} = '' THEN 0
                ELSE CAST(${req.query.statistic} AS INTEGER)
            END`)), req.query.statistic]
        ],
        order: [[req.query.statistic, 'DESC']],
        limit: 50,
        where: {
            [Op.and]: [
                {
                    [Op.and]: [
                        Sequelize.literal(`CAST(season AS INTEGER) >= ${req.query.startSeason}`),
                        Sequelize.literal(`CAST(week AS INTEGER) >= ${req.query.startWeek}`)
                    ]
                },
                {
                    [Op.and]: [
                        Sequelize.literal(`CAST(season AS INTEGER) <= ${req.query.endSeason}`),
                        Sequelize.literal(`CAST(week AS INTEGER) <= ${req.query.endWeek}`)
                    ]
                }
            ]
        },
        group: ['receiver_player_id'],
        raw: true
    })

    const total = await s2022.findAll({
        attributes: [
            'receiver_player_id',
            [Sequelize.fn('SUM', Sequelize.literal(
                `CASE
                    WHEN air_yards = '' THEN 0
                    ELSE CAST(air_yards AS INTEGER)
                END`
            )), 'air_yards'],
            [Sequelize.fn('SUM', Sequelize.literal(
                `CASE
                    WHEN receiving_yards = '' THEN 0
                    ELSE CAST(receiving_yards AS INTEGER)
                END`
            )), 'receiving_yards'],
            [Sequelize.fn('SUM', Sequelize.literal(
                `CASE
                    WHEN complete_pass = '' THEN 0
                    ELSE CAST (complete_pass AS INTEGER)
                END`
            )), 'complete_pass'],
            [Sequelize.fn('SUM', Sequelize.literal(
                `CASE
                    WHEN touchdown = '' THEN 0
                    ELSE CAST (touchdown AS INTEGER)
                END`
            )), 'touchdowns'],
            [Sequelize.fn('COUNT', Sequelize.col('game_id')), 'targets'],
            [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('game_id'))), 'game_id']
        ],
        where: {
            [Op.and]: [
                {
                    offense_players: {
                        [Op.or]: topwr.map(wr => {
                            return { [Op.like]: `%${wr.receiver_player_id}%` }
                        })
                    }
                },
                {
                    pass_attempt: "1"
                },
                {
                    [Op.and]: [
                        Sequelize.literal(`CAST(season AS INTEGER) >= ${req.query.startSeason}`),
                        Sequelize.literal(`CAST(week AS INTEGER) >= ${req.query.startWeek}`)
                    ]
                },
                {
                    [Op.and]: [
                        Sequelize.literal(`CAST(season AS INTEGER) <= ${req.query.endSeason}`),
                        Sequelize.literal(`CAST(week AS INTEGER) <= ${req.query.endWeek}`)
                    ]
                }
            ]
        },
        group: ['receiver_player_id'],
        raw: true
    })

    const top_ids = topwr.map(wr => wr.receiver_player_id)

    const topwr_details = [];

    for (const wr of total.filter(t => top_ids.includes(t.receiver_player_id))) {
        const routes = await s2022.count({
            where: {
                [Op.and]: [
                    {
                        offense_players: {
                            [Op.like]: `%${wr.receiver_player_id}%`
                        }
                    },
                    {
                        pass_attempt: "1"
                    },
                    {
                        [Op.and]: [
                            Sequelize.literal(`CAST(season AS INTEGER) >= ${req.query.startSeason}`),
                            Sequelize.literal(`CAST(week AS INTEGER) >= ${req.query.startWeek}`)
                        ]
                    },
                    {
                        [Op.and]: [
                            Sequelize.literal(`CAST(season AS INTEGER) <= ${req.query.endSeason}`),
                            Sequelize.literal(`CAST(week AS INTEGER) <= ${req.query.endWeek}`)
                        ]
                    }
                ]
            }
        })

        topwr_details.push({
            ...wr,
            routes: routes
        })
    }

    res.send(topwr_details)
}