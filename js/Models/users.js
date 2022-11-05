let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let schemaUsers = new Schema(
    {
        telegramID: { type: String, required: true },
        fullName: { type: String, default: "" },
        wallet: { type: String, default: "" },
        transferred: { type: Boolean, default: false },
        inviteLogs: [
            {
                telegramID: { type: String, require: true },
                timestamp: { type: Date, default: Date.now() },
            },
        ],
        refTelegramID: { type: String, default: "" },
        registerFollow: {
            joinFrom: { type: String, default: "private" },
            step1: {
                createDb: { type: Boolean, default: true },
            },
            step2: {
                checkInfo: { type: Boolean, default: false },
            },
        },
        joinDate: { type: Date, default: Date.now() },
        updateAt: { type: Date, default: Date.now() },
        isLeftGroup: { type: Boolean, default: false }
    },
    {
        versionKey: false,
    }
);

mongoose.model("UserModel", schemaUsers, "users")
