require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
var faker = require("faker");
let moment = require("moment");
const Joi = require("joi");
let mongoose = require("mongoose")
let DashboardModel = mongoose.model("DashboardModel")
let UserModel = mongoose.model("UserModel")
let sparkles = require("sparkles")();
let nodemailer = require("nodemailer");
let WAValidator = require('wallet-address-validator');
let parse = require('url-parse');
const chalk = require("chalk");
const queryString = require('query-string');

let {
    handleNewUserNoRef,
    handleNewUserWithRef,
    handleNewUserJoinGroup,
    handleNewUserJoinChannel,
    handleNewUserJoinampaign,
    getStatstics,
} = require("./controllers/userControllers");

const { MAIL_TEMPLE } = require("./js/define");

let bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true, });

let MAIL_SERVER_HOST, MAIL_SERVER_USER, MAIL_SERVER_PASS

if (process.env.MAIL_SERVER === "smtp2go") {
    MAIL_SERVER_HOST = process.env.MAIL_SERVER_HOST_1
    MAIL_SERVER_USER = process.env.MAIL_SERVER_USER_1
    MAIL_SERVER_PASS = process.env.MAIL_SERVER_PASS_1
} else {
    MAIL_SERVER_HOST = process.env.MAIL_SERVER_HOST_2
    MAIL_SERVER_USER = process.env.MAIL_SERVER_USER_2
    MAIL_SERVER_PASS = process.env.MAIL_SERVER_PASS_2
}

let sendFrom = "Naga Kingdom Airdrop <no_reply@nagakingdom.com>"
let transporter = nodemailer.createTransport({
    host: MAIL_SERVER_HOST,
    port: 587,
    secure: false,
    auth: {
        user: MAIL_SERVER_USER,
        pass: MAIL_SERVER_PASS,
    },
});
let group_id,
    channel_id,
    isPause = false,
    group_invite_link = null,
    channel_invite_link = null,
    bot_username = null,
    domain_verify_endpoint = null,
    BOT_WELCOM_AFTER_START = "",
    BOT_STATUS_SWITCH = true;

let BOT_STEP_1 = "🍓 Step 1: Join Naga Kingdom Telegram Group by clicking this:\n";
let BOT_STEP_2 = "🍓 Step 2: Join Naga Kingdom Telegram Channel by clicking this:\n"
let BOT_STEP_3 = `Step 3:
🌹 Follow and Tweet our Channel [Twitter](https://twitter.com/NagaKingdom)
🌹 And retweet our [Campaign](https://twitter.com/NagaKingdom/status/1509752368585269255) on Twitter (with hashtag #NagaMusk)
🌹 Then enter your twitter profile link:`
let BOT_STEP_4 = `✨ You have successfully completed all steps to gain the rewards.
The rewards will be sent directly to your wallet once the campaign ends.
Thanks for joining!
`
let BOT_CHANGE_WALLET = "✨Enter your Solana Address here (create at Solflare, Trust, coin98, Exodus):\n(eg: 76j4T2MASV6KjrEde57zKbok5gXctDTRNiYY1UhwRTLQ).\nNote: We do NOT accept any BSC or ETH addresses, be alert! Naga Kingdom is developed on Solana Blockchain. Smart contracts are being audited and will be published soon."

let inviteTemple = `
🔊🔊 Naga Musk Limited Experience Event Airdrop
⏰ Time (UTC): 01 - 10 April, 2022
🔖 Start now: URL\n
🎁 Airdrop rewards will be distributed randomly to 1000 lucky wallet addresses on 20 April, 2022.

🎁 Referral Rewards (Top 100 Referrals):
    🏅 1st place: $1000 tickets
    🏅 2nd place: $500 tickets
    🏅 3rd place: $300 tickets
    🏅 4th - 10th place:  $100 tickets
    🏅 11th - 50th place: $50 tickets
    🏅 51st - 100th place: $20 tickets
`

