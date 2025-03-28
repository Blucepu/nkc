const Router = require('koa-router');
const { OnlyOperation } = require('../../../../middlewares/permission');
const { Operations } = require('../../../../settings/operations');
const router = new Router();
router
  .get('/', OnlyOperation(Operations.visitExamSettings), async (ctx, next) => {
    const { db, data } = ctx;
    data.examSettings = (await db.SettingModel.findOnly({ _id: 'exam' })).c;
    ctx.template = 'experimental/settings/exam.pug';
    await next();
  })
  .put('/', OnlyOperation(Operations.modifyExamSettings), async (ctx, next) => {
    const { db, body } = ctx;
    const { examSettings } = body;
    let {
      count,
      countOneDay,
      waitingTime,
      examNotes,
      volumeADNotes,
      volumeANotes,
      volumeBNotes,
    } = examSettings;
    count = Number(count);
    countOneDay = Number(countOneDay);
    waitingTime = Number(waitingTime);
    if (isNaN(count) || isNaN(countOneDay) || isNaN(waitingTime)) {
      ctx.throw(400, '数据格式错误');
    }
    if (count < 1) {
      ctx.throw(400, '总次数限制不能小于1');
    }
    if (countOneDay < 1) {
      ctx.throw(400, '每天最多考试次数不能小于1');
    }
    if (waitingTime < 0) {
      ctx.throw(400, '禁考时间不能小于0');
    }
    await db.SettingModel.updateOne(
      { _id: 'exam' },
      {
        $set: {
          c: {
            count,
            countOneDay,
            waitingTime,
            examNotes,
            volumeADNotes,
            volumeANotes,
            volumeBNotes,
          },
        },
      },
    );
    await db.SettingModel.saveSettingsToRedis('exam');
    await next();
  });
module.exports = router;
