const Router = require('koa-router');
// const auditRouter = require('./audit');
const remittanceRouter = require('./remittance');
const reportRouter = require('./report');
const completeRouter = require('./complete');
const voteRouter = require('./vote');
const commentRouter = require('./comment');
const settingsRouter = require('./settings');
const managementRouter = require('./manage');
const memberRouter = require('./member');
const excellentRouter = require('./excellent');
const disabledRouter = require('./disabled');
const refundRouter = require('./refund');
const applicationRouter = new Router();
const {
  fundOperationTypes,
  fundOperationStatus,
} = require('../../../settings/fundOperation');
const {
  fundOperationService,
} = require('../../../services/fund/FundOperation.service');
applicationRouter
  .use('/:_id', async (ctx, next) => {
    const { params, data, db, state } = ctx;
    const { _id } = params;
    const applicationForm = await db.FundApplicationFormModel.findOne({
      $or: [
        {
          code: _id,
        },
        {
          _id,
        },
      ],
    });
    if (!applicationForm) {
      ctx.throw(400, '未找到指定申请表。');
    }
    await applicationForm.extendApplicationFormBaseInfo(state.uid);
    const fund = applicationForm.fund;
    /*if(fund.history && ctx.method !== 'GET') {
			ctx.throw(400, '申请表所在基金已被设置为历史基金，申请表只供浏览。');
		}*/
    data.applicationForm = applicationForm;
    data.fund = fund;
    data.userFundRoles = await applicationForm.fund.getUserFundRoles(state.uid);
    await next();
  })

  // 申请表展示页
  .get('/:_id', async (ctx, next) => {
    const { data, db, state } = ctx;
    const { applicationForm } = data;
    const accessForumsId = await db.ForumModel.getAccessibleForumsId(
      data.userRoles,
      data.userGrade,
      data.user,
    );
    await applicationForm.extendApplicationFormInfo(state.uid, accessForumsId);
    data.targetUserInFundBlacklist = await db.FundBlacklistModel.inBlacklist(
      applicationForm.uid,
    );
    data.permissions = {
      modifyKcbRecordReason: ctx.permission('modifyKcbRecordReason'),
    };
    // 拓展历史版本所需要的信息
    if (applicationForm.tid && state.uid) {
      // 根据tid 获取文章的pid 以及获取访问用户是否具有查看历史版本的权限==》管理员
      const thread = await db.ThreadModel.findOnly(
        { tid: applicationForm.tid },
        { oc: 1 },
      );
      if (thread) {
        const post = await db.PostModel.findOnly({ pid: thread.oc });
        const isModerator = await db.PostModel.isModerator(
          state.uid,
          thread.oc,
        );
        if (
          post.tlm > post.toc &&
          ctx.permission('visitPostHistory') &&
          isModerator &&
          (!post.hideHistories || ctx.permission('displayPostHideHistories'))
        ) {
          data.userFundRoles.push('visitPostHistory');
          applicationForm.pid = thread.oc;
          // data.permissions.visitPostHistory =
          //   !post.hideHistories || ctx.permission('displayPostHideHistories')
          //     ? true
          //     : null;
        }
      }
    }
    // 定时超时放弃任务
    // await db.FundModel.modifyTimeoutApplicationForm();
    ctx.template = 'fund/applicationForm/applicationForm.pug';
    await next();
  })

  //修改申请表
  /*.put('/:_id', async (ctx, next) => {
    const { data, db, body, params } = ctx;
    const { user } = data;
    const {
      useless,
      newMembers,
      account,
      newApplicant,
      s,
      project,
      projectCycle,
      budgetMoney,
      threadsId,
      category,
    } = body;
    data.s = s;
    const { applicationForm } = data;
    if (applicationForm.disabled) {
      ctx.throw(403, '抱歉！该申请表已被屏蔽。');
    }
    if (useless === 'giveUp') {
      ctx.throw(400, '抱歉！您已放弃此次申请。');
    } else if (useless === 'exceededModifyCount') {
      ctx.throw(400, '抱歉！申请表已超出最大修改次数。');
    } else if (useless === 'delete') {
      ctx.throw(403, '抱歉！该申请表已被删除。');
    } else if (useless === 'refuse') {
      ctx.throw(403, '抱歉！该申请表已被彻底拒绝。');
    }
    const { _id } = params;
    if (user.uid !== applicationForm.uid) {
      ctx.throw(403, '权限不足');
    }
    if (applicationForm.lock.submitted) {
      ctx.throw(403, '抱歉！申请表已提交暂不能修改。');
    }
    const fund = applicationForm.fund;
    try {
      // 临时屏蔽 修改申请表应该无需验证基金冲突
      // await db.FundModel.ensureUserPermission(user.uid, fund._id);
    } catch (e) {
      ctx.throw(403, e);
    }
    const userPersonal = await db.UsersPersonalModel.findOnly({
      uid: user.uid,
    });
    const { applicant, members, status } = applicationForm;
    let updateObj = {
      tlm: Date.now(),
    };
    if (applicationForm.modifyCount >= fund.modifyCount) {
      await applicationForm.updateOne({ useless: 'exceededModifyCount' });
      throw '抱歉！申请表的修改次数已超过限制，无法提交修改。';
    }
    if (s === 1) {
      const { from } = body;
      if (status.submitted) {
        ctx.throw(
          400,
          '修改失败！申请方式一旦选择将无法更改,如需更改请放弃本次申请重新填写申请表。',
        );
      }
      if (from === 'personal') {
        if (!fund.applicantType.includes('personal')) {
          ctx.throw(400, '抱歉！该基金暂不允许个人申请。');
        }
        for (let aUser of members) {
          await db.FundApplicationUserModel.updateMany(
            { uid: aUser.uid },
            { $set: { removed: true } },
          );
        }
        updateObj.from = 'personal';
        await applicationForm.updateOne(updateObj);
      } else if (from === 'team') {
        if (!fund.applicantType.includes('team')) {
          ctx.throw(400, '抱歉！该基金暂不允许团队申请。');
        }

        // 判断组员有没有申请其他基金项目
        const applicationForms = await db.FundApplicationModel.find({
          uid: { $in: newMembers.map((m) => m.uid) },
        });
        const usersId = newMembers.map((m) => m.uid);
        const users = await db.UserModel.find({ uid: { $in: usersId } });
        const usersObj = {};
        users.map((u) => (usersObj[u.uid] = u));
        for (const a of applicationForms) {
          const status = await a.getStatus();
          const { username } = usersObj[a.uid];
          if (![1, 5].includes(status.general)) {
            ctx.throw(
              400,
              `用户「${username}」申报的项目暂未结题，不能担任新申请项目的组员`,
            );
          }
        }
        // 判断申请人的信息是否存在，不存在则写入
        if (!applicant) {
          newMembers.push({
            uid: user.uid,
            mobile: userPersonal.mobile || null,
          });
        }
        const membersUid = members.map((m) => m.uid);
        const selectedUserUid = newMembers.map((s) => s.uid);

        // 从数据库中标记未被选择的用户
        for (let u of members) {
          if (!selectedUserUid.includes(u.uid)) {
            await db.FundApplicationUserModel.updateOne(
              { _id: u._id, uid: u.uid },
              { $set: { removed: true } },
            );
          }
        }
        // 写入新提交的数据库中不存在的用户信息
        for (let u of newMembers) {
          if (!membersUid.includes(u.uid)) {
            const targetUser = await db.UserModel.findOnly({ uid: u.uid });
            const targetUserPersonal = await db.UsersPersonalModel.findOnly({
              uid: targetUser.uid,
            });
            const { mobile } = targetUserPersonal;
            const authLevel = await targetUserPersonal.getAuthLevel();
            const newApplicationUser = db.FundApplicationUserModel({
              uid: targetUser.uid,
              applicationFormId: _id,
              mobile,
              authLevel,
            });
            await newApplicationUser.save();
            // 给组员发送通知
            const message = db.MessageModel({
              _id: await db.SettingModel.operateSystemID('messages', 1),
              r: u.uid,
              ty: 'STU',
              c: {
                type: 'fundMember',
                applicationFormId: applicationForm._id,
              },
            });
            await message.save();
            await ctx.nkcModules.socket.sendMessageToUser(message._id);
          }
        }
        updateObj.from = 'team';
        await applicationForm.updateOne(updateObj);
      } else {
        ctx.throw(400, '未知的申请方式。');
      }
    }
    // 填写申请人信息
    if (s === 2) {
      const oldLifePhotos = applicant.lifePhotosId;
      const newLifePhotos = newApplicant.lifePhotosId;
      for (let _id of oldLifePhotos) {
        if (!newLifePhotos.includes(_id)) {
          const photo = await db.PhotoModel.findOne({ _id });
          if (!photo) {
            continue;
          }
          if (photo.type === 'fund') {
            await photo.deleteOne();
          }
        }
      }
      for (let i = 0; i < newLifePhotos.length; i++) {
        const _id = newLifePhotos[i];
        const photo = await db.PhotoModel.findOne({
          _id,
          status: { $nin: ['disabled', 'deleted'] },
          type: { $ne: 'fund' },
        });
        if (!photo) {
          continue;
        }
        const { photoPath, photoSmallPath, generateFolderName } =
          ctx.settings.upload;
        const newId = await db.SettingModel.operateSystemID('photos', 1);
        const { size, uid, fileName, description } = photo;
        const photoDir = generateFolderName(photoPath);
        const photoSmallDir = generateFolderName(photoSmallPath);
        const filePath = newId + '.jpg';
        const targetPath = photoPath + photoDir + filePath;
        const smallTargetPath = photoSmallPath + photoSmallDir + filePath;
        await ctx.fs.copyFile(photoPath + photo.path, targetPath);
        await ctx.fs.copyFile(photoSmallPath + photo.path, smallTargetPath);
        const newPhoto = new db.PhotoModel({
          _id: newId,
          type: 'fund',
          path: photoDir + filePath,
          applicationFormId: applicationForm._id,
          uid,
          size,
          fileName,
          description,
        });
        await newPhoto.save();
        newApplicant.lifePhotosId.splice(i, 1, newId);
      }
      await applicant.updateOne(newApplicant);
      updateObj.account = account;
      await applicationForm.updateOne(updateObj);
    }
    // 填写项目信息
    if (s === 3) {
      await applicationForm.extendProject();
      if (applicationForm.projectId === null) {
        const documentId = await db.SettingModel.operateSystemID(
          'fundDocuments',
          1,
        );
        const newDocument = db.FundDocumentModel({
          _id: documentId,
          uid: user.uid,
          applicationFormId: applicationForm._id,
          type: 'project',
          t: project.t,
          abstract: project.abstract,
          abstractCn: project.abstractCn,
          abstractEn: project.abstractEn,
          keyWordsCn: project.keyWordsCn,
          keyWordsEn: project.keyWordsEn,
          c: project.c,
        });
        await newDocument.save();
        updateObj.projectId = documentId;
        await applicationForm.updateOne(updateObj);
      } else {
        if (project) {
          applicationForm.project.t = project.t;
          applicationForm.project.c = project.c;
          applicationForm.project.abstractCn = project.abstractCn;
          applicationForm.project.abstractEn = project.abstractEn;
          applicationForm.project.keyWordsCn = project.keyWordsCn;
          applicationForm.project.keyWordsEn = project.keyWordsEn;
          applicationForm.project.abstract = project.abstract;
          await applicationForm.project.save();
          data.redirect = `/fund/a/${applicationForm._id}/settings?s=3`;
        }
      }
    }
    //填写其他信息
    if (s === 4) {
      if (projectCycle) {
        updateObj.projectCycle = projectCycle;
      }
      if (budgetMoney) {
        updateObj.budgetMoney = budgetMoney;
      }
      if (threadsId) {
        updateObj['threadsId.applying'] = threadsId;
      }
      if (category) {
        updateObj.category = category;
      }
      await applicationForm.updateOne(updateObj);
    }
    //最后提交验证
    if (s === 5) {
      if (!fund.canApply) {
        ctx.throw(400, `抱歉！科创基金-${fund.name}已禁止提交新的基金申请。`);
      }
      try {
        applicationForm.lock.submitted = true;
        await applicationForm.ensureInformation();
        const newId = await db.SettingModel.operateSystemID('fundDocuments', 1);
        const newReport = db.FundDocumentModel({
          type: 'system',
          uid: user.uid,
          applicationFormId: applicationForm._id,
          _id: newId,
          c: '提交申请表',
          support: true,
        });
        await newReport.save();
      } catch (err) {
        ctx.throw(400, err);
      }
    }
    await next();
  })*/

  .del('/:_id', async (ctx, next) => {
    const { data, query, db } = ctx;
    const { user, applicationForm } = data;
    if (applicationForm.disabled) {
      ctx.throw(403, '抱歉！该申请表已被屏蔽。');
    }
    const { submitted, usersSupport, projectPassed, adminSupport, remittance } =
      applicationForm.status;
    const { type, c } = query;
    if (applicationForm.useless !== null) {
      ctx.throw(400, '申请表已失效，无法完成该操作。');
    }
    if (type === 'giveUp') {
      if (!c) {
        ctx.throw(400, '请输入放弃的原因。');
      }
      if (user.uid !== applicationForm.uid) {
        ctx.throw(403, '权限不足');
      }
      if (applicationForm.adminSupport) {
        ctx.throw(
          403,
          '已经通过审核的申请不能放弃，您可以点击结题按钮提前结题。',
        );
      }

      await fundOperationService.createFundOperation({
        uid: user.uid,
        formId: applicationForm._id,
        type: fundOperationTypes.applicantAbandoned,
        status: fundOperationStatus.normal,
        desc: c,
      });
      /*const newId = await db.SettingModel.operateSystemID('fundDocuments', 1);
      const newDocument = db.FundDocumentModel({
        _id: newId,
        uid: user.uid,
        applicationFormId: applicationForm._id,
        type: 'report',
        c: c,
      });
      await newDocument.save();*/
      applicationForm.useless = 'giveUp';
    } else if (type === 'delete') {
      if (submitted) {
        ctx.throw(
          400,
          '无法删除已提交的申请表，如需停止申请请点击放弃申请按钮。',
        );
      }
      applicationForm.useless = 'delete';
    } else if (type === 'refuse') {
      let remittanceError = false;
      for (let r of applicationForm.remittance) {
        if (r.status === false) {
          remittanceError = true;
          break;
        }
      }
      if (adminSupport && !remittanceError) {
        ctx.throw(400, '管理员复核已通过，且拨款没有出错，无法完成彻底拒绝。');
      }
      applicationForm.useless = 'refuse';
      await fundOperationService.createFundOperation({
        uid: user.uid,
        formId: applicationForm._id,
        type: fundOperationTypes.expertRefuse,
        status: fundOperationStatus.normal,
      });
      /*const newId = await db.SettingModel.operateSystemID('fundDocuments', 1);
      const newDocument = db.FundDocumentModel({
        _id: newId,
        uid: user.uid,
        applicationFormId: applicationForm._id,
        type: 'system',
        c: '被彻底拒绝',
        support: false,
      });
      await newDocument.save();*/
    } else if (type === 'withdraw') {
      if (applicationForm.remittance[0].status !== false) {
        ctx.throw(400, '无法完成该操作。');
      }
      applicationForm.lock.submitted = false;
      await applicationForm.updateOne({
        'lock.submitted': false,
      });
      return await next();
    } else {
      ctx.throw(400, '未知的操作类型。');
    }
    await applicationForm.save();
    await next();
  })
  .post('/:_id', async (ctx, next) => {
    const { data, body } = ctx;
    const { operation } = body;
    const { applicationForm } = data;
    const { fund } = applicationForm;
    if (!(await fund.ensureOperatorPermission('admin', data.user))) {
      ctx.throw(403, '权限不足');
    }
    if (operation === 'restore' && applicationForm.useless === 'giveUp') {
      await applicationForm.updateOne({ useless: null });
    }
    await next();
  })
  // .use('/:_id/audit', auditRouter.routes(), auditRouter.allowedMethods())
  .use(
    '/:_id/remittance',
    remittanceRouter.routes(),
    remittanceRouter.allowedMethods(),
  )
  .use('/:_id/report', reportRouter.routes(), reportRouter.allowedMethods())
  .use(
    '/:_id/complete',
    completeRouter.routes(),
    completeRouter.allowedMethods(),
  )
  .use('/:_id/vote', voteRouter.routes(), voteRouter.allowedMethods())
  .use('/:_id/comment', commentRouter.routes(), commentRouter.allowedMethods())
  .use(
    '/:_id/settings',
    settingsRouter.routes(),
    settingsRouter.allowedMethods(),
  )
  .use(
    '/:_id/manage',
    managementRouter.routes(),
    managementRouter.allowedMethods(),
  )
  .use('/:_id/member', memberRouter.routes(), memberRouter.allowedMethods())
  .use(
    '/:_id/excellent',
    excellentRouter.routes(),
    excellentRouter.allowedMethods(),
  )
  .use('/:_id/refund', refundRouter.routes(), refundRouter.allowedMethods())
  .use(
    '/:_id/disabled',
    disabledRouter.routes(),
    disabledRouter.allowedMethods(),
  )
  //屏蔽敏感信息
  .use('/', async (ctx, next) => {
    const { data, state } = ctx;
    const { applicationForm } = data;
    await applicationForm.hideApplicationFormInfoByUserId(
      state.uid,
      ctx.permission('displayFundApplicationFormSecretInfo'),
    );
    await next();
  });
module.exports = applicationRouter;
