var express = require('express');

var rooms = { '1': {}, '2': {} };

module.exports = function (io) {
    let router = express.Router()

    router.get('/:id', function (req, res, next) {
        let id = req.params.id;
        console.log("room req");
        if (id in rooms) {
            res.send(`room ${id} exists`);
        } else {
            res.send(`room ${id} does not exist. creating!`)
            rooms[id] = {};
        }
    });

    return router;
}