let BOT_EVENT_END = `Hello our value user.\nThe number of participants in the finfine ecosystem launch event has reached the limit, you cannot participate in this airdrop. We thank you for contacting us.\nPlease keep in touch, we will inform you of the latest airdrop.`
let emailDomainAllow = ["aol.com", "gmail.com", "hotmail.com", "hotmail.co.uk", "live.com", "yahoo.com", "yahoo.co.uk", "yandex.com", "hotmail.it"];

//00:00, Jan 05, 2022
let timeEnd = 1649523600000

sparkles.on("config_change", async () => {
    try {
        let config = await DashboardModel.findOne({ config: 1 });
        group_id = config.group_id;
        channel_id = config.channel_id;
        group_invite_link = config.group_invite_link;
        channel_invite_link = config.channel_invite_link,
        bot_username = config.bot_username;
        domain_verify_endpoint = config.domain_verify_endpoint;
        BOT_WELCOM_AFTER_START = config.bot_text.BOT_WELCOM_AFTER_START;
        BOT_STATUS_PRIVATE_CHAT = config.status.privateChat;
        BOT_STATUS_GROUP_CHAT = config.status.groupChat;
        isPause = config.status.isPause
        BOT_STATUS_SWITCH = config.status.switch;
        CONFIG_webinarId = config.webinarId;
    } catch (e) {
        console.error("update config have error", e);
    }
});


let reply_markup_keyboard_check = {
    keyboard: [[{ text: "Check Join Channel"}]],
    resize_keyboard: true,
};

let reply_markup_keyboard_checks = {
    keyboard: [[{ text: "Check Join Group"}]],
    resize_keyboard: true,
};

let reply_markup_keyboard = {
    keyboard: [[{ text: "Share" }, { text: "Change Wallet" }, { text: "/start" }]],
    resize_keyboard: true,
};

let reply_markup_keyboard_end = {
    keyboard: [[{ text: "/start" }]],
    resize_keyboard: true,
};

const schemaEmail = Joi.object({
    email: Joi.string().email({
        minDomainSegments: 1,
        tlds: { allow: ["com", "net", "dev", "uk", "it"] },
    }),
});

function curentTime(offset = 7) {
    return chalk.green(
        new moment().utcOffset(offset).format("YYYY/MM/DD HH:mm:ss Z")
    );
}


