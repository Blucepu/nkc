const { settingIds } = require('../../settings/serverSettings');
module.exports = {
  _id: settingIds.download,
  c: {
    visitorAccess: {
      mediaPicture: true,
      mediaVideo: true,
      mediaAudio: true,
      mediaAttachment: true,
    },
    allSpeed: 100 * 1024, //总下载速度 KB
    speed: {
      default: {
        fileCount: 10,
        data: [
          {
            startingTime: 0,
            endTime: 24,
            speed: 1024,
          },
        ],
      },
      others: [
        {
          type: 'role-visitor',
          fileCount: 3,
          data: [
            {
              startingTime: 0,
              endTime: 24,
              speed: 1024,
            },
          ],
        },
        {
          type: 'role-banned',
          fileCount: 0,
          data: [
            {
              startingTime: 0,
              endTime: 24,
              speed: 0,
            },
          ],
        },
      ],
    },
    fileCountLimit: {
      default: {
        data: [
          {
            startingTime: 0,
            endTime: 24,
            fileCount: 10,
          },
        ],
      },
      others: [
        {
          type: 'grade-0',
          data: [
            {
              startingTime: 0,
              endTime: 24,
              fileCount: 2,
            },
          ],
        },
      ],
      roles: [
        {
          type: 'role-dev',
          fileCount: 100,
        },
      ],
    },
    freeTime: 24, // 下载附加后免费再次下载的时间
    warning:
      '所有文件均由用户主动上传，如涉及侵权，请通过报告问题功能提交相应法律文件，我们将及时处理。',
  },
};
