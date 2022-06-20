const Router = require('koa-router');
const router = new Router();
router
	.post('/', async (ctx, next) => {
		//文章和回复加精，加科创币
		const {db, data, params, nkcModules, body} = ctx;
		const {pid} = params;
		let {kcb} = body;
    const post = await db.PostModel.findOnly({pid});
		const digestRewardScore = await db.SettingModel.getScoreByOperationType('digestRewardScore');
    const thread = await post.extendThread();
    const forums = await thread.extendForums(['mainForums', 'minorForums']);
    let isModerator = ctx.permission('superModerator');
    if(!isModerator) {
      for(const f of forums) {
        isModerator = await f.isModerator(data.user);
        if(isModerator) break;
      }
    }
    if(!isModerator) ctx.throw(403, '权限不足');
    data.isModerator = isModerator;
    data.post = post;
		const targetUser = await post.extendUser();
    const redEnvelopeSettings = await db.SettingModel.findOnly({_id: 'redEnvelope'});
    let num;
    if(!redEnvelopeSettings.c.draftFee.close) {
      if(!kcb) ctx.throw(400, '参数错误，请刷新');
      num = Number(kcb);
      if(num%1 !== 0) ctx.throw(400, `${digestRewardScore.name}仅支持到小数点后两位`);
      if(!redEnvelopeSettings.c.draftFee.close && (num < redEnvelopeSettings.c.draftFee.minCount || num > redEnvelopeSettings.c.draftFee.maxCount)) ctx.throw(400, `${digestRewardScore.name}数额不在范围内`);
    }
		data.targetUser = targetUser;

    const usersGeneralSettings = await db.UsersGeneralModel.findOnly({uid: data.targetUser.uid});

		if(post.digest) {
			if(thread.oc === pid) {
				ctx.throw(400, '文章已被加精，请刷新');
			} else {
				ctx.throw(400, '回复已被加精，请刷新');
			}
		}
		const digestTime = Date.now();
		post.digest = true;
		const log = {
			user: targetUser,
			type: 'kcb',
			typeIdOfScoreChange: 'digestThread',
			port: ctx.port,
			pid,
			tid: thread.tid,
			ip: ctx.address
		};
		let message;
    const messageId = await db.SettingModel.operateSystemID('messages', 1);
    ctx.state._scoreOperationForumsId = thread.mainForumsId;
		if(thread.oc === pid) {
			await thread.updateOne({digest: true, digestTime});
			// await db.UsersScoreLogModel.insertLog(log);
      // if(!redEnvelopeSettings.c.draftFee.close) {
      //   const record = db.KcbsRecordModel({
      //     _id: await db.SettingModel.operateSystemID('kcbsRecords', 1),
      //     from: 'bank',
			// 		scoreType: digestRewardScore.type,
      //     type: 'digestThreadAdditional',
      //     to: data.targetUser.uid,
      //     toc: digestTime,
      //     port: ctx.port,
      //     ip: ctx.address,
      //     description: '',
      //     num: num,
      //     pid,
      //     tid: thread.tid
      //   });
      //   await record.save();
      // }
      await db.PostModel.insertSystemRecord('digestThread', data.targetUser, ctx, num);
			log.type = 'score';
			log.key = 'digestThreadsCount';
			await db.UsersScoreLogModel.insertLog(log);
			message = db.MessageModel({
				_id: messageId,
				ty: 'STU',
				r: post.uid,
				vd: false,
				c: {
					type: 'digestThread',
					targetUid: targetUser.uid,
					pid
				}
			});
			await message.save();
			await nkcModules.elasticSearch.save("thread", post);
		} else {
			log.typeIdOfScoreChange = 'digestPost';
			// await db.UsersScoreLogModel.insertLog(log);
      // if(!redEnvelopeSettings.c.draftFee.close) {
      //   const record = db.KcbsRecordModel({
      //     _id: await db.SettingModel.operateSystemID('kcbsRecords', 1),
      //     from: 'bank',
			// 		scoreType: digestRewardScore.type,
      //     type: 'digestPostAdditional',
      //     to: data.targetUser.uid,
      //     toc: digestTime,
      //     port: ctx.port,
      //     ip: ctx.address,
      //     description: '',
      //     num: num,
      //     pid,
      //     tid: thread.tid
      //   });
      //   await record.save();
      // }
      await db.PostModel.insertSystemRecord('digestPost', data.targetUser, ctx, num);
			log.key = 'digestPostsCount';
			log.type = 'score';
			await db.UsersScoreLogModel.insertLog(log);
			message = db.MessageModel({
				_id: messageId,
				ty: 'STU',
				r: post.uid,
				vd: false,
				c: {
					type: 'digestPost',
					targetUid: targetUser.uid,
					pid
				}
			});
			await message.save();
      await nkcModules.elasticSearch.save("post", post);
		}
		await post.updateOne({digest: true, digestTime});
		if(!redEnvelopeSettings.c.draftFee.close) {
      await usersGeneralSettings.updateOne({$inc: {'draftFeeSettings.kcb': num}});
    }
    await ctx.nkcModules.socket.sendMessageToUser(message._id);
		// 更新用户科创币
		data.targetUser.kcb = await db.UserModel.updateUserKcb(targetUser.uid);
		// 更新用户积分
		data.userScores = await db.UserModel.updateUserScores(targetUser.uid);
		await next();
	})
	.del('/', async (ctx, next) => {
		//文章和回复取消加精，扣除科创比
		const {db, params, data, nkcModules} = ctx;
		const {pid} = params;
    const post = await db.PostModel.findOnly({pid});
    const thread = await post.extendThread();
    const forums = await thread.extendForums(['mainForums', 'minorForums']);
    let isModerator = ctx.permission('superModerator');
    if(!isModerator) {
      for(const f of forums) {
        isModerator = await f.isModerator(data.user);
        if(isModerator) break;
      }
    }
    if(!isModerator) ctx.throw(400, '权限不足');
    data.isModerator = isModerator;
		const targetUser = await post.extendUser();
		data.targetUser = targetUser;
		data.post = post;
		if(!post.digest) {
			if(thread.oc === pid) {
				ctx.throw(400, '文章未被加精，请刷新');
			} else {
				ctx.throw(400, '回复未被加精，请刷新');
			}
		}
		let additionalReward = 0;
		//查找奖励科创币记录，并扣除相应科创币
		const rewardLog = await db.KcbsRecordModel.findOne({type: 'digestThreadAdditional', pid}).sort({toc: -1});
		if(rewardLog) {
		  additionalReward = rewardLog.num;
    }
		post.digest = false;
		//取消post精选
		await post.updateOne({digest: false});
		const log = {
			user: targetUser,
			type: 'kcb',
			typeIdOfScoreChange: 'unDigestThread',
			port: ctx.port,
			pid,
			tid: thread.tid,
			ip: ctx.address
		};
		ctx.state._scoreOperationForumsId = thread.mainForumsId;
		if(thread.oc === pid) {
			//取消文章精选
			await thread.updateOne({digest: false});
			// await db.UsersScoreLogModel.insertLog(log);
			//执行科创币加减
      await db.PostModel.insertSystemRecord('unDigestThread', data.targetUser, ctx);
			log.type = 'score';
			log.change = -1;
			log.key = 'digestThreadsCount';
			await db.UsersScoreLogModel.insertLog(log);
			await nkcModules.elasticSearch.save("thread", post);
		} else {
			log.typeIdOfScoreChange = 'unDigestPost';
			// await db.UsersScoreLogModel.insertLog(log);
			//执行科创币加减
      await db.PostModel.insertSystemRecord('unDigestPost', data.targetUser, ctx);
			log.key = 'digestPostsCount';
			log.change = -1;
			log.type = 'score';
			await db.UsersScoreLogModel.insertLog(log);
      await nkcModules.elasticSearch.save("post", post);
		}
		// 更新用户科创币
		data.targetUser.kcb = await db.UserModel.updateUserKcb(data.targetUser.uid);
		//更新用户积分
		data.userScores = await db.UserModel.updateUserScores(data.targetUser.uid);
		await next();
	});
module.exports = router;
