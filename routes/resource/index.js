const Router = require('koa-router');
const resourceRouter = new Router();
const infoRouter = require('./info');
const payRouter = require('./pay');
const detailRouter = require('./detail');
const coverRouter = require('./cover');
const { ThrottleGroup } = require('stream-throttle');

// 存放用户设置
const downloadGroups = {};

/*
{
  tg: Object, // 限速
  rate: 2345, // 速度 b
}
*/

resourceRouter
  .use('/:rid', async (ctx, next) => {
    const { data, db, params } = ctx;
    const { rid } = params;
    data.resource = await db.ResourceModel.findOnly({ rid, type: 'resource' });
    await data.resource.filenameFilter();
    if (ctx.url !== `/r/${rid}` || ctx.method !== 'PUT') {
      if (data.resource.disabled) {
        ctx.throw(404, `资源已被屏蔽`);
      }
    }
    await next();
  })
  .get('/:rid', async (ctx, next) => {
    const { state, query, data, db, settings, nkcModules } = ctx;
    // 分享的 post 时，浏览器会将 token、pid 添加到 资源链接后
    const { t, d, w } = query;
    const { cache } = settings;
    const { resource, user } = data;
    if (resource.uid !== state.uid) {
      // 不是自己的附件需判断权限
      const accessibleForumsId = await db.ForumModel.getAccessibleForumsId(
        data.userRoles,
        data.userGrade,
        user,
      );
      const refererString = ctx.get('referer');
      let token;
      let hasPermission = false;
      try {
        const referer = new URL(refererString);
        token = referer.searchParams.get('token');
      } catch (err) {
        //
      }
      if (token) {
        // 存在 token，判断来源
        const tidReg = /\/t\/([0-9a-zA-Z]+)/i;
        const pidReg = /\/p\/([0-9a-zA-Z]+)/i;
        let tid = refererString.match(tidReg);
        let pid = refererString.match(pidReg);
        tid = tid ? tid[1] : '';
        pid = pid ? pid[1] : '';
        // 根据来源判断与来源相关的 post
        let postsId = [];
        if (pid) {
          const post = await db.PostModel.findOne({ pid }, { type: 1, tid: 1 });
          if (post.type === 'thread') {
            tid = post.tid;
          } else {
            const childPosts = await db.PostModel.find(
              { parentPostsId: pid },
              { pid: 1 },
            );
            postsId = childPosts.map((post) => post.pid);
            postsId.push(pid);
          }
        }
        if (tid) {
          const posts = await db.PostModel.find({ tid }, { pid: 1 });
          postsId = postsId.concat(posts.map((post) => post.pid));
        }
        postsId = [...new Set(postsId)];
        const total = postsId.length + resource.references.length;
        const filterTotal = new Set(postsId.concat(resource.references)).size;
        if (filterTotal < total) {
          // 当前资源与 token 分享的 post 有交集
          // 判断 token 是否有效
          try {
            // 判断 token 是否有效
            await db.ShareModel.ensureEffective(token);
            hasPermission = true;
          } catch (err) {
            //
          }
        }
      }
      // token 无效，，判断用户是否有权访问资源所在 post
      if (!hasPermission) {
        await resource.checkAccessPermission(accessibleForumsId);
      }
    }
    const { mediaType } = resource;
    let remoteFile = await resource.getRemoteFile(t);
    let speed;
    data.resource = resource;
    data.rid = resource.rid;
    let isPreviewPDF = false;
    let checkScore = false;
    if (mediaType === 'mediaAttachment') {
      checkScore = true;
    } else if (['mediaVideo', 'mediaAudio'].includes(mediaType)) {
      if (
        (!user || user.uid !== resource.uid) &&
        (!w || !(await resource.checkToken(w)))
      ) {
        checkScore = true;
      }
    }
    if (checkScore) {
      // 获取用户有关下载的时段和数量信息，用户前端展示给用户
      data.fileCountLimitInfo =
        await db.SettingModel.getDownloadFileCountLimitInfoByUser(data.user);
      const downloadOptions = await db.SettingModel.getDownloadSettingsByUser(
        data.user,
      );
      // 获取当前时段的最大下载速度
      speed = downloadOptions.speed;

      // 检测 是否需要积分
      const freeTime = 24 * 60 * 60 * 1000;
      const { needScore, reason } = await resource.checkDownloadCost(
        data.user,
        freeTime,
      );
      isPreviewPDF = needScore && resource.ext === 'pdf';

      // 非pdf预览或者并且没有下载过，判断下载次数是否足够
      if (!(isPreviewPDF || reason === 'repeat')) {
        await resource.checkDownloadPermission(data.user, ctx.address);
      }
      // 下载需要积分，返回预览版
      if (needScore) {
        if (resource.ext !== 'pdf') {
          nkcModules.throwError(403, `当前附件需支付积分后才可下载`);
        } else {
          remoteFile = await resource.getRemoteFile('preview');
        }
      }
      // 不要把这次的响应结果缓存下来
      ctx.dontCacheFile = true;
    }
    if (mediaType === 'mediaPicture') {
      ctx.set('Cache-Control', `public, max-age=${cache.maxAge}`);
    }
    // 在resource中添加点击次数
    if (!ctx.request.headers['range']) {
      await resource.updateOne({ $inc: { hits: 1 } });
    }
    // 表明客户端希望以附件的形式加载资源
    if (d === 'attachment') {
      ctx.isAttachment = true;
      ctx.fileType = 'attachment';
    }
    ctx.resource = resource;
    ctx.remoteFile = remoteFile;
    // 限速
    if (checkScore) {
      let key;
      if (data.user) {
        key = `user_${data.user.uid}`;
      } else {
        key = `ip_${ctx.address}`;
      }
      let speedObj = downloadGroups[key];
      if (!speedObj || speedObj.speed !== speed) {
        speedObj = {
          tg: new ThrottleGroup({ rate: speed * 1024 }),
          speed,
        };
        downloadGroups[key] = speedObj;
      }
      ctx.tg = speedObj.tg;
      if (!isPreviewPDF) {
        // 写入下载记录
        const downloadLog = db.DownloadLogModel({
          uid: data.user ? data.user.uid : '',
          ip: ctx.address,
          port: ctx.port,
          rid: resource.rid,
        });
        await downloadLog.save();
      }
    }
    await next();
  })
  .use('/:rid', async (ctx, next) => {
    const { db, data, settings } = ctx;
    // 游客限制
    const { user, resource } = data;
    if (!user) {
      const { visitorAccess } = await db.SettingModel.getSettings('download');
      if (!visitorAccess[resource.mediaType]) {
        if (resource.mediaType === 'mediaPicture') {
          ctx.filePath = settings.statics.defaultNoAccessImagePath;
        } else {
          ctx.throw(403, `权限不足，请登录或注册`);
        }
      }
    }
    await next();
  })
  .post('/', async (ctx, next) => {
    //用户上传文件
    const { db, data, nkcModules, state } = ctx;
    const { user } = data;
    const { files, fields } = ctx.body;
    const { file } = files;
    const { type, share, cid } = fields;
    if (!file) {
      ctx.throw(400, 'no file uploaded');
    }
    const { name, size, hash } = file;
    // 验证上传权限
    await db.ResourceModel.checkUploadPermission(user, file);

    const extension = await nkcModules.file.getFileExtension(file);

    const rid = await db.SettingModel.operateSystemID('resources', 1);

    const mediaType = db.ResourceModel.getMediaTypeByExtension(extension);
    const currentTime = Date.now();
    const oneHourInMs = 60 * 60 * 1000; // 一小时的毫秒数

    const resourceType =
      mediaType === 'mediaPicture' && type === 'sticker'
        ? 'sticker'
        : 'resource';

    const resourceInfo = {
      rid,
      type: resourceType,
      oname: name,
      ext: extension,
      size,
      hash,
      uid: state.uid,
      // toc: fields.toc || Date.now(),
      toc:
        fields.toc &&
        Number(fields.toc) >= currentTime - oneHourInMs &&
        Number(fields.toc) <= currentTime + oneHourInMs
          ? fields.toc
          : currentTime,
      mediaType,
      state: 'inProcess',
    };

    if (cid && cid !== 'default' && cid !== 'all' && cid !== 'trash') {
      resourceInfo.cid = cid;
    }

    const r = db.ResourceModel(resourceInfo);

    // 创建表情数据
    if (type === 'sticker') {
      if (mediaType !== 'mediaPicture') {
        ctx.throw(400, '图片格式错误');
      }
      await db.StickerModel.uploadSticker({
        rid,
        uid: data.user.uid,
        share: !!share,
      });
    }

    await r.save();
    data.r = r;
    // 将文件推送到 media service
    r.pushToMediaService(file.path).catch(async (err) => {
      await db.ResourceModel.updateResourceStatus({
        rid,
        status: false,
        error: err.message,
      });
    });
    await next();
  })
  .put('/:rid', async (ctx, next) => {
    const { data, body } = ctx;
    const { resource } = data;
    const { disabled } = body;
    if (resource.disabled) {
      if (disabled) {
        ctx.throw(400, `资源已被屏蔽`);
      }
    } else {
      if (!disabled) {
        ctx.throw(400, `资源未被屏蔽`);
      }
    }
    resource.disabled = !!disabled;
    await resource.updateOne({
      $set: {
        disabled: resource.disabled,
      },
    });
    await next();
  })
  .post('/:rid/del', async (ctx, next) => {
    const { db, body } = ctx;
    const { type, resources } = body;
    let del = type === 'delete';
    await db.ResourceModel.updateMany({ rid: { $in: resources } }, { del });
    await ctx.nkcModules.socket.sendResourcesMessage(ctx.state.uid);
    await next();
  })
  .use('/:rid/info', infoRouter.routes(), infoRouter.allowedMethods())
  .use('/:rid/pay', payRouter.routes(), payRouter.allowedMethods())
  .use('/:rid/detail', detailRouter.routes(), detailRouter.allowedMethods())
  .use('/:rid/cover', coverRouter.routes(), coverRouter.allowedMethods());
module.exports = resourceRouter;
