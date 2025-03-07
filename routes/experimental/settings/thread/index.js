const { OnlyOperation } = require('../../../../middlewares/permission');
const { Operations } = require('../../../../settings/operations');

const router = require('koa-router')();
router
  .get(
    '/',
    OnlyOperation(Operations.experimentalThreadSettings),
    async (ctx, next) => {
      const { data, db } = ctx;
      data.threadSettings = await db.SettingModel.getSettings('thread');
      data.grades = await db.UsersGradeModel.find({}).sort({ toc: -1 });
      data.roles = await db.RoleModel.find({ _id: { $nin: ['default'] } }).sort(
        {
          toc: -1,
        },
      );
      ctx.template = 'experimental/settings/thread/thread.pug';
      await next();
    },
  )
  .put(
    '/',
    OnlyOperation(Operations.experimentalThreadSettings),
    async (ctx, next) => {
      const { db, body, nkcModules } = ctx;
      let { gradesId, rolesId } = body.threadSettings.displayPostAttachments;
      const { disablePost, voteUpPost } = body.threadSettings;
      let { isDisplay, tipContent } = body.threadSettings.playerTips;
      const { confirm } = body.threadSettings.offsiteLink;
      rolesId = rolesId.filter((r) => r !== 'default');
      const grades = await db.UsersGradeModel.find({ _id: { $in: gradesId } });
      const roles = await db.RoleModel.find({ _id: { $in: rolesId } });
      const disablePostRoles = await db.RoleModel.find({
        _id: {
          $in: disablePost.rolesId,
          $ne: 'default',
        },
      });
      const disablePostGrades = await db.UsersGradeModel.find({
        _id: { $in: disablePost.gradesId },
      });
      disablePost.status = !!disablePost.status;
      const { checkNumber } = nkcModules.checkData;
      if (!['show', 'hide'].includes(voteUpPost.status)) {
        ctx.throw(400, `高赞回复列表状态类型错误`);
      }
      checkNumber(voteUpPost.postCount, {
        name: '高赞回复列表 - 高赞回复数',
        min: 1,
      });
      checkNumber(voteUpPost.voteUpCount, {
        name: '高赞回复列表 - 最小点赞数',
        min: 1,
      });
      checkNumber(voteUpPost.voteDownRatio, {
        name: '高赞回复列表 - 最大点踩比例',
        min: 0,
        max: 100,
        fractionDigits: 1,
      });
      checkNumber(voteUpPost.selectedPostCount, {
        name: '高赞回复列表 - 选取高赞回复数',
      });
      await db.SettingModel.updateOne(
        {
          _id: 'thread',
        },
        {
          $set: {
            'c.displayPostAttachments': {
              rolesId: roles.map((r) => r._id),
              gradesId: grades.map((g) => g._id),
            },
            'c.playerTips': {
              isDisplay,
              tipContent,
            },
            'c.disablePost': {
              status: !!disablePost.status,
              time: (disablePost.time || '2000-01-01').trim(),
              errorInfo: disablePost.errorInfo || '',
              rolesId: disablePostRoles.map((r) => r._id),
              gradesId: disablePostGrades.map((g) => g._id),
              allowAuthor: !!disablePost.allowAuthor,
            },
            'c.offsiteLink': {
              confirm,
            },
            'c.voteUpPost': {
              status: voteUpPost.status,
              voteUpCount: voteUpPost.voteUpCount,
              voteDownRatio: voteUpPost.voteDownRatio,
              postCount: voteUpPost.postCount,
              selectedPostCount: voteUpPost.selectedPostCount,
            },
          },
        },
      );
      await db.SettingModel.saveSettingsToRedis('thread');
      await next();
    },
  );
module.exports = router;
