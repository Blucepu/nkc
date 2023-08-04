const { isProduction } = require('../settings/env');
module.exports = async (ctx, next) => {
  const { nkcModules, state, url, settings, db } = ctx;
  // 仅仅只针对游客建立缓存
  if (
    ctx.method !== 'GET' ||
    ctx.data.user ||
    ctx.get('FROM') === 'nkcAPI' || // 排除nkcAPI的请求
    ctx.filePath || // 排除资源文件
    ctx.request.accepts('json', 'html') !== 'html' || // 排除非html
    !isProduction // 排除开发环境
  ) {
    return await next();
  }
  const { redisClient } = settings;
  // 缓存时间的键名
  const { web, reactNative, apiCloud } =
    nkcModules.cache.getRedisPageKeyByUrl(url);
  let tocKey = web[0];
  // 缓存内容的键名
  let dataKey = web[1];

  // 同上，但由于APP需要排除页面头尾，所以缓存和web端不公用。
  if (state.isApp) {
    if (state.platform === 'reactNative') {
      tocKey = reactNative[0];
      dataKey = reactNative[1];
    } else {
      tocKey = apiCloud[0];
      dataKey = apiCloud[1];
    }
  }

  const cacheSettings = await db.SettingModel.getSettings('cache');
  // 防止因缓存过期同一时间大量请求数据库
  const lock = await nkcModules.redLock.lock(`page:cache:lock:${url}`, 30000);
  // 获取缓存生成的时间，判断是否过期
  const toc = await redisClient.getAsync(tocKey);
  const cachedHTML = await redisClient.getAsync(dataKey);
  if (
    !toc ||
    !cachedHTML ||
    ctx.reqTime.getTime() - Number(toc) >
      cacheSettings.visitorPageCacheTime * 1000
  ) {
    state.cachePage = true;
  } else {
    await lock.unlock();
    // 记录并在控制台打印日志
    ctx.set('Content-Type', 'text/html');
    ctx.logIt = true;
    // 阅读文章则文章浏览量加一
    const url_ = url.replace(/\?.*/, '');
    const tid = url_.replace(/\/t\/(.*)/i, '$1');
    if (tid !== url_) {
      await db.ThreadModel.updateOne({ tid }, { $inc: { hits: 1 } });
    }
    return (ctx.body = cachedHTML);
  }
  try {
    await next();
  } catch (err) {
    await lock.unlock();
    throw err;
  }
  // 如果不需要缓存页面或请求的是文件或状态码不是200，则不建立缓存
  if (ctx.filePath || !state.cachePage || ctx.status !== 200) {
    await lock.unlock();
    return;
  }
  const html = ctx.body.toString();
  // html页面内容存入redis，并且设置一个过期时间，减少redis的内存占用
  await redisClient.setWithTimeoutAsync(
    tocKey,
    ctx.reqTime.getTime(),
    cacheSettings.visitorPageCacheTime,
  );
  await redisClient.setWithTimeoutAsync(
    dataKey,
    html,
    cacheSettings.visitorPageCacheTime,
  );
  await lock.unlock();
  setImmediate(async () => {
    // 生成缓存记录
    const cache = await db.CacheModel.findOneAndUpdate(
      {
        key: url,
        type: 'visitorPage',
      },
      {
        $set: {
          toc: ctx.reqTime.getTime(),
        },
      },
    );
    if (!cache) {
      await db
        .CacheModel({
          key: url,
          toc: ctx.reqTime.getTime(),
          type: 'visitorPage',
        })
        .save();
    }
  });
};
