const wakeOnLan = require('@mi-sec/wol');
const config = require('../generic/config');
const {ValidationError} = require("../generic/errors");

module.exports = {
    getDevices: ctx => {
        const devices = config.devices;
        ctx.ok(devices);
    },
    pingDevice: async ctx => {
        const {ip} = ctx.request.body;

        const probe = await ping.promise.probe(ip)

        ctx.ok("OK");
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


