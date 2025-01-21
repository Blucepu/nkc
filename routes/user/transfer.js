const router = require('koa-router')();
const { OnlyUnbannedUser } = require('../../middlewares/permission');
router
  .use('/', OnlyUnbannedUser(), async (ctx, next) => {
    const { nkcModules, data, db } = ctx;
    const { targetUser, user } = data;
    const today = nkcModules.apiFunction.today();
    const { kcbOnce, countOneDay, countToUserOneDay } =
      await db.SettingModel.getSettings('transfer');

    data.shopScore = await db.SettingModel.getScoreByOperationType('shopScore');

    data.kcbOnce = kcbOnce;

    if (targetUser.uid === user.uid) {
      ctx.throw(403, `不允许给自己转账`);
    }

    // 判断是否发生过交易 账单
    const order = await db.ShopOrdersModel.findOne({
      sellUid: user.uid,
      buyUid: targetUser.uid,
      orderStatus: { $ne: 'unCost' },
    });

    if (!order) {
      ctx.throw(403, '对方未购买过你出售的商品，无法转账');
    }

    const transferCount = await db.KcbsRecordModel.countDocuments({
      from: user.uid,
      type: 'transferToUser',
      toc: { $gte: today },
    });
    const transferToUserCount = await db.KcbsRecordModel.countDocuments({
      from: user.uid,
      type: 'transferToUser',
      toc: { $gte: today },
      to: targetUser.uid,
    });
    if (transferCount >= countOneDay) {
      ctx.throw(403, '你当天的转账总次数已达上限');
    } else if (transferToUserCount >= countToUserOneDay) {
      ctx.throw(403, '你当天与对方的转账总次数已达上限');
    }
    await next();
  })
  .get('/', OnlyUnbannedUser(), async (ctx, next) => {
    await next();
  })
  .post('/', OnlyUnbannedUser(), async (ctx, next) => {
    const { db, body, nkcModules, data } = ctx;
    const lock = await nkcModules.redLock.redLock.lock('creditKCB', 6000);
    try {
      const { checkNumber } = nkcModules.checkData;
      const { password, number } = body;
      const { user, kcbOnce, targetUser, shopScore } = data;
      checkNumber(number, {
        name: '转账金额',
        min: 1,
      });
      if (!password) {
        ctx.throw(400, '密码不能为空');
      }
      if (number > kcbOnce) {
        ctx.throw(
          400,
          `转账金额不能超过${kcbOnce / 100}${shopScore.unit}${shopScore.name}`,
        );
      }
      const usersPersonal = await db.UsersPersonalModel.findOnly({
        uid: user.uid,
      });
      await usersPersonal.ensurePassword(password);

      await db.UserModel.updateUserScores(user.uid);
      // await db.UserModel.updateUserKcb(user.uid);

      const userScore = await db.UserModel.getUserScore(
        user.uid,
        shopScore.type,
      );

      if (userScore < number) {
        ctx.throw(400, `你的${shopScore.name}不足`);
      }

      const record = db.KcbsRecordModel({
        _id: await db.SettingModel.operateSystemID('kcbsRecords', 1),
        scoreType: shopScore.type,
        from: user.uid,
        to: targetUser.uid,
        type: 'transferToUser',
        num: number,
        ip: ctx.address,
        port: ctx.port,
      });

      await record.save();

      await db.UserModel.updateUserScores(user.uid);
      await db.UserModel.updateUserScores(targetUser.uid);

      await lock.unlock();
    } catch (err) {
      await lock.unlock();
      throw err;
    }
    // await db.UserModel.updateUserKcb(user.uid);
    // await db.UserModel.updateUserKcb(targetUser.uid);
    await next();
  });
module.exports = router;
