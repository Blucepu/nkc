const {settingIds} = require('../../settings/serverSettings');
module.exports = {
  _id: settingIds.server,
  c: {
    websiteName: '科创',
    websiteAbbr: '科创',
    websiteCode: 'kc',
    serverName: 'nkc $ server',
    telephone: '00000000',
    github: 'https://github.com/kccd/nkc.git',
    copyright: 'name(c)2005-2018',
    record: [
      {
        title: '备案信息'
      }
    ],
    description: '网站介绍',
    statement: "网站声明",
    brief: '网站简介',
    keywords: ['科创'],
    language: 'zh_CN',
    siteIcon: null,           // 网站图标 为null时默认
    backgroundColor: '#f4f4f4',
    links: {
      info: [
        {
          name: "专业地图",
          url: "/f"
        }
      ],
      app: [
        {
          name: "考试系统",
          url: "/exam"
        }
      ],
      other: [
        {
          name: "科创",
          url: "https://kechuang.org"
        },
        {
          name: "故园怀旧",
          url: "https://gyhj.org"
        },
      ]
    }
  }
};
