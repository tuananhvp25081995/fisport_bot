const mongoose = require("mongoose");
let UserModel = mongoose.model("UserModel")
const BigNumber = require('bignumber.js')
const moment = require("moment")
const contract_address = process.env.CONTRACT_ADDRESS
const { Contract, providers } =  require('ethers');
const abiContract = require('../config/abi').AbiContract
const provider = new providers.JsonRpcProvider(process.env.PROVIDER);
const contract = new Contract(contract_address, abiContract, provider);
const bot = require('../bot').bot

contract.on('SWAP', async (who, season, team, i, o, buy, timestamp) => {
    console.log("SWAP", who, season, team, i, o, buy, timestamp)
    const seasonParsed = new BigNumber(season._hex).toNumber();
    const teamParsed = new BigNumber(team._hex).toNumber();
    const inParsed = new BigNumber(i._hex).toNumber();
    const outParsed = new BigNumber(o._hex).toNumber();
    const timestampParsed = new BigNumber(timestamp._hex).toNumber();
    let user = await UserModel.findOne({ wallet: who },{ telegramID:1 }).exec();
    if (user) {
        const telegramID = user.telegramID 
        bot.sendMessage(telegramID, `SWAP:\nseason:${seasonParsed}\nteam:${teamParsed}\nin:${inParsed}\nout:${outParsed}\ntimestamp:${timestampParsed}`)
    }
})

contract.on('TransferSingle', async (operator, from, to, id, value) => {
    console.log("TransgferSinle", operator, from, to, id, value)
    const tokenId = new BigNumber(id._hex).toNumber();
    const tokenAmount = new BigNumber(value._hex).toNumber();
    const timestamp = moment().unix();
    let user = await UserModel.findOne({ wallet:from },{ telegramID:1 }).exec();
    if (user) {
        const telegramID = user.telegramID 
        bot.sendMessage(telegramID, `TransferSingle:\noperator:${operator}\nfrom:${from}\nto:${to}\nid:${tokenId}\nvalue:${tokenAmount}\ntimestamp:${timestamp}`)
    }
})

contract.on('TransferBatch', async (operator, from, to, ids, values) => {
    console.log("TransferBatch", operator, from, to, ids, values)
    let user = await UserModel.findOne({ wallet:from },{ telegramID:1 }).exec();
    try {
        const timestamp = moment().unix();
        if (ids?.length > 0) {
          await Promise.all(
            ids.map(async (id, index) => {
              const tokenId = new BigNumber(id._hex).toNumber();
              const tokenAmount = new BigNumber(values[index]._hex).toNumber();
              if (user) {
                  const telegramID = user.telegramID 
                  bot.sendMessage(telegramID, `TransferSingle:\noperator:${operator}\nfrom:${from}\nto:${to}\nid:${tokenId}\nvalue:${tokenAmount}\ntimestamp:${timestamp}`)
              }
            }),
          );
        }
    } catch (error) {
        this.logger.error(error);
    }
})