const Router = require('koa-router');
const { OnlyOperation } = require('../../../../middlewares/permission');
const { Operations } = require('../../../../settings/operations');
const messageRouter = new Router();
messageRouter
  .get(
    '/',
    OnlyOperation(Operations.visitEMessageSettings),
    async (ctx, next) => {
      const { data, db, state } = ctx;
      data.messageTypes = await db.MessageTypeModel.find();
      data.messageTypesLanguage = state.language.messageTypes;
      data.roles = await db.RoleModel.find().sort({ toc: 1 });
      data.grades = await db.UsersGradeModel.find().sort({ toc: 1 });
      data.messageSettings = await db.SettingModel.getSettings('message');
      ctx.template = 'experimental/settings/message/message.pug';
      await next();
    },
  )
  .put(
    '/',
    OnlyOperation(Operations.modifyEMessageSettings),
    async (ctx, next) => {
      const { body, db, nkcModules } = ctx;
      const { checkNumber } = nkcModules.checkData;
      const { roles, grades, type, messageType, messageSettings } = body;
      if (type === 'modifyMessageType') {
        const { templates, _id, name, description } = messageType;
        if (!name) ctx.throw(400, '类型名不能为空');
        if (!description) ctx.throw(400, '类型简介不能为空');
        for (const template of templates) {
          const { type, content } = template;
          if (!content) ctx.throw(400, '模板内容不能为空');
          await db.MessageTypeModel.updateOne(
            {
              _id,
              'templates.type': type,
            },
            {
              $set: {
                'templates.$.content': content,
                name,
                description,
              },
            },
          );
        }
      } else if (type === 'modifySendLimit') {
        if (
          !messageSettings.systemLimitInfo ||
          !messageSettings.customizeLimitInfo ||
          !messageSettings.mandatoryLimitInfo
        ) {
          ctx.throw(400, '受限提示不能为空');
        }

        nkcModules.checkData.checkNumber(
          messageSettings.mandatoryLimit.threadCount,
          {
            name: '文章数量',
            min: 0,
          },
        );
        nkcModules.checkData.checkNumber(
          messageSettings.mandatoryLimit.postCount,
          {
            name: '回复数量',
            min: 0,
          },
        );

        const roles_ = await db.RoleModel.find({
          _id: { $in: messageSettings.adminRolesId },
        });
        const rolesId = roles_.map((r) => r._id);

        const grades_ = await db.UsersGradeModel.find({
          _id: { $in: messageSettings.mandatoryLimitGradeProtect },
        });
        const gradesId = grades_.map((g) => g._id);

        const { sizeLimit } = messageSettings;

        // 尺寸限制
        checkNumber(sizeLimit.default, {
          name: '文件尺寸',
          min: 0,
        });
        for (const s of sizeLimit.others) {
          const { size, ext } = s;
          if (!ext) ctx.throw(400, `文件尺寸设置中文件格式不能为空`);
          s.ext = ext.toLowerCase();
          checkNumber(size, {
            name: '文件尺寸',
            min: 0,
          });
        }

        await db.SettingModel.updateOne(
          {
            _id: 'message',
          },
          {
            $set: {
              'c.gradeLimit': messageSettings.gradeLimit || [],
              'c.gradeProtect': messageSettings.gradeProtect || [],
              'c.mandatoryLimitInfo': messageSettings.mandatoryLimitInfo,
              'c.mandatoryLimit': messageSettings.mandatoryLimit,
              'c.systemLimitInfo': messageSettings.systemLimitInfo,
              'c.adminRolesId': rolesId,
              'c.mandatoryLimitGradeProtect': gradesId,
              'c.customizeLimitInfo': messageSettings.customizeLimitInfo,
              'c.sizeLimit': sizeLimit,
            },
          },
        );

        await Promise.all(
          roles.map(async (role) => {
            await db.RoleModel.updateOne(
              { _id: role._id },
              {
                $set: {
                  messagePersonCountLimit: role.messagePersonCountLimit,
                  messageCountLimit: role.messageCountLimit,
                },
              },
            );
          }),
        );
        await Promise.all(
          grades.map(async (grade) => {
            await db.UsersGradeModel.updateOne(
              { _id: grade._id },
              {
                $set: {
                  messagePersonCountLimit: grade.messagePersonCountLimit,
                  messageCountLimit: grade.messageCountLimit,
                },
              },
            );
          }),
        );
      }
      await db.SettingModel.saveSettingsToRedis('message');
      await next();
    },
  );
module.exports = messageRouter;
