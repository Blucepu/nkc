const Router = require('koa-router');
const { OnlyOperation } = require('../../../middlewares/permission');
const { Operations } = require('../../../settings/operations');
const disabledRouter = new Router();
disabledRouter.put(
  '/',
  OnlyOperation(Operations.modifyFundApplicationFormStatus),
  async (ctx, next) => {
    const { data, body, db } = ctx;
    const { applicationForm, user } = data;
    if (!(await applicationForm.fund.ensureOperatorPermission('admin', user)))
      ctx.throw(403, '抱歉！您没有权限进行屏蔽操作。');
    const { type } = body;
    applicationForm.disabled = type;
    await applicationForm.save();
    const recycleId = await db.SettingModel.getRecycleId();
    const thread = await db.ThreadModel.findOnly({ tid: applicationForm.tid });
    let fids;
    if (type) {
      fids = new Set(thread.mainForumsId);
      fids.add(recycleId);
      await thread.updateOne({ mainForumsId: [recycleId] });
    } else {
      const fundForums = await db.ForumModel.find({ kindName: 'fund' });
      fids = new Set();
      for (const forum of fundForums) {
        fids.add(forum.fid);
      }
      fids.add(applicationForm.category);
      await thread.updateOne({ mainForumsId: [...fids] });
      fids.add(recycleId);
    }
    const targetUser = await db.UserModel.findOnly({
      uid: applicationForm.uid,
    });
    await targetUser.updateUserMessage();
    await next();
  },
);
module.exports = disabledRouter;
