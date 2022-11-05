require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
let moment = require("moment");
let mongoose = require("mongoose")
let DashboardModel = mongoose.model("DashboardModel")
let UserModel = mongoose.model("UserModel")
let sparkles = require("sparkles")();
const chalk = require("chalk");
const { PublicKey } = require('@solana/web3.js');
const axios = require("axios").default;

let {
    handleNewUserNoRef,
} = require("./controllers/userControllers");

let bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true, });

let isPause = false,
    BOT_WELCOM_AFTER_START = "";

let BOT_STEP_1 = "Please enter your wallet address";

let BOT_EVENT_END = `Hello our value user.\nThe number of participants in the finfine ecosystem launch event has reached the limit, you cannot participate in this airdrop. We thank you for contacting us.\nPlease keep in touch, we will inform you of the latest airdrop.`

//00:00, Dec 11, 2022
let timeEnd = 1670691600000

sparkles.on("config_change", async () => {
    try {
        let config = await DashboardModel.findOne({ config: 1 });
        group_id = config.group_id;
        channel_id = config.channel_id;
        group_invite_link = config.group_invite_link;
        channel_invite_link = config.channel_invite_link,
        BOT_WELCOM_AFTER_START = config.bot_text.BOT_WELCOM_AFTER_START;
        BOT_STATUS_PRIVATE_CHAT = config.status.privateChat;
        BOT_STATUS_GROUP_CHAT = config.status.groupChat;
        isPause = config.status.isPause
        CONFIG_webinarId = config.webinarId;
    } catch (e) {
        console.error("update config have error", e);
    }
});

let reply_markup_keyboard = {
    keyboard: [[{ text: "Info" }, { text: "Affiliate" }, { text: "Search" }]],
    resize_keyboard: true,
};

let reply_markup_keyboard_end = {
    keyboard: [[{ text: "Start" }]],
    resize_keyboard: true,
};

function curentTime(offset = 7) {
    return chalk.green(
        new moment().utcOffset(offset).format("YYYY/MM/DD HH:mm:ss Z")
    );
}


async function logMsg(msg, type = "text") {
    if (type === "text") {
        text = msg.text;
        text = text.toString().split("\n").join(" ");
        return;
    }
    if (type === "sticker") {
        return
    }
    if (type === "new_chat_members") {
    }
    else if (type === "left_chat_member") {
    } else {
    }
}

function Valication(address) {
    try {
        const publicKeyInUint8 = new PublicKey(address).toBytes();
        let  isSolana =  PublicKey.isOnCurve(publicKeyInUint8)
        return isSolana
    } catch (error) {
        return false
    }
}

bot.onText(/\/echo (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"
    bot.sendMessage(chatId, resp);
});

let limit = {}
bot.on("message", async (...parameters) => {
    let msg = parameters[0];
    let type = parameters[1].type;
    let chatId = msg.chat.id;
    let telegramID = msg.from.id;
    let { first_name, last_name } = msg.from;
    let fullName = (first_name ? first_name : "") + " " + (last_name ? last_name : "");
    logMsg(msg, type);
    let text = "";
    if (type === "text") text = msg.text

    if (limit[telegramID] !== undefined) {
        if (Date.now() - limit[telegramID].last < 300) {
            limit[telegramID].last = Date.now()
            return
        } else limit[telegramID].last = Date.now()
    } limit[telegramID] = { last: Date.now() }

    if (isPause) {
        return bot.sendMessage(telegramID, "Airdrop will temporary pause to mantain for good experience.\nAirdrop will resume soon. Sorry for inconvenient.")
    }

    //this is text message
    if (type === "text") {
        if (msg.chat.type === "private") {
            let user = await UserModel.findOne({ telegramID }, { mail:1, registerFollow: 1, social: 1, wallet: 1 }).exec();
            if (Date.now() > timeEnd) {
                bot.sendMessage(telegramID, BOT_EVENT_END, {reply_markup: reply_markup_keyboard_end}).catch(e => { console.log(e) })
                return;
            }
            //user didn't have in database
            if (text.startsWith("/start") || text.startsWith("Start")) {
                await bot.sendMessage(telegramID, BOT_WELCOM_AFTER_START.replace("USERNAME", `[${fullName}](tg://user?id=${telegramID})`),
                    { parse_mode: "Markdown" }).catch(e => { console.log("error in first start!", e) })
                let id = text.slice(7);
                if (!id) {
                    return handleStart(bot, msg, null);
                } else  {
                    return handleStart(bot, msg, id.toString());   
                }
            }
            

            if (!user) {
                return bot.sendMessage(telegramID,
                    "Have an error when handle your request.\nPlease click start to start again.", {
                    reply_markup: {
                        remove_keyboard: true
                    }
                })
            }

            //switch commands without payload
            switch (text) {
                case "Info":
                    sendMyInfo({ telegramID }, bot)
                    return;
                case "Affiliate":
                    sendAffiliate({ telegramID }, bot)
                    return;
                case "Search":
                    return sendStep1({ telegramID }, bot)
                default:
                    break;
            }

            if (user.registerFollow.step2.checkInfo) {
                if (Valication(msg.text)) {
                    sendInfoUser({ telegramID }, bot, msg.text, user)
                } else {
                    bot.sendMessage(telegramID,
                        "Oops!!!\nYou have entered an invalid wallet address or wallet does not exist in the system. Press submit wallet address again.",
                        { disable_web_page_preview: true }
                    );
                }
            } else {
                await sendStep1({ telegramID }, bot)
            }
        }
    }
});

