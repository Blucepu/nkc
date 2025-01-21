const Router = require('koa-router');
const settingsRouter = new Router();
const infoRouter = require('./info');
const imageRouter = require('./image');
const categoryRouter = require('./category');
const kindRouter = require('./kind');
const permissionRouter = require('./permission');
const mergeRouter = require('./merge');
const scoreRouter = require('./score');
const reviewRouter = require('./review');
const { OnlyUser, OnlyOperation } = require('../../../middlewares/permission');
const { Operations } = require('../../../settings/operations');
settingsRouter
  .use(
    '/',
    OnlyOperation(Operations.visitForumInfoSettings),
    async (ctx, next) => {
      const { data, db, params, url } = ctx;
      const { fid } = params;
      const forum = await db.ForumModel.findOnly({ fid });
      data.forum = forum;
      const isModerator =
        (await forum.isModerator(data.user)) ||
        ctx.permission('superModerator');
      if (!isModerator) ctx.throw(403, '权限不足');
      data.isModerator = isModerator;
      data.forums = await db.ForumModel.find({}).sort({ order: 1 });
      const urlArr = url.split('/');
      const type = urlArr[urlArr.length - 1];
      data.type = type === 'settings' ? 'info' : type;
      data.breadcrumbForums = await data.forum.getBreadcrumbForums();
      const length = data.breadcrumbForums.length;
      data.level1Forums = await db.ForumModel.find({ parentsId: [] }).sort({
        order: 1,
      });
      if (length === 0) {
        data.sameLevelForums = data.level1Forums;
      } else {
        const parentForum =
          data.breadcrumbForums[data.breadcrumbForums.length - 1];
        data.sameLevelForums = await db.ForumModel.find({
          parentsId: parentForum.fid,
        }).sort({ order: 1 });
      }
      data.childrenForums = await db.ForumModel.find({
        parentsId: data.forum.fid,
      }).sort({ order: 1 });
      await next();
    },
  )
  .get('/', OnlyOperation(Operations.visitForumInfoSettings), async (ctx) => {
    const { nkcModules } = ctx;
    const fid = ctx.params.fid;
    return ctx.redirect(`/f/${fid}/settings/info`);
  })
  .use(
    '/permission',
    permissionRouter.routes(),
    permissionRouter.allowedMethods(),
  )
  .use('/category', categoryRouter.routes(), categoryRouter.allowedMethods())
  .use('/kind', kindRouter.routes(), kindRouter.allowedMethods())
  .use('/info', infoRouter.routes(), infoRouter.allowedMethods())
  .use('/score', scoreRouter.routes(), scoreRouter.allowedMethods())
  .use('/merge', mergeRouter.routes(), mergeRouter.allowedMethods())
  .use('/review', reviewRouter.routes(), reviewRouter.allowedMethods());
module.exports = settingsRouter;
