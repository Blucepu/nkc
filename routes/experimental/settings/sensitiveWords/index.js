const Router = require('koa-router');
const {
  sensitiveSettingService,
} = require('../../../../services/sensitive/sensitiveSetting.service');
const {
  sensitiveCheckerService,
} = require('../../../../services/sensitive/sensitiveChecker.service');
const { OnlyOperation } = require('../../../../middlewares/permission');
const { Operations } = require('../../../../settings/operations');
const router = new Router();
router
  .get('/', OnlyOperation(Operations.sensitiveWords), async (ctx, next) => {
    const { data, db } = ctx;
    const reviewSettings = await db.SettingModel.getSettings('review');
    data.keywordSetting = reviewSettings.keyword;
    data.sensitiveSettings = await sensitiveSettingService.getAllSettingsDetail(
      ctx.acceptLanguage,
    );
    ctx.template = 'experimental/settings/sensitiveWords/sensitiveWords.pug';
    await next();
  })
  .put('/', OnlyOperation(Operations.sensitiveWords), async (ctx, next) => {
    const { sensitiveSettings } = ctx.body;
    for (const setting of sensitiveSettings) {
      const { iid, enabled, desc, groupIds } = setting;
      await sensitiveSettingService.updateSetting({
        iid,
        enabled,
        desc,
        groupIds,
      });
    }
    await sensitiveSettingService.saveAllSettingsToCache();
    await next();
  })
  .post(
    '/checker',
    OnlyOperation(Operations.sensitiveWords),
    async (ctx, next) => {
      const { type } = ctx.body;
      await sensitiveSettingService.checkSensitiveType(type);
      await sensitiveCheckerService.runNewCheck(type, ctx.state.uid);
      await next();
    },
  );

module.exports = router;
