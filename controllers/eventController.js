const mongoose = require("mongoose");
let UserModel = mongoose.model("UserModel")
const BigNumber = require('bignumber.js')
const moment = require("moment")
const contract_address = process.env.CONTRACT_ADDRESS
const contract_factory_addres = process.env.FACTORY_CONTRACT_ADDRESS
const contract_marketer_addres = process.env.MARKETER_CONTRACT_ADDRESS
const { Contract, providers } =  require('ethers');
const abiRouter = require('../config/router-abi.json')
const abiFactory = require('../config/factory-abi.json')
const abiMarketer = require('../config/marketer-abi.json')
const provider = new providers.JsonRpcProvider(process.env.PROVIDER_URL);
const contractRouter = new Contract(contract_address, abiRouter, provider);
const contractFactory = new Contract(contract_factory_addres, abiFactory, provider);
const contractMarketer = new Contract(contract_marketer_addres, abiMarketer, provider);
const bot = require('../bot')

contractRouter.on('SWAP', async (who, season, team, i, o, buy, timestamp) => {
    const seasonParsed = new BigNumber(season._hex).toNumber();
    const teamParsed = new BigNumber(team._hex).toNumber();
    const inParsed = (new BigNumber(i._hex).toNumber()) / (Math.pow(10,18));
    const outParsed = (new BigNumber(o._hex).toNumber()) / (Math.pow(10,18));
    const timestampParsed = new BigNumber(timestamp._hex).toNumber();
    const dateFormat = new Date(timestampParsed*1000);
    const date = dateFormat.getDate()+
    "/"+(dateFormat.getMonth()+1)+
    "/"+dateFormat.getFullYear()+
    " "+dateFormat.getHours()+
    ":"+dateFormat.getMinutes()+
    ":"+dateFormat.getSeconds();
    let user = await UserModel.findOne({ wallet: who },{ telegramID:1 }).exec();
    if (user) {
        const telegramID = user.telegramID
        bot.sendMessage(telegramID, `SWAP:\nseason: ${seasonParsed}\nteam: ${teamParsed}\nin: ${inParsed}\nout: ${outParsed}\ntimestamp: ${date}`)
    }
})

contractFactory.on('TransferSingle', async (operator, from, to, id, value) => {
    const tokenId = new BigNumber(id._hex).toNumber();
    const tokenAmount = (new BigNumber(value._hex).toNumber()) / (Math.pow(10,18));
    const timestamp = moment().unix();
    const dateFormat = new Date(timestamp*1000);

    const date = dateFormat.getDate()+
    "/"+(dateFormat.getMonth()+1)+
    "/"+dateFormat.getFullYear()+
    " "+dateFormat.getHours()+
    ":"+dateFormat.getMinutes()+
    ":"+dateFormat.getSeconds();

    let userFrom = await UserModel.findOne({ wallet:from },{ telegramID:1 }).exec();
    let userTo = await UserModel.findOne({ wallet:to },{ telegramID:1 }).exec();
    if (userFrom) {
        const telegramIDFrom = userFrom.telegramID 
        bot.sendMessage(telegramIDFrom, `TransferSingle:\noperator: ${operator}\nfrom: ${from}\nto: ${to}\nid: ${tokenId}\nvalue: ${tokenAmount}\ntimestamp: ${date}`)
    }
    if (userTo) {
        const telegramIDTo = userTo.telegramID
        bot.sendMessage(telegramIDTo, `TransferSingle:\noperator: ${operator}\nfrom: ${from}\nto: ${to}\nid: ${tokenId}\nvalue: ${tokenAmount}\ntimestamp: ${date}`)
    }
})

contractFactory.on('TransferBatch', async (operator, from, to, ids, values) => {
    let userFrom = await UserModel.findOne({ wallet:from },{ telegramID:1 }).exec();
    let userTo = await UserModel.findOne({ wallet:to },{ telegramID:1 }).exec();
    try {
        const timestamp = moment().unix();
        const dateFormat = new Date(timestamp*1000);
        const date = dateFormat.getDate()+
        "/"+(dateFormat.getMonth()+1)+
        "/"+dateFormat.getFullYear()+
        " "+dateFormat.getHours()+
        ":"+dateFormat.getMinutes()+
        ":"+dateFormat.getSeconds();
        if (ids?.length > 0) {
          await Promise.all(
            ids.map(async (id, index) => {
                const tokenId = new BigNumber(id._hex).toNumber();
                const tokenAmount = (new BigNumber(values[index]._hex).toNumber()) / (Math.pow(10,18));
                if (userFrom) {
                    const telegramIDFrom = userFrom.telegramID 
                    bot.sendMessage(telegramIDFrom, `TransferSingle:\noperator: ${operator}\nfrom: ${from}\nto: ${to}\nid: ${tokenId}\nvalue: ${tokenAmount}\ntimestamp: ${date}`)
                }
                if (userTo) {
                    const telegramIDTo = userTo.telegramID
                    bot.sendMessage(telegramIDTo, `TransferSingle:\noperator: ${operator}\nfrom: ${from}\nto: ${to}\nid: ${tokenId}\nvalue: ${tokenAmount}\ntimestamp: ${date}`)
                }
            }),
          );
        }
    } catch (error) {
        this.logger.error(error);
    }
})

module.exports = contractMarketer;