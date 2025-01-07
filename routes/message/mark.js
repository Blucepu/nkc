const Router = require('koa-router');
const markRouter = new Router();
const { OnlyUnbannedUser } = require('../../middlewares/permission');
markRouter.put('/', OnlyUnbannedUser(), async (ctx, next) => {
  const { data, db, body, nkcModules } = ctx;
  const { type, uid } = body;
  const { user } = data;
  await db.MessageModel.markAsRead(type, user.uid, uid);
  await nkcModules.socket.sendEventMarkAsRead(type, user.uid, uid);
  await next();
});
module.exports = markRouter;
