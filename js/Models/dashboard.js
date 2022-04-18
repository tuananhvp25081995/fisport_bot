const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schemaDashboard = new Schema(
    {
        config: { type: Number, default: 1 },
        username: { type: String, default: "admin" },
        password: { type: String, default: "hi" },

        token: {
            access_token: { type: String, default: "" },
            refresh_token: { type: String, default: "" },
            token_refresh_at: { type: Date, default: Date.now() },
            scope: { type: String, default: "" },
            token_type: { type: String, default: "bearer" },
        },

        status: {
            privateChat: { type: Boolean, default: true },
            groupChat: { type: Boolean, default: true },
            switch: { type: Boolean, default: true },
            isPause: { type: Boolean, default: false }
        },

        user_oauth_code: { type: String, default: "VuMT59Uxyj_FUr1m2ZpQDim0r14iB9Mag" },
        app_client_id: { type: String, default: "bpcThYtThGoff_o0g4a9w" },
        app_client_secret: { type: String, default: "tXG7CtViLEA1o6ikow1nSZpSwxK8DtJB" },

        //846 2720 4564 for test
        webinarId: { type: String, default: "84627204564" },

        //-1001417029522  for test group
        //-1001420387772 for main group
        group_id: { type: String, default: "-1001627215619" },
        channel_id: { type: String, default: "-1001680013176" },

        group_invite_link: { type: String, default: "https://t.me/nagakingdom", },
        channel_invite_link: { type: String, default: "https://t.me/naga_kingdom", },

        redirect_uri: { type: String, default: "https%3A%2F%2Fnagakingdom.com%2Foauth" },
        bot_username: { type: String, default: "airdrop_naga_bot" },
        domain: { type: String, default: "https://nagakingdom.com" },
        domain_verify_endpoint: {
            type: String,
            default: "https://bot.nagakingdom.com/email_verify",
        },

        bot_text: {
            BOT_WELCOM_AFTER_START: {
                type: String,
                default: `🎉 🎉 Welcome USERNAME - Limited Experience Event in Naga Kingdom!

⬇️ Please perform the tasks below to receive $10 Arena tickets

About Naga Kingdom:
    - NAGAKINGDOM is the top game built and developed on Solana Blockchain.
    - Naga Kingdom is now on COINMARKETCAP and RAYDIUM.
————————————————————————

🎁 Airdrop rewards will be distributed randomly to 1000 lucky wallet addresses on 20 April, 2022.

🎁 Referral Rewards (Top 100 Referrals):
    🏅 1st place: $1000 tickets
    🏅 2nd place: $500 tickets
    🏅 3rd place: $300 tickets
    🏅 4th - 10th place:  $100 tickets
    🏅 11th - 50th place: $50 tickets
    🏅 51st - 100th place: $20 tickets

⬇️ Please perform the following tasks (required):

✅ Step 1: Join Naga Kingdom Telegram Group
✅ Step 2: Join Naga Kingdom Telegram Channel
✅ Step 3: Follow & Retweet Naga Kingdom’s pinned tweet on Twitter (with hashtag #NagaMusk)
✅ Step 4: Enter Solana Address (create at Solflare, Trust, coin98, Exodus)
—————————————————————-
⚡️ Note: Winners are required to register to experience Naga Kingdom with Naga Musk NFT (Registration for the Limited Experience Event opens from 14:00 - 16:00 UTC, 10 - 16 April, 2022).

Thanks for joining!
`
            },
            BOT_DESCRIPTION: {
                type: String,
                default: `🎉🎉🎉 Welcome to the first Airdrop Campaign in Naga Kingdom!
                        —————————————————————-\n
                        The total reward is up to 100,000 NAGA Tokens & 1000 limited editions of NFT Snake. 
                        —————————————————————-\n
                        Naga Kingdom is the legendary snake game built on the Solana Blockchain.
                        In addition, the Gameplay is open to new features and different playing modes, including Freeplay, Arena and P2E Mode.
                        —————————————————————-\n
                        `
            },
        },
    },

    {
        versionKey: false,
    }
);
console.log("loaded DashboardModel");
mongoose.model("DashboardModel", schemaDashboard, "dashboard");