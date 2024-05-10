const { settingIds } = require('../../settings/serverSettings');
module.exports = {
  _id: settingIds.home,
  c: {
    recommendThreads: {
      fixed: {
        order: 'random', // 文章显示顺序， random: 随机, fixed: 顺序
        manuallySelectedThreads: [], // 手动推荐的文章
        automaticallySelectedThreads: [], // 自动推荐的文章
        displayType: 'manual', // manual: 手动, automatic: 自动, all: 混合
        count: 6,
        automaticProportion: 1, // 当现实方式为「混合」时，自动推荐的文章所占的比例
        automaticCount: 20, // 自动选择推荐文章的数量
        timeOfPost: {
          // 文章的发表时间限制
          min: 0, // 距离当前最短一天
          max: 365, // 距离当前最长365天
        },
        countOfPost: {
          min: 0,
          max: 30,
        },
        timeInterval: 1, // 自动更新的间隔时间（小时）
        digest: false, // 文章是否必须是精选
        postVoteUpMinCount: 0, // 文章的最小点赞数
        postVoteDownMaxCount: 99999, // 文章的最大点踩数
        threadVoteUpMinCount: 0, // 文章（包含所有回复）的最小点赞数
        reportedAndUnReviewed: false, // 是否包含被举报且未处理的文章
        original: false, // 文章是否必须为原创
        flowControl: false, // 是否包含流控文章
        otherThreads: true, // 是否包含普通文章（未加精、非原创、未流控、未举报且未处理）
      },
      movable: {
        order: 'random', // 文章显示顺序， random: 随机, fixed: 顺序
        manuallySelectedThreads: [], // 手动推荐的文章
        automaticallySelectedThreads: [], // 自动推荐的文章
        displayType: 'manual', // manual: 手动, automatic: 自动, all: 混合
        count: 8,
        automaticProportion: 1, // 当现实方式为「混合」时，自动推荐的文章所占的比例
        automaticCount: 20, // 自动选择推荐文章的数量
        timeOfPost: {
          // 文章的发表时间限制
          min: 0, // 距离当前最短一天
          max: 365, // 距离当前最长365天
        },
        countOfPost: {
          min: 0,
          max: 30,
        },
        timeInterval: 1, // 自动更新的间隔时间（小时）
        digest: false, // 文章是否必须是精选
        postVoteUpMinCount: 0, // 文章的最小点赞数
        postVoteDownMaxCount: 99999, // 文章的最大点踩数
        threadVoteUpMinCount: 0, // 文章（包含所有回复）的最小点赞数
        reportedAndUnReviewed: false, // 是否包含被举报且未处理的文章
        original: false, // 文章是否必须为原创
        flowControl: false, // 是否包含流控文章
        otherThreads: true, // 是否包含普通文章（未加精、非原创、未流控、未举报且未处理）
      },
    },
    ads: {
      movable: [], // 手动 轮播
      fixed: [], // 手动 固定
      fixedOrder: 'random',
      movableOrder: 'random',
    },
    toppedThreadsId: [], // 顶置社区文章ID
    recommendForumsId: [],
    showShopGoods: true, // 是否显示热销商品板块，默认显示，可以在前台设置中修改
    shopGoodsId: [],
    columnsId: [],
    logos: [],
    logo: '',
    smallLogo: '',
    homeBigLogo: [],
    noticeThreadsId: [],
    list: {
      topic: true,
      discipline: true,
    },
    watermarkTransparency: 30,
    waterLimit: {
      minWidth: 799,
      minHeight: 479,
    },
    // 游客默认显示 推荐、最新
    visitorThreadList: 'home',
    // 热门文章 条件
    hotThreads: {
      postCount: 50,
      postUserCount: 20,
    },
    recommend: {
      featuredThreads: true, // 精选文章
      hotThreads: true, // 热门文章
      voteUpTotal: 20, // 总点赞数
      voteUpMax: 10, // 最高点赞数
      encourageTotal: 10, // 总鼓励数
    },
    originalThreadDisplayMode: 'simple', // 首页上“最新原创”板块文章的显示方式， “simple” 简略显示， “full” 完整显示
    subscribesDisplayMode: 'row', // 首页上“关注的专业”板块的显示方式，  “row” 横排， “column” 竖排
    showActivityEnter: true, // 显示活动入口
    showHomeForums: true, // 显示社区导航模块
    showHomeWebApply: true, // 显示网站应用模块
    latestToppedThreadsId: [],
    communityToppedThreadsId: [],
    columnListPosition: 'side', // 专栏显示位置 main: 中间, side: 侧边, null: 不显示
    columnListSort: 'updateTime', // updateTime, postCount
    columnCount: 12, // 首页热门专栏数量
    columnPool: {
      columnsId: [], // 已选取的专栏ID
      columnCount: 10, // 专栏推荐池中专栏的最大数量
      updateInterval: 30, // 推荐池更新时间（分钟）
      minPostCount: 0,
      updateTime: 60,
      postCount: 0,
      minSubscriptionCount: 0,
    },
    toppedColumnsId: [],
    latestFirst: 'reply', //首页最新点击进入的项目
    navigationButtons: {
      left: [],
      right: [],
    },
  },
};
