const Router = require('@koa/router');

const router = new Router();

const devicesController = require('./controller/devices');

router.get('/devices', devicesController.getDevices);
router.post('/devices/ping', devicesController.pingDevice);
router.post('/devices/wol', devicesController.wolDevice);

module.exports = router;
