const Router = require('koa-router');
const { OnlyOperation } = require('../../../../middlewares/permission');
const { Operations } = require('../../../../settings/operations');
const userRouter = new Router();
userRouter
  .use(
    '/',
    OnlyOperation(Operations.visitUserSensitiveInfo),
    async (ctx, next) => {
      ctx.template = 'experimental/settings/userSensitive.pug';
      ctx.data.type = 'user-sensitive';
      await next();
    },
  )
  .get(
    '/',
    OnlyOperation(Operations.visitUserSensitiveInfo),
    async (ctx, next) => {
      const { query, data, db } = ctx;
      let { page = 0, searchType, content } = query;
      const { apiFunction } = ctx.nkcModules;
      if (searchType === 'username') {
        const count = await db.UserModel.find({
          usernameLowerCase: content.toLowerCase(),
        }).countDocuments();
        const paging = apiFunction.paging(page, count);
        data.paging = paging;
        data.users = await db.UserModel.find({
          usernameLowerCase: content.toLowerCase(),
        })
          .sort({ toc: -1 })
          .skip(paging.start)
          .limit(paging.perpage);
      } else if (searchType === 'uid') {
        const count = await db.UserModel.find({
          uid: content,
        }).countDocuments();
        const paging = apiFunction.paging(page, count);
        data.paging = paging;
        data.users = await db.UserModel.find({ uid: content })
          .sort({ toc: -1 })
          .skip(paging.start)
          .limit(paging.perpage);
      } else if (searchType === 'mobile') {
        const targetUsersPersonal = await db.UsersPersonalModel.find({
          mobile: content,
        });
        const uid = targetUsersPersonal.map((t) => t.uid);
        const count = await db.UserModel.find({
          uid: { $in: uid },
        }).countDocuments();
        const paging = apiFunction.paging(page, count);
        data.paging = paging;
        data.users = await db.UserModel.find({ uid: { $in: uid } })
          .sort({ toc: -1 })
          .skip(paging.start)
          .limit(paging.perpage);
      } else if (searchType === 'email') {
        const targetUserPersonal = await db.UsersPersonalModel.find({
          email: content,
        });
        const uid = targetUserPersonal.map((t) => t.uid);
        const count = await db.UserModel.find({
          uid: { $in: uid },
        }).countDocuments();
        const paging = apiFunction.paging(page, count);
        data.paging = paging;
        data.users = await db.UserModel.find({ uid: { $in: uid } })
          .sort({ toc: -1 })
          .skip(paging.start)
          .limit(paging.perpage);
      } else {
        const count = await db.UserModel.countDocuments();
        const paging = apiFunction.paging(page, count);
        data.paging = paging;
        data.users = await db.UserModel.find({})
          .sort({ toc: -1 })
          .skip(paging.start)
          .limit(paging.perpage);
      }

      data.users = await Promise.all(
        data.users.map(async (user) => {
          await user.extend();
          return user;
        }),
      );

      await next();
    },
  )
  .put(
    '/',
    OnlyOperation(Operations.modifyUserSensitiveInfo),
    async (ctx, next) => {
      let { data } = ctx;
      data.message = '123123333';
      await next();
    },
  );

module.exports = userRouter;
