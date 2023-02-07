const Router = require("koa-router");
const router = new Router();
router
  .post("/", async (ctx, next) => {
    const {data, db, body, nkcModules, settings} = ctx;
    const {user} = data;
    const redis = settings.redis();
    const {postsId, reason, remindUser, violation} = body;
    const results = [];
    const threads = [], threadsId = [];
    const recycleId = await db.SettingModel.getRecycleId();
    // 验证用户权限、验证内容是否存在
    for(const postId of postsId) {
      const post = await db.PostModel.findOne({pid: postId});
      if(!post) ctx.throw(400, `未找到ID为${postId}的post`);
      const thread = await db.ThreadModel.findOne({tid: post.tid});
      if(!thread) ctx.throw(400, `未找到ID为${post.tid}的thread`);
      let type = thread.oc === postId? "thread": "post";
      const isModerator = ctx.permission("superModerator") || await thread.isModerator(user, "or");
      if(!isModerator) ctx.throw(403, `您没有权限处理ID为${postId}的post`);
      if(type === "thread" && thread.mainForumsId.includes(recycleId)) {
        ctx.throw(400, `ID为${thread.tid}的文章已被移动到回收站了，请刷新`);
      }
      if(type === "post" && post.disabled) {
        ctx.throw(400, `ID为${post.pid}的回复已经被屏蔽了，请刷新`);
      }

      results.push({
        type,
        post,
        thread
      });
    }
    let updateForumsId = [];

    for(const r of results) {
      const {type, thread, post} = r;
      ctx.state._scoreOperationForumsId = [].concat(thread.mainForumsId);
      let targetUser;
      if(type === "thread") {
        // 将文章移动至回收站
        targetUser = await thread.extendUser();
        // 获取文章所在专业 文章专业更新后需重新计算相关专业内的文章数量
        const forumsId = thread.mainForumsId;
        forumsId.push(recycleId);
        updateForumsId = updateForumsId.concat(forumsId);
        //  更新文章的专业为回收站，并标记为已屏蔽，且设置审核状态为已通过
        await thread.updateOne({
          mainForumsId: [recycleId],
          categoriesId: [],
          disabled: true,
          recycleMark: false,
          reviewed: true
        });
        await thread.updateThreadMessage();
        data.thread = thread;
        data.post = post;
        // 根据后台科创币设置扣除作者的科创币
        await db.KcbsRecordModel.insertSystemRecord('threadBlocked', targetUser, ctx);
        // 添加日志
        const posts = await db.PostModel.find({tid: thread.tid}, {uid: 1});
        const uidArr = new Set();
        for(const p of posts) {
          uidArr.add(p.uid);
        }
        const delLog = db.DelPostLogModel({
          postedUsers: [...uidArr],
          delUserId: targetUser.uid,
          userId: user.uid,
          delPostTitle: post.t,
          reason,
          postType: "thread",
          threadId: thread.tid,
          noticeType: remindUser
        });
        await delLog.save();
        // 如果文章之前未审核 则生成审核记录
        if(!thread.reviewed) await db.ReviewModel.newReview(
          {
            type: "disabledThread",
            sid:post.pid,
            uid:post.uid,
            reason,
            handlerId:user.uid,
            source:'post'
          }
         );
      } else {
        // 批量屏蔽回复
        if(post.disabled) continue;
        targetUser = await db.UserModel.findOnly({uid: post.uid});
        if(!threadsId.includes(thread.tid)) {
          threads.push(thread);
          threadsId.push(thread.tid);
        }
        await post.updateOne({toDraft: false, reviewed: true, disabled: true});
        await db.KcbsRecordModel.insertSystemRecord('postBlocked', targetUser, ctx);
        const firstPost = await db.PostModel.findOnly({pid: thread.oc});
        const delLog = db.DelPostLogModel({
          delUserId: post.uid,
          userId: user.uid,
          delPostTitle: firstPost?firstPost.t: "",
          reason,
          postType: "post",
          threadId: thread.tid,
          postId: post.pid,
          delType: "toRecycle",
          noticeType: remindUser
        });
        await delLog.save();
        if(!post.reviewed) await db.ReviewModel.newReview(
          {
            type:"disabledPost",
            sid:post.pid,
            uid:post.uid,
            reason,
            handlerId:targetUser.uid,
            source:'post'
          }
         );
      }
      // 标记为违规
      if(violation) {
        //新增违规记录
        await db.UsersScoreLogModel.insertLog({
          user: targetUser,
          type: 'score',
          typeIdOfScoreChange: 'violation',
          port: ctx.port,
          delType: "toRecycle",
          ip: ctx.address,
          key: 'violationCount',
          tid: thread.tid,
          pid: post.pid,
          description: reason || `屏蔽${type === 'thread'? '文章': '回复'}并标记为违规`
        });
        //扣除科创币
        await db.KcbsRecordModel.insertSystemRecord('violation', targetUser, ctx, 10);
      }

      // 通知用户文章或回复被屏蔽
      if(remindUser) {
        const mId = await db.SettingModel.operateSystemID('messages', 1);
        const messageObj = {
          _id: mId,
          ty: 'STU',
          r: targetUser.uid,
          c: {
            rea: reason
          }
        };
        if(type === 'thread') {
          messageObj.c.tid = thread.tid;
          messageObj.c.type = 'bannedThread';
        } else if(type === 'post') {
          messageObj.c.pid = post.pid;
          messageObj.c.type = 'bannedPost';
        } else {
          ctx.throw(500, `post type error. pid: ${post.pid} type: ${type}`);
        }
        const message = db.MessageModel(messageObj);
        await message.save();
        await ctx.nkcModules.socket.sendMessageToUser(message._id);
      }


      // 清除 redis 中的页面缓存
      const postKey = nkcModules.cache.getRedisPageKeyByUrl(`/p/${post.pid}*`);
      const threadKey = nkcModules.cache.getRedisPageKeyByUrl(`/t/${post.tid}*`);
      const keys = postKey.web.concat(
        postKey.reactNative,
        postKey.apiCloud,
        threadKey.web,
        threadKey.reactNative,
        threadKey.apiCloud
      );
      let redisKeys = [];
      for(const k of keys) {
        const arr = await redis.keysAsync(k);
        redisKeys = redisKeys.concat(arr);
      }
      if(redisKeys.length > 0) await redis.delAsync(redisKeys);
    }
    // 屏蔽回复后，需要更新文章
    if(threads.length) {
      for(const thread of threads) {
        await thread.updateThreadMessage();
      }
    }
    await next();
  });
module.exports = router;
