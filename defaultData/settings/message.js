const { settingIds } = require('../../settings/serverSettings');
module.exports = {
  _id: settingIds.message,
  c: {
    customizeLimitInfo:
      '【防骚扰系统】对方设置了智能拦截，请通过发文回帖等公开途径交流。拦截原因包括但不限于：未通过A/B卷考试；发表的数量不足或没有任何文章被列入精选；没有学术分；注册时间太短等。如需联系网管，请使用“报告问题”功能。',
    systemLimitInfo:
      '【防骚扰系统】对方没有义务查看和回复您的消息。新用户通过短消息联系他人很不友好，如果发送提问、求助、求加微信之类则属于恶意骚扰，若被举报将会锁定账号。强烈建议你通过发文回帖等不具有强迫性的公开途径交流。 ',
    gradeProtect: [4, 5, 6, 7, 3, 2],
    gradeLimit: [1, 0],
    mandatoryLimitInfo:
      '【防骚扰系统】先有公开发言，才能私信发言。如需开通发送短消息的功能，请至少发表一篇原创文章和一篇原创回复，且品质优良，通过人工审核。在开启发送功能之前，如果需要与网友探讨（包括联系卖家），请通过回复/评论公开进行。特种科技爱好话题必须暴露在阳光之下，请勿私下交流；在公开区域询问他人QQ、微信等私密交流途径，将受到处罚；新注册用户通过私信求加微信、QQ等属于恶意骚扰，若被举报会锁定账号。',
    mandatoryLimit: {
      threadCount: 1,
      postCount: 1,
    },
    adminRolesId: ['editor', 'eng', 'examiner'],
    mandatoryLimitGradeProtect: [0],
    sizeLimit: {
      default: 10 * 1024,
      others: [
        {
          ext: 'mp4',
          size: 100 * 1024,
        },
        {
          ext: 'gif',
          size: 5 * 1024,
        },
      ],
    },
  },
};
