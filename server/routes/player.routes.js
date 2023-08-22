module.exports = app => {
    const router = require("express").Router();
    const player = require('../controllers/player.controller');

    router.get("/loadpbp", player.loadpbp)

    router.get('/addpart', player.addParticipation)

    router.get('/wrsummary', player.wrsummary)

    router.get('/headers', player.headers)

    router.get('/player_ids', player.player_ids)

    app.use('/player', router)
}