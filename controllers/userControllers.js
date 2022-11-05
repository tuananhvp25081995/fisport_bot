const mongoose = require("mongoose");
let UserModel = mongoose.model("UserModel")
let moment = require("moment");

function curentTime(offset = 7) {
    return new moment().utcOffset(offset).format("YYYY/MM/DD HH:mm:ss Z");
}

let handleNewUserNoRef = async (data) => {
    let { telegramID, fullName, wallet } = data;

    try {
        let userCheck = await UserModel
            .findOne({ telegramID }).exec();
        if (userCheck) {
            console.log(curentTime(7), userCheck.telegramID, fullName, "user was joined to chat group before");
            //update fullName
            userCheck.fullName = fullName;
            await userCheck.save();
            let toReturn = {
                result: true,
                isNewUser: false,
                user: userCheck,
            };
            return toReturn;
        } else {
            let newUser = new UserModel();
            newUser.telegramID = telegramID;
            newUser.wallet = wallet
            newUser.fullName = fullName;
            newUser.joinDate = Date.now();
            newUser.updateAt = Date.now();
            let result = await newUser.save();
            let toReturn = {
                result: true,
                isNewUser: true,
                user: result,
            };
            console.log(curentTime(), telegramID, fullName, "user joined to chat group");
            return toReturn;
        }
    } catch (e) {
        console.log(
            curentTime(),
            telegramID,
            fullName,
            "has error when handle"
        );
        console.error(e);
        let toReturn = {
            result: false,
        };
        return toReturn;
    }
};

let setEmailWaitingVerify = async ({ telegramID }, isWaitingVerify) => {
    try {
        let user = await UserModel
            .findOne({
                telegramID,
            })
            .exec();
        if (user) {
            user.registerFollow.step3.isWaitingVerify = isWaitingVerify;
            await user.save();
            return true;
        } else return false;
    } catch (e) {
        console.error(e);
        return false;
    }
};

let handleNewUserJoinGroup = async ({ telegramID, fullName }, campaign) => {
    try {
        let user = await UserModel.findOne({ telegramID }).exec();
        if (!user) {
            console.log(curentTime(7), fullName, telegramID, "not found in db");
            return null;
        } else {
            user.registerFollow.step2.isJoinGrouped = true;
        }
        await user.save();
        return user;
    } catch (e) {
        console.error(e);
        return null;
    }
};

let handleUserWebhook = async ({ id, event }) => {
    try {
        let user = await UserModel
            .findOne({
                "webminar.registrant_id": id,
            })
            .exec();
        if (!user) return;
        if (user.webminarLog.log.length === 0) {
            user.webminarLog.log.push({
                event,
                time: Date.now(),
            });
        } else {
            let lastTime =
                user.webminarLog.log[user.webminarLog.log.length - 1];
            if (lastTime.event === "join" && event === "left") {
                user.webminarLog.totalTime =
                    user.webminarLog.totalTime + (Date.now() - lastTime.time);
                user.webminarLog.log.push({
                    event,
                    time: Date.now(),
                });
            } else if (lastTime.event === "left" && event === "join") {
                user.webminarLog.log.push({
                    event,
                    time: Date.now(),
                });
            } else {
                console.error(
                    "have conflic when handle time, telegramID",
                    user.telegramID,
                    new Date().toDateString()
                );
            }

            if (
                user.webminarLog.totalTime > 1800000 &&
                !user.webminarLog.isEnough30min
            )
                user.webminarLog.isEnough30min = true;
        }

        await user.save();
    } catch (e) {
        console.error(
            "handleUserWebhook have an error when handle with registrant_id:",
            id
        );
        console.error(e);
    }
};

module.exports = {
    handleNewUserNoRef,
    setEmailWaitingVerify,
    handleNewUserJoinGroup,
    handleUserWebhook,
};