async function logMsg(msg, type = "text") {
    let { id, first_name, last_name } = msg.from;
    let telegramID = id;
    let chatId = msg.chat.id;
    let title = msg.chat.title ? msg.chat.title : "";
    let fullName = (first_name ? first_name : "") + " " + (last_name ? last_name : "");

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
    if (type === "text") text = msg.text;

    if (!BOT_STATUS_SWITCH) {
        return;
    }

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
            if (text.startsWith("/start")) {
                const url = 'images/banner.png';
                await bot.sendPhoto(telegramID, url);
                await bot.sendMessage(telegramID, BOT_WELCOM_AFTER_START.replace("USERNAME", `[${fullName}](tg://user?id=${telegramID})`).replace("NAGAKINGDOM",`[Naga Kingdom](https://naga.gg/)`)
                    .replace("COINMARKETCAP",`[CoinmarketCap](https://coinmarketcap.com/currencies/naga-kingdom/)`).replace("RAYDIUM",`[Raydium](https://raydium.io/)`),
                    { parse_mode: "Markdown" }).catch(e => { console.log("error in first start!", e) })
                //handle for new user without ref invite
                if (msg.text === "/start") {
                    return handleStart(bot, msg, null);
                }

                //handle with ref invite
                let id = text.slice(7).replace(/\D/g, "");
                if (!id) {
                    return handleStart(bot, msg, null);
                } else return handleStart(bot, msg, id.toString());
            }
            if (msg.text === "Check Join Channel" && !user.registerFollow.passAll) {
                return handleJoinChannel(bot, msg);
            }

            if (msg.text === "Check Join Channel" && !user.registerFollow.passAll && !user.registerFollow.step2.isJoinGrouped) {
                return await sendStep1({ telegramID }, bot);
            }

            if (!user) {
                return bot.sendMessage(telegramID,
                    "Have an error when handle your request.\nPlease click /start to start again.", {
                    reply_markup: {
                        remove_keyboard: true
                    }
                })
            }
                //have this user in database. check it out
            if (user && !user.registerFollow.passAll) {
                if (!user.registerFollow.step2.isJoinGrouped) {
                    return handleStart(bot, msg, null);
                }
                if (!user.registerFollow.step3.isJoinChanneled) {
                    return sendStep2_1({ telegramID }, bot);
                }

                if (text === "Change email" && !user.registerFollow.passAll) {
                    return handleReEnterEmailAgain(bot, msg);
                }

                if (text === "Resend email" && user.registerFollow.step4.isWaitingVerify) {
                    return handleReSendEmailAgain(bot, msg);
                }
                if (user && !user.registerFollow.step4.isTwitterOK) {
                    let checkTwitter = null
                    try {
                        checkTwitter = await parse(text, true);
                    } catch (e) {
                    }
                    if (checkTwitter.hostname === "twitter.com" || checkTwitter.hostname === "mobile.twitter.com") {
                        const linkT = text.slice(text.length - 5, text.length)
                        if (linkT != ".com" && linkT != ".com/" && text != "https://twitter.com/nagakingdom" && text != "https://mobile.twitter.com/nagakingdom" && text != "https://twitter.com/NagaKingdom" && text != "https://mobile.twitter.com/NagaKingdom") {
                            await UserModel.updateOne({ telegramID }, { "registerFollow.step4.isTwitterOK": true, "registerFollow.step4.linkProfile": text, "registerFollow.passAll": true, "wallet.changeWallet": true }).exec();
                            return bot.sendMessage(telegramID, BOT_CHANGE_WALLET);
                        } else {
                            return bot.sendMessage(telegramID, "You have entered an invalid link profile, please submit again twitter profile ")
                        }
                    }        
                    if (!user.registerFollow.step4.isWaitingPass) {
                        return setTimeout(() => { sendStep3_Twitter({telegramID})},1000)
                    } else {
                        bot.sendMessage(telegramID, "You have entered an invalid link profile, please submit again twitter profile ")
                        return setTimeout(() => { sendStep3_Twitter({telegramID})},1000)
                    }
                }
            };
        
            if (user && user.wallet.changeWallet) {
                var valid = WAValidator.validate(text, 'ETH');
                if (!valid) {
                    await UserModel.updateOne({ telegramID }, { "wallet.changeWallet": false, "wallet.spl": text });

                    if (!user.registerFollow.sendAllStep) {
                        await UserModel.findOneAndUpdate({ telegramID }, { "registerFollow.sendAllStep": true });
                        await sendStep4_Finish({ telegramID, msg });
                        return;
                    }
                    return bot.sendMessage(telegramID, "Your wallet was updated.");
                } else {
                    if (!user.registerFollow.sendAllStep && user.registerFollow.passAll) {
                        bot.sendMessage(telegramID, "You've completed all steps.");
                        return setTimeout(() => bot.sendMessage(telegramID, "Oops!!!\nYou have entered an invalid wallet address. Press submit wallet address again."),500) ;
                    }
                    await UserModel.updateOne({ telegramID }, { "wallet.changeWallet": false });
                }
            }

            //switch commands without payload
            if (BOT_STATUS_SWITCH && user.registerFollow.step4.isTwitterOK && user.registerFollow.step4.linkProfile != "") {
                switch (text) {
                    case "Share":
                        handleInvite(bot, msg);
                        break;
                    case "news":
                        bot.sendMessage(telegramID,
                            "Currently do not have any news yet, we will notify for you in futher news.\nHope you have a nice day",
                            { disable_web_page_preview: true }
                        );
                        break;
                    case "Change Wallet":
                        await UserModel.updateOne({ telegramID }, { "wallet.changeWallet": true });
                        bot.sendMessage(telegramID, BOT_CHANGE_WALLET, { disable_web_page_preview: true, reply_markup: reply_markup_keyboard });
                        break;

                    case "/check":
                        bot.sendMessage(telegramID, "ok", {
                            reply_markup: reply_markup_keyboard
                        })
                        break;
                    default:
                        handleInvite(bot, msg, true);
                        break;
                }
            }
        }
    }else if (text === "left_chat_member") {
        handleLeftChatMember(bot, msg);
    } else if (type === "new_chat_members") {
        handleNewChatMember(bot, msg, 1);
    }
});

