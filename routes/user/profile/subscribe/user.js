const { subscribeSources } = require('../../../../settings/subscribe');
module.exports = async (ctx, next) => {
  const { state, data, db, query, nkcModules } = ctx;
  const { page = 0 } = query;
  const { match } = state;

  match.source = subscribeSources.user;
  match.uid = data.targetUser.uid;
  match.cancel = false;
  const count = await db.SubscribeModel.countDocuments(match);
  const paging = nkcModules.apiFunction.paging(page, count);
  let subscribes = await db.SubscribeModel.find(match)
    .sort({ toc: -1 })
    .skip(paging.start)
    .limit(paging.perpage);
  const subscribesObj = {};
  subscribes.map((s) => (subscribesObj[s.sid] = s));
  data.subscribes = await db.SubscribeModel.extendSubscribes(subscribes);
  data.subscribesObj = subscribesObj;
  data.paging = paging;
  await next();
};
