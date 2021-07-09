const wol = require('wake_on_lan');
const config = require('../generic/config');

module.exports = {
    getDevices: ctx => {
        const devices = config.devices;
        ctx.ok(devices);
    },
    pingDevice: ctx => {
        const MAC = '44:8A:5B:5C:06:97';

        wol.wake(MAC, function (error) {
            if (error) {
                console.log("Could not send wol")
            } else {
                console.log("wol packet sent!")
            }
        });

        ctx.ok("OK");
    },
    wolDevice: ctx => {
        const MAC = '44:8A:5B:5C:06:97';

        wol.wake(MAC, function (error) {
            if (error) {
                console.log("Could not send wol")
            } else {
                console.log("wol packet sent!")
            }
        });

        ctx.ok("OK");
    },
};


