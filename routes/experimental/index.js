const Router = require('koa-router');
const settingRouter = require('./settings');
const logRouter = require('./log');
const sysInfoRouter = require('./systemInfo');
const consoleRouter = require('./console');
const loginRouter = require('./login');
const authRouter = require('./auth');
const toolsRouter = require('./tools');

const { OnlyOperation } = require('../../middlewares/permission');
const { Operations } = require('../../settings/operations');
const experimentalRouter = new Router();
experimentalRouter
  .use(
    '/',
    OnlyOperation(Operations.visitExperimentalStatus),
    async (ctx, next) => {
      const { data, path, db } = ctx;
      const toUrl = ctx.request.url;
      if (path === '/e/login') {
        return await next();
      }
      if (!data.user) {
        return ctx.redirect('/login');
      }
      const experimentalSettings = await db.SettingModel.findById('safe');
      const {
        experimentalVerifyPassword,
        experimentalTimeout,
        experimentalPassword,
      } = experimentalSettings.c;
      if (experimentalVerifyPassword) {
        const experimental = ctx.getCookie('experimental');
        if (!experimental) {
          return ctx.redirect(`/e/login?toUrl=${toUrl}`);
        }
        const { uid, p, secret, time } = experimental;
        const up = await db.UsersPersonalModel.findOne({
          uid: data.user.uid,
          secret: p,
        });
        if (
          secret !== experimentalPassword.secret ||
          data.user.uid !== uid ||
          !up ||
          Date.now() - time > experimentalTimeout * 60 * 1000
        ) {
          return ctx.redirect(`/e/login?toUrl=${toUrl}`);
        }
        ctx.setCookie('experimental', {
          uid,
          p,
          secret,
          time: Date.now(),
        });
      }
      await next();
    },
  )
  .get('/', OnlyOperation(Operations.visitExperimentalStatus), async (ctx) => {
    return ctx.redirect('/e/console');
  })
  .use('/console', consoleRouter.routes(), consoleRouter.allowedMethods())
  .use('/settings', settingRouter.routes(), settingRouter.allowedMethods())
  .use('/systemInfo', sysInfoRouter.routes(), sysInfoRouter.allowedMethods())
  .use('/login', loginRouter.routes(), loginRouter.allowedMethods())
  .use('/log', logRouter.routes(), logRouter.allowedMethods())
  .use('/auth', authRouter.routes(), authRouter.allowedMethods())
  .use('/tools', toolsRouter.routes(), toolsRouter.allowedMethods());

module.exports = experimentalRouter;