bot.on("error", (...parameters) => {
    console.error(parameters);
});

bot.on("polling_error", (error) => {
    console.log(curentTime(), error); // => 'EFATAL'
});

async function sendStep1({ telegramID }, bot) {
    let user = await UserModel.findOne({ telegramID }).exec();
    if (!user) return;
    user.registerFollow.step2.checkInfo = true
    await user.save()
    bot.sendMessage(telegramID, BOT_STEP_1);
    return;
}

async function sendAffiliate({ telegramID }, bot) {
    let user = await UserModel.findOne({ telegramID }).exec();
    if (user) {
        let wallet = user.wallet.toString()
        console.log(wallet)
        axios
            .get((process.env.GET_USER_URL).toString()+wallet, {
                headers: {
                    'Content-Type': 'application/json',
                    'chain': process.env.CHAIN
                },
            })
            .then(async function (response) {
                if (response.data.success) {
                    return bot.sendMessage(telegramID, response.data.data.f1s.toString(), {
                        reply_markup: reply_markup_keyboard
                    })
                } else {
                    return bot.sendMessage(telegramID, "Oops!!!\nUser does not exist");
                }
            })
            .catch(function (error) {
                console.log("error", error.message)
                return bot.sendMessage(telegramID, "Oops!!!\nUser does not exist") ;
            });
    }
}

async function sendMyInfo({ telegramID }, bot) {
    let user = await UserModel.findOne({ telegramID }).exec();
    if (user) {
        let wallet = user.wallet.toString()
        axios
            .get((process.env.GET_USER_URL).toString()+wallet, {
                headers: {
                    'Content-Type': 'application/json',
                    'chain': process.env.CHAIN
                },
            })
            .then(async function (response) {
                if (response.data.success) {
                    return bot.sendMessage(telegramID, `${response.data.data.address.toString()}`, {
                        reply_markup: reply_markup_keyboard
                    })
                } else {
                    return bot.sendMessage(telegramID, "Oops!!!\nUser does not exist");
                }
            })
            .catch(function (error) {
                console.log("error", error.message)
                return bot.sendMessage(telegramID, "Oops!!!\nUser does not exist") ;
            });
    }
}

async function sendInfoUser({ telegramID }, bot, text, user) {
    axios
        .get((process.env.GET_USER_URL).toString()+text.toString(), {
            headers: {
                'Content-Type': 'application/json',
                'chain': process.env.CHAIN
            },
        })
        .then(async function (response) {
            if (response.data.success) {
                user.registerFollow.step2.checkInfo = false;
                return bot.sendMessage(telegramID, response.data.data.address.toString(), {
                    reply_markup: reply_markup_keyboard
                })
            } else {
                return bot.sendMessage(telegramID, "Oops!!!\nYou have entered an invalid wallet address or wallet does not exist in the system. Press submit wallet address again.");
            }
        })
        .catch(function (error) {
            console.log("error", error.message)
            return bot.sendMessage(telegramID, "Oops!!!\nYou have entered an invalid wallet address or wallet does not exist in the system. Press submit wallet address again.") ;
        });
}

async function handleStart(bot, msg, wallet) {
    let telegramID = msg.from.id;
    let { first_name, last_name } = msg.from;
    let fullName = (first_name ? first_name : "") + " " + (last_name ? last_name : "");
    let result = null;
    result = await handleNewUserNoRef({ telegramID, fullName, wallet });
    await sendStep1({ telegramID }, bot)

    if (!result.result) {
        console.error(result);
        return;
    }
}