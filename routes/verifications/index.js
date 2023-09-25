const router = require('koa-router')();
router
  .get('/', async (ctx, next) => {
    const { query, data, db } = ctx;
    data.verificationData = await db.VerificationModel.getVerificationData({
      uid: data.user ? data.user.uid : '',
      ip: ctx.address,
      port: ctx.port,
      type: query.type,
    });
    await next();
  })
  .post('/', async (ctx, next) => {
    const { body, db, data } = ctx;
    const { verificationData } = body;
    verificationData.ip = ctx.address;
    verificationData.uid = data.user ? data.user.uid : '';
    data.secret = await db.VerificationModel.verifyData(verificationData);
    await next();
  });
module.exports = router;
