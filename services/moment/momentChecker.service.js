const SubscribeModel = require('../../dataModels/SubscribeModel');
const { ThrowCommonError } = require('../../nkcModules/error');
const {
  getMomentPlainJsonContentLength,
  getRichJsonContentLength,
} = require('../../nkcModules/checkData');
const {
  momentStatus: momentStatusSettings,
  momentVisibleType: momentVisibleTypeSettings,
} = require('../../settings/moment');
const { editorRichService } = require('../editor/rich.service');
class MomentCheckerService {
  async checkMomentPermission(readerUid, moment, hasReviewPermission) {
    const {
      status: momentStatus,
      visibleType: momentVisibleType,
      uid: momentUid,
    } = moment;
    const {
      normal: normalMomentStatus,
      deleted: deleteMomentStatus,
      disabled: disabledMomentStatus,
      unknown: unknownMomentStatus,
    } = momentStatusSettings;
    const { own, attention } = momentVisibleTypeSettings;

    if (hasReviewPermission) {
      // 管理员不做限制
      // 但请确保前端页面能显示内容的实际状态，包括是否删除、谁可见等
    } else if (readerUid === momentUid) {
      // 阅读自己的
      if (momentStatus === deleteMomentStatus) {
        // 被删除了
        ThrowCommonError(403, '内容已被删除');
      }
    } else {
      // 阅读别人的
      if (momentStatus !== normalMomentStatus) {
        // 状态异常
        if (momentStatus === deleteMomentStatus) {
          // 被删除
          ThrowCommonError(403, '内容已被删除');
        } else if (momentStatus === disabledMomentStatus) {
          // 被屏蔽
          ThrowCommonError(403, '内容已被屏蔽');
        } else if (momentStatus === unknownMomentStatus) {
          // 待审核
          ThrowCommonError(403, '内容审核中');
        } else {
          // 其他
          ThrowCommonError(403, '权限不足');
        }
      } else {
        // 状态正常
        if (momentVisibleType === own) {
          // 仅自己可见
          ThrowCommonError(403, '内容仅作者自己可见');
        } else if (momentVisibleType === attention) {
          // 仅关注的人可见
          const subUid = await SubscribeModel.getUserSubUsersId(readerUid);
          if (!subUid.includes(momentUid)) {
            ThrowCommonError(403, '内容仅粉丝可见');
          }
        }
      }
    }
  }

  checkMomentPlainJSONLength(jsonString) {
    const length = getMomentPlainJsonContentLength(jsonString);
    if (length > 1000 || jsonString.length > 100000) {
      ThrowCommonError(400, '内容长度超过限制');
    }
  }

  checkMomentRichJSONLength(jsonString) {
    const length = editorRichService.getRichContentWordsSize(
      'json',
      jsonString,
    );
    if (length > 100000 || jsonString.length > 1000000) {
      ThrowCommonError(400, '内容长度超过限制');
    }
  }
}

module.exports = {
  momentCheckerService: new MomentCheckerService(),
};
