const { OnlyOperation } = require('../../middlewares/permission');
const { Operations } = require('../../settings/operations');

const router = require('koa-router')();
router
  .post('/', OnlyOperation(Operations.homeHotColumn), async (ctx, next) => {
    const { db, data } = ctx;
    const { column } = data;
    const homeSettings = await db.SettingModel.getSettings('home');
    if (homeSettings.columnsId.includes(column._id)) {
      ctx.throw(400, '专栏已经被设为热门了');
    }
    homeSettings.columnsId.unshift(column._id);
    await db.SettingModel.updateOne(
      { _id: 'home' },
      {
        $set: {
          'c.columnsId': homeSettings.columnsId,
        },
      },
    );
    await db.SettingModel.saveSettingsToRedis('home');
    await next();
  })
  .del('/', OnlyOperation(Operations.homeHotColumn), async (ctx, next) => {
    const { db, data } = ctx;
    const { column } = data;
    const homeSettings = await db.SettingModel.getSettings('home');
    if (!homeSettings.columnsId.includes(column._id)) {
      ctx.throw(400, '专栏未被设为热门');
    }
    await db.SettingModel.updateOne(
      { _id: 'home' },
      {
        $pull: {
          'c.columnsId': column._id,
        },
      },
    );
    await db.SettingModel.saveSettingsToRedis('home');
    await next();
  });
module.exports = router;
