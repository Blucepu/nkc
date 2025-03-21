const { OnlyOperation } = require('../../../middlewares/permission');
const { Operations } = require('../../../settings/operations');

const router = require('koa-router')();
router
  .get(
    '/',
    OnlyOperation(Operations.experimentalFilterLogs),
    async (ctx, next) => {
      const { nkcModules, db, data, query } = ctx;
      const { page = 0 } = query;
      const count = await db.FilterLogModel.countDocuments();
      const paging = nkcModules.apiFunction.paging(page, count);
      const filterLogs = await db.FilterLogModel.find({})
        .sort({ toc: -1 })
        .skip(paging.start)
        .limit(paging.perpage);
      const usersId = filterLogs.map((f) => f.operatorId);
      const usersObj = await db.UserModel.getUsersObjectByUsersId(usersId);
      data.filterLogs = [];
      for (let filterLog of filterLogs) {
        filterLog = filterLog.toObject();
        filterLog.operator = usersObj[filterLog.operatorId];
        filterLog.groups = filterLog.groups.map((group) => {
          if (group.id !== 'custom') {
            group.keywords = [];
          }
          return group;
        });
        data.filterLogs.push(filterLog);
      }
      data.paging = paging;
      ctx.template = 'experimental/log/filter.pug';
      await next();
    },
  )
  .post(
    '/',
    OnlyOperation(Operations.experimentalFilterLogs),
    async (ctx, next) => {
      const { body, db } = ctx;
      const { filterLogId, markUnReview } = body;
      const filterLog = await db.FilterLogModel.findOnly({ _id: filterLogId });
      const { targetId } = filterLog.result;
      await db.PostModel.updateMany(
        {
          pid: { $in: targetId },
          reviewed: markUnReview,
        },
        {
          $set: {
            reviewed: !markUnReview,
          },
        },
      );
      await db.ThreadModel.updateMany(
        {
          oc: { $in: targetId },
          reviewed: markUnReview,
        },
        {
          $set: {
            reviewed: !markUnReview,
          },
        },
      );
      await filterLog.updateOne({
        $set: {
          markUnReview,
        },
      });
      await next();
    },
  );
module.exports = router;
