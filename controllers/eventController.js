const mongoose = require("mongoose");
const BigNumber = require('bignumber.js');
const contract_address = process.env.CONTRACT_ADDRESS
const { Contract, providers } =  require('ethers');
const abiContract = require('../config/abi').AbiContract
var provider = new providers.JsonRpcProvider(process.env.PROVIDER);
var contract = new Contract(contract_address, abiContract, provider);

contract.on('SWAP', (who, season, team, i, o, buy, timestamp) => {
    console.log(who, season, team, i, o, buy, timestamp)
    // let a = new BigNumber(userId._hex)
    // let b = new BigNumber(referrerId._hex)
    // let userIdRegistration = a.toNumber()
    // let referrerIdRegistration = b.toNumber()
    // let userRegistration = user
    // WebSocketService.sendToAllClient({
    //     action: "registration",
    //     data: {
    //         userIdRegistration: userIdRegistration,
    //         referrerIdRegistration: referrerIdRegistration,
    //         userRegistration: userRegistration
    //     }
    // })
})

contract.on('TransferSingle', (operator, from, to, id, value) => {
    console.log("TransgferSinle", operator, from, to, id, value)
})

contract.on('TransferBatch', (operator, from, to, ids, values) => {
    console.log("TransferBatch", operator, from, to, ids, values)
})