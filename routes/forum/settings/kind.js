const Router = require('koa-router');
const {
  OnlyUnbannedUser,
  OnlyOperation,
} = require('../../../middlewares/permission');
const { Operations } = require('../../../settings/operations');
const kindRouter = new Router();
kindRouter
  .put('/', OnlyOperation(Operations.addForumKind), async (ctx, next) => {
    const { data, db, body, params } = ctx;
    const { fid } = params;
    const { kindName } = body;
    const forum = await db.ForumModel.findOne({ fid });
    // if(forum.parentsId.length !== 0) ctx.throw(400, '该专业不是顶级专业，暂无法更改专业类别');
    const fids = await forum.getAllChildForumsId();
    if (fids.length > 0)
      ctx.throw(400, '该专业下还有子专业，暂无法修改专业类别');
    await forum.updateOne({ $set: { kindName } });
    await next();
  })
  .put('/clear', OnlyOperation(Operations.delForumKind), async (ctx, next) => {
    const { data, db, body, params } = ctx;
    const { fid } = params;
    const forum = await db.ForumModel.findOne({ fid });
    await forum.updateOne({ $set: { kindName: '' } });
    await next();
  });
module.exports = kindRouter;
