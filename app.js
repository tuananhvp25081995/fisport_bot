require("dotenv").config();
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
let moment = require("moment");
let mongoose = require("mongoose")
let LocalStrategy = require("passport-local").Strategy;
var cookieSession = require("cookie-session");
var sparkles = require("sparkles")();
const chalk = require("chalk");

require("./databases/Models/dashboard")
require("./databases/Models/users")
require("./databases/datebase").connect();


let indexRouter = require("./routes/index");

require("./bot");
require("./controllers/eventController")
let group_id,
    group_invite_link = null,
    bot_username = null;

let DashboardModel = mongoose.model("DashboardModel")
let UserModel = mongoose.model("UserModel")
let { getStatstics } = require("./controllers/userControllers");

let curentTime = () => {
    return new moment().utcOffset(7).format("YYYY/MM/DD HH:mm:ss Z");
}

sparkles.on("config_change", async () => {
    try {
        let config = await DashboardModel.findOne({ config: 1 });
        group_id = config.group_id;
        group_invite_link = config.group_invite_link;
        bot_username = config.bot_username;
        console.log(curentTime(7), "config updated in app.js");
    } catch (e) {
        console.error("update config have error", e);
    }
});

var app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
logger.token("datee", function (req, res) {
    return chalk.green(
        new moment().utcOffset("+0700").format("YYYY/MM/DD HH:mm:ss Z")
    );
});
app.use(
    logger(
        ":datee :method :url :status :response-time ms - :res[content-length]",
        {
            skip: (req) => {
                if (
                    req.path.startsWith("/assets") ||
                    req.path.startsWith("/js") ||
                    req.path.startsWith("/stylesheets")
                )
                    return true;
                return false;
            },
        }
    )
);

app.use(express.json());
app.use(express.urlencoded({ extended: true, }));
app.use(cookieParser());


app.use("/", indexRouter);


sparkles.on("init", async () => {
    try {
        let config = await DashboardModel.findOne({ config: 1 }).exec();
        if (!config) {
            console.log("start without config, so create default config");
            config = new DashboardModel();
            await config.save();
            sparkles.emit("config_change");
        } else {
            console.log("server config ok!");
            sparkles.emit("config_change");
        }
    } catch (e) {
        console.error(e);
    }
});



app.use(function (req, res, next) {
    res.status(400).send("new feature is being buiding, please patience wait");
});

app.use(function (err, req, res, next) {
    console.error(curentTime(), err);
    return res.status(500).send("new feature is being buiding, please patience wait");
});

sparkles.on("userOnline", ({ userOnline }) => {
    console.log("receive userOnline", userOnline);
    io.sockets.emit("userOnline", {
        userOnline,
    });
});

sparkles.on("totalUsers", ({ totalUsers }) => {
    io.sockets.emit("totalUsers", {
        totalUsers,
    });
});


// var server = require("https").createServer(options, app);
var server = require("http").createServer(app);
server.on("error", onError);
server.on("listening", onListening);
let port = process.env.PORT
server.listen(port);

function onListening() {
    var addr = server.address();
    var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    console.log("Listening on" + bind);
}

function onError(error) {
    if (error.syscall !== "listen") {
        throw error;
    }
    var bind = port.toString();

    switch (error.code) {
        case "EACCES":
            console.error(bind + " requires elevated privileges");
            process.exit(1);
        case "EADDRINUSE":
            console.error(bind + " is already in use");
            process.exit(1);
        default:
            throw error;
    }
}
