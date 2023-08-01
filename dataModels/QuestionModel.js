const settings = require('../settings');
const mongoose = settings.database;
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    _id: Number,
    disabled: {
      type: Boolean,
      default: false,
      index: 1,
    },
    auth: {
      // 审核状态 true: 已通过, false: 未通过, null: 未审核
      type: Boolean,
      default: null,
      index: 1,
    },
    reason: {
      // 审核未通过的原因
      type: String,
      default: '',
    },
    uid: {
      type: String,
      required: true,
      index: 1,
    },
    toc: {
      type: Date,
      default: Date.now,
      index: 1,
    },
    tlm: {
      type: Date,
      default: Date.now,
      index: 1,
    },
    operatorId: {
      type: String,
      default: '',
    },
    operationTime: {
      type: Date,
      default: null,
    },
    type: {
      // 问答：ans, 选择：ch4
      type: String,
      required: true,
      index: 1,
    },
    // 题干
    content: {
      type: String,
      required: true,
    },
    // 题干说明
    contentDesc: {
      type: String,
      default: '',
    },
    /*answer: {
      // 答案，数组长度 选择：4, 问答： 1
      type: [String],
      required: true,
    },*/
    answer: {
      type: [
        {
          // 选项内容
          text: {
            type: String,
            required: true,
          },
          // 选项说明
          desc: {
            type: String,
            default: '',
          },
          // 是否为正确答案
          correct: {
            type: Boolean,
            required: true,
          },
        },
      ],
      required: true,
    },
    hasImage: {
      // 是否有图片
      type: Boolean,
      default: false,
    },
    volume: {
      // A: 基础级, B: 专业级
      type: String,
      required: true,
      index: 1,
    },
    public: {
      // 是否为公共题，与之对应的还有专业题，专业题需要选择专业分类。
      type: Boolean,
      default: false,
      index: 1,
    },
    fid: {
      // 专业领域
      type: String,
      default: '',
      index: 1,
    },
    // 试题标签
    tags: {
      type: [Number],
      default: [],
      index: 1,
    },
    viewed: {
      type: Boolean,
      default: false,
      index: 1,
    },
  },
  {
    collection: 'questions',
  },
);

schema.statics.extendQuestions = async (questions) => {
  const UserModel = mongoose.model('users');
  const ForumModel = mongoose.model('forums');
  const uid = new Set(),
    userObj = {},
    fid = new Set(),
    forumObj = {};
  for (const q of questions) {
    uid.add(q.uid);
    fid.add(q.fid);
  }
  const users = await UserModel.find({ uid: { $in: [...uid] } });
  const forums = await ForumModel.find({ fid: { $in: [...fid] } });
  users.map((u) => {
    userObj[u.uid] = u;
  });
  forums.map((f) => {
    forumObj[f.fid] = f;
  });
  return Promise.all(
    questions.map((q) => {
      q_ = q.toObject();
      q_.user = userObj[q_.uid];
      q_.forum = forumObj[q_.fid];
      return q_;
    }),
  );
};

/*
 * 保存试题的图片
 * @param {File} file 图片对象
 * @param {Number} qid 试题 ID
 * */
schema.methods.updateImage = async function (file) {
  const FILE = require('../nkcModules/file');
  const { path } = file;
  const { _id } = this;
  await FILE.getFileExtension(file, ['jpg', 'jpeg', 'png']);
  const { questionImagePath } = require('../settings/upload');
  const { questionImageify } = require('../tools/imageMagick');
  const targetPath = questionImagePath + '/' + _id + '.jpg';
  await questionImageify(path, targetPath);
  await this.updateOne({
    $set: {
      hasImage: true,
    },
  });
};

module.exports = mongoose.model('questions', schema);
