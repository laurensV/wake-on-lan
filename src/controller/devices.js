const os = require('os');
const wakeOnLan = require('@mi-sec/wol');
const { isValidMACAddress } = require('@mi-sec/mac-address');
const ping = require('ping');
const find = require('local-devices');
const config = require('../generic/config');
const {ValidationError} = require("../generic/errors");
const db = require('../services/database');
const network = require('../services/network');
const jsonVendors = require('../services/vendors.json'); // from https://macaddress.io/database-download/json
const mDnsSd = require('node-dns-sd');

module.exports = {
    getDevices: async ctx => {
        console.log(await mDnsSd.discover({
            name: '_services._dns-sd._udp.local'
        }));

        let devices = db.get('devices').value();
        if (!devices) {
            db.defaults({ devices: [] })
                .write();
            devices = db.get('devices').value();
        }
        ctx.ok(devices);
    },
    getDeviceName: async ctx => {
        const {ip} = ctx.request.body;
        let name = '?';
        if (!ip || !ip.length) {
            throw new ValidationError('ip address required')
        }
        let device = db.get('devices')
            .find({ ip })
            .value();
        try {
            name = await network.get_name_from_ip(ip);
        } catch (e) {

        }
        if(device) {
            if (device.name === '' && device.name === '?') {
                db.get('devices')
                    .find({ip})
                    .assign({name})
                    .write()
            } else {
                name = device.name;
            }
        }

        ctx.ok({name});
    },
    findDevices: async ctx => {
        let default_if;
        try {
            default_if = await network.get_default_gateway();
        } catch (e) {
            console.error("could not get default interface gateway ip")
        }
        const cidr = default_if ? default_if.cidr : undefined;
        const onlineDevices = await find(cidr);
        if (default_if) {
            onlineDevices.unshift({
                name: os.hostname(),
                ip: default_if.address,
                mac: default_if.mac
            })
        }
        const devices = db.get('devices').value();
        const newDevices = onlineDevices.filter(onlineDevice => {
            if (devices.some(device=> device.mac === onlineDevice.mac)) {
                // Update IPs of online devices
                db.get('devices')
                    .find({ mac: onlineDevice.mac })
                    .assign({ ip: onlineDevice.ip })
                    .write()
                return false;
            }
            return true;
        })
        for (let k in newDevices) {
            const vendor = jsonVendors.find(({ i }) => newDevices[k].mac.startsWith(i.toLowerCase()));
            newDevices[k].vendor = vendor ? vendor.c : '';
        }
        ctx.ok(newDevices);
    },
    addDevice: ctx => {
        let {name, mac, ip} = ctx.request.body;
        mac = mac.toLowerCase();
        if (!isValidMACAddress(mac))
            throw new ValidationError('Invalid mac address')
        const existDevice = db.get('devices')
            .find(
                device => device.firstName === mac || device.ip === ip
            )
            .value()
        if (existDevice)
            throw new ValidationError('Device already exists')
        const result = db.get('devices')
            .push({ name, ip, mac})
            .write()
        ctx.ok(result);
    },
    removeDevice: ctx => {
        const {mac} = ctx.request.body;
        const result = db.get('devices')
            .remove({ mac })
            .write()
        ctx.ok(result);
    },
    updateDevice: ctx => {
        const {mac, name} = ctx.request.body;
        db.get('devices')
            .find({ mac })
            .assign({ name })
            .write()
    },
    pingDevice: async ctx => {
        const {ip} = ctx.request.body;
        let probe;
        if (ip && ip.length) {
            probe = await ping.promise.probe(ip);
        } else {
            throw new ValidationError('ip address required')
        }
        if (probe.alive) {
            db.get('devices')
                .find({ ip })
                .assign({ lastOnline: new Date() })
                .write()
        }
        ctx.ok({alive:probe.alive});
    },
    wolDevice: async ctx => {
        const {mac} = ctx.request.body;

        if (mac && mac.length) {
            if (!isValidMACAddress(mac)) {
                throw new ValidationError('Invalid mac address')
            }
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


