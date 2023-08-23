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

    const filters = [];

    if (req.query.include.includes('-')) {
        console.log('include ' + req.query.include)
        filters.push({ [Op.like]: `%${req.query.include}%` })
    }

    if (req.query.exclude.includes('-')) {
        console.log('exclude ' + req.query.exclude)

        filters.push({ [Op.notLike]: `%${req.query.exclude}%` })
    }

    try {
        total = await s2022.findAll({
            attributes: ['receiving_yards', 'complete_pass', 'offense_personnel'],
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
            attributes: [
                'offense_personnel',
                'air_yards',
                'receiving_yards',
                'complete_pass',
                'touchdown',
                'game_id'
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
            raw: true
        })
    } catch (err) {
        console.log(err.message)
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

    const total_two_wr = total.filter(t => t.offense_personnel.includes('2 WR'));
    const player_two_wr = player.filter(p => p.offense_personnel.includes('2 WR'));

    const two_wr = {
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

    const three_wr = {
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

    res.send({
        ...totals,
        player_id: req.query.player_id,
        two_wr: two_wr,
        three_wr: three_wr
    })
}