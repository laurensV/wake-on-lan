const Koa = require('koa');
const cors = require('@koa/cors');
const koaBody = require('koa-body');
const contextMiddleware = require('./src/middleware/context');
const errorMiddleware = require('./src/middleware/error');
const router = require('./src/router');

const app = new Koa();

app.use(cors())
    .use(koaBody())
    .use(contextMiddleware())
    .use(errorMiddleware())
    .use(router.routes())
    .use(router.allowedMethods());

app.listen(3000, () => console.log('running on port 3000'));