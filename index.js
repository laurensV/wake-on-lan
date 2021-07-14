const Koa = require('koa');
const cors = require('@koa/cors');
const koaBody = require('koa-body');
const serve = require('koa-static');
const contextMiddleware = require('./src/middleware/context');
const errorMiddleware = require('./src/middleware/error');
const router = require('./src/router');
const fs = require('fs');


const app = new Koa();

app.use(cors())
    .use(koaBody())
    .use(contextMiddleware())
    .use(errorMiddleware())
    .use(router.routes())
    .use(router.allowedMethods())
    .use(serve('public', {extensions: true}))
    .use(async function pageNotFound(ctx) {
        ctx.status = 404;
        ctx.type = 'html';
        ctx.body = fs.createReadStream('public/404.html');
    });

app.listen(3000, () => console.log('running on port 3000'));