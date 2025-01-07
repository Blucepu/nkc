const Router = require('koa-router');
const chatRouter = new Router();
const { OnlyUnbannedUser } = require('../../middlewares/permission');
chatRouter.del('/', OnlyUnbannedUser(), async (ctx, next) => {
  const { nkcModules, data, query, db } = ctx;
  const { user } = data;
  let { uid, type } = query;
  if (uid === 'null') {
    uid = null;
  }
  await db.CreatedChatModel.removeChat(type, user.uid, uid);
  await nkcModules.socket.sendEventRemoveChat(type, user.uid, uid);
  await next();
});
module.exports = chatRouter;