bot.on("error", (...parameters) => {
    console.error(parameters);
});

bot.on("polling_error", (error) => {
    console.log(curentTime(), error); // => 'EFATAL'
});

async function handleNewChatMember(bot, msg, campaign) {
    try {
        await bot.deleteMessage(msg.chat.id, msg.message_id);
    } catch (e) {
        console.log("was deleted")
    }
    let telegramID = msg.from.id;
    let { first_name, last_name, id } = msg.from;
    let fullName = (first_name ? first_name : "") + " " + (last_name ? last_name : "");
    await handleNewUserJoinGroup({ telegramID, fullName }, campaign);
    await sendStep2_1({ telegramID }, bot);
}



let handleLeftChatMember = async (bot, msg) => {
    let { first_name, last_name, id } = msg.from;
    let fullName = (first_name ? first_name : "") + " " + (last_name ? last_name : "");
    try {

        await UserModel.findOneAndUpdate(
            { telegramID: id },
            { $set: { "isLeftGroup": true } },
            { useFindAndModify: false }
        ).exec();

        let totalUsers = await UserModel.find({ "registerFollow.step4.isRedditOK": true }).countDocuments().exec();
        sparkles.emit("totalUsers", { totalUsers });
        // await bot.deleteMessage(msg.chat.id, msg.message_id);
        await bot.sendMessage(id, "Warning: you left group, your ref will be delete.", {
            reply_markup: {
                remove_keyboard: true
            }
        });
    } catch (e) {
        console.error(e);
    }
};

async function sendStep3_Twitter({ telegramID }) {
    await bot.sendMessage(telegramID, BOT_STEP_3, {
        parse_mode: "Markdown", disable_web_page_preview: true, reply_markup: {
            remove_keyboard: true
        }
    });
}

async function sendStep4_Finish({ telegramID, msg }) {
    let user = await UserModel.findOne({ telegramID }).exec();
    if (!user) return;
    user.registerFollow.step4.isTwitterOK = true;
    user.registerFollow.log = "step4";
    await user.save()
    await bot.sendMessage(telegramID, BOT_STEP_4, {
        disable_web_page_preview: true,
        reply_markup: reply_markup_keyboard,
    });
    let msgs = {
        from: {
            id: telegramID
        }
    };
    handleInvite(bot, msgs,true)
    try {
        let totalUsers = await UserModel.find({ "registerFollow.step4.isTwitterOK": true }).countDocuments().exec();
        sparkles.emit("totalUsers", { totalUsers });
    } catch (e) {
        console.error(e);
    }

}

async function sendStep1({ telegramID }, bot) {
    bot.sendMessage(telegramID, BOT_STEP_1 + group_invite_link);
    setTimeout(() => {
        return bot.sendMessage(telegramID, `Please click "Check Join Group" to continue`, {
            reply_markup: reply_markup_keyboard_checks
        })
    },1000)
    return;
}

async function sendStep2_1({ telegramID }, bot) {
    bot.sendMessage(telegramID, BOT_STEP_2 + channel_invite_link);
    setTimeout(() => {
        return bot.sendMessage(telegramID, `Please click "Check Join Channel" to continue`, {
            reply_markup: reply_markup_keyboard_check
        })
    },1000)
    return;
}

async function sendStep3_1({ telegramID }, bot) {
    bot.sendMessage(telegramID, BOT_STEP_3, { parse_mode: "Markdown" });
    return;
}

