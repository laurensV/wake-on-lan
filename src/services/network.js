const dgram = require('dgram');
const os = require('os');
const dns = require('dns');

module.exports = {
     get_local_ip: async function () {
        const s = new dgram.createSocket('udp4');
        return new Promise((resolve, reject) => {
            try {
                s.connect(1, '8.8.8.8', function () {
                    const ip = s.address();
                    s.close();
                    resolve(ip.address);
                });
            } catch (e) {
                console.error(e);
                s.close();
                reject(e);
            }
        })
    },
    get_name_from_ip: async function (ip) {
        try {
            const res = await dns.promises.lookupService(ip, 0);
            return res.hostname;
        } catch (e) {
            reject(e);
        }
    },
    get_default_gateway: async function () {
        const ifs = [].concat(...Object.values(os.networkInterfaces())).filter(x => !x.internal && x.family === 'IPv4')
        if (!ifs.length > 0) return null;
        else if (ifs.length === 1) return ifs[0]
        else {
            // Multiple interfaces possible, we'll use the one that is connecting to the internet
            const ip = await this.get_local_ip();
            return ifs.find(x => x.address === ip);
        }
    }
}