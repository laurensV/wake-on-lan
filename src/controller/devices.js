const wakeOnLan = require('@mi-sec/wol');
const ping = require('ping');
const find = require('local-devices');
const config = require('../generic/config');
const {ValidationError} = require("../generic/errors");

module.exports = {
    getDevices: ctx => {
        const devices = config.devices;
        ctx.ok(devices);
    },
    findDevices: async ctx => {
        const devices = await find();
        ctx.ok(devices);
    },
    pingDevice: async ctx => {
        const {ip} = ctx.request.body;
        let probe;
        if (ip && ip.length) {
            probe = await ping.promise.probe(ip);
        } else {
            throw new ValidationError('ip address required')
        }
        ctx.ok(probe.alive);
    },
    wolDevice: async ctx => {
        const {mac} = ctx.request.body;

        if (mac && mac.length) {
            await wakeOnLan(mac, {
                address: '255.255.255.255',
                packets: 3,
                interval: 100,
                port: 9
            } );
        } else {
            throw new ValidationError('mac address required')
        }
        ctx.ok(`wake-on-lan packets sent to ${mac}`);
    },
};