async function handleStart(bot, msg, ref) {
    let telegramID = msg.from.id;
    let user = await UserModel.findOne({ telegramID }, { registerFollow: 1 }).exec();
    let { first_name, last_name } = msg.from;
    let fullName = (first_name ? first_name : "") + " " + (last_name ? last_name : "");
    let result = null;

    //with ref id
    if (ref) {
        bot.sendMessage(ref.toString(), "🎉You have one person joined with your referral.\n You'll be regarded as a successful referral once the member referred complete all the steps of the campaign .\Keep going sir🎉")
            .then((a) => console.log(curentTime(), "send to parent ref ok")).catch(e => { console.log(curentTime(), "send to parent ref fail!", e); })
        result = await handleNewUserWithRef({ telegramID, fullName, ref });
    }
    //without ref id
    else {
        result = await handleNewUserNoRef({ telegramID, fullName });
    }

    if (!result.result) {
        console.error(result);
        return;
    }

    let getChatMember = await bot.getChatMember(group_id.toString(), telegramID);
    console.log(curentTime(),getChatMember.status);
    if (getChatMember.status === "member" && msg.text == "Check Join Group") {
        await handleNewUserJoinGroup({ telegramID, fullName });
        return await sendStep2_1({ telegramID }, bot);
    }else if (getChatMember.status === "left" && msg.text == "Check Join Group") {
        await sendStep1({ telegramID }, bot);
        return;
    }
    if (!user && getChatMember.status === "left") {
        await sendStep1({ telegramID }, bot);
        return;
    }

    if (user && getChatMember.status === "left") {
        await sendStep1({ telegramID }, bot);
        return;
    }
    if (!user && getChatMember.status === "member") {
        await handleNewUserJoinGroup({ telegramID, fullName });
        await sendStep2_1({ telegramID }, bot);
        return;
    }

    if(user && getChatMember.status === "member") {
        await handleNewUserJoinGroup({ telegramID, fullName });
        await sendStep2_1({ telegramID }, bot);
        return;
    }

    if (user && getChatMember.status === "member"&& user.registerFollow.step2.isJoinGrouped && !user.registerFollow.step3.isJoinChanneled) {
        await handleNewUserJoinGroup({ telegramID, fullName });
        await sendStep2_1({ telegramID }, bot);
        return;
    } else if (user && getChatMember.status === "member"&& user.registerFollow.step2.isJoinGrouped && user.registerFollow.step3.isJoinChanneled) {
        return await sendStep3_1({ telegramID }, bot)
    }
    if (user && user.registerFollow.step4.isTwitterOK && user.registerFollow.passAll&&user.registerFollow.sendAllStep &&user.wallet.spl != "") {
        await sendStep4_Finish({ telegramID })
        return;
    }
}

async function handleJoinChannel(bot, msg, campaign) {
    let telegramID = msg.from.id;
    let { first_name, last_name } = msg.from;
    let fullName = (first_name ? first_name : "") + " " + (last_name ? last_name : "");
    let user = await UserModel.findOne({ telegramID }, { registerFollow: 1, social: 1, wallet: 1 }).exec();
    if (user && user.registerFollow.step2.isJoinGrouped) {
        let getChatMember = await bot.getChatMember(channel_id.toString(), telegramID);
        if (getChatMember.status === "member") {
            let user = await handleNewUserJoinChannel({ telegramID, fullName });
            if (user) {
                if (user.registerFollow.log === "step3") {
                    if (user.registerFollow.step2.isJoinGrouped) {
                        await sendStep3_1({ telegramID }, bot);
                    }
                }
            }
            return;
        } else {
            await sendStep2_1({ telegramID }, bot);
            return;
        }
    }


}

function handleInvite(bot, msg, first = false) {

    let toSend = "🎉🎢 Share your referral link. You'll be regarded as a successful referral once the member referred complete all the steps of the campaign:\n";
    let url = "https://t.me/" + bot_username + "?start=" + msg.from.id;
    toSend += url;
    let full = inviteTemple.replace("URL", url)
    if (first) {
        bot.sendMessage(
            msg.from.id,
            toSend,
            {
                disable_web_page_preview: true,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Click to share",
                                url:
                                    "https://t.me/share/url?url=" +
                                    url +
                                    "&text=Join Airdrop event to claim free gift 🎁🎁",
                            },
                        ],
                    ],
                    ...reply_markup_keyboard
                },
            }
        );
    } else {
        bot.sendMessage(
            msg.from.id,
            full,
            {
                disable_web_page_preview: true,
            }
        );
    }
    return;
}
