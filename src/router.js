const Router = require('@koa/router');

const router = new Router();

const devicesController = require('./controller/devices');

router.get('/devices', devicesController.getDevices);
router.get('/devices/find', devicesController.findDevices);
router.post('/devices/add', devicesController.addDevice);
router.post('/devices/remove', devicesController.removeDevice);
router.post('/devices/update', devicesController.updateDevice);
router.post('/devices/ping', devicesController.pingDevice);
router.post('/devices/wol', devicesController.wolDevice);

module.exports = router;
