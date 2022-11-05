var express = require("express");
var router = express.Router();
let mongoose = require("mongoose")
let DashboardModel = mongoose.model("DashboardModel")
let passport = require("passport");
var sparkles = require("sparkles")();
const chalk = require("chalk");
let moment = require("moment");


function curentTime(offset = 7) {
    return chalk.green(
        new moment().utcOffset(offset).format("YYYY/MM/DD HH:mm:ss Z")
    );
}


let bot_username = "airdrop_naga_bot"

sparkles.on("config_change", async () => {
    try {
        let config = await DashboardModel.findOne({ config: 1 });
        bot_username = config.bot_username;
        console.log(curentTime(7), "config updated in index.js");
    } catch (e) {
        console.error("update config have error", e);
    }
});

passport.serializeUser(function (user, cb) {
    cb(null, user._id);
});

passport.deserializeUser(function (id, cb) {
    DashboardModel.findById(id, function (err, user) {
        if (err) {
            return cb(err);
        }
        cb(null, user);
    });
});

module.exports = router;
