const Router = require('@koa/router');

const router = new Router();
const wol = require('wake_on_lan');

router.get('/', ctx => {
    const MAC = '44:8A:5B:5C:06:97';

    wol.wake(MAC, function(error) {
        if (error) {
            console.log("Could not send wol")
        } else {
            console.log("wol packet sent!")
        }
    });

    ctx.ok("OK");
});

module.exports = router;
