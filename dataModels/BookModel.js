const mongoose = require('../settings/database');

const bookPermissions = {
  readBook: 'readBook',
  writeOwnArticle: 'writeOwnArticle',
  deleteOwnArticle: 'deleteOwnArticle',
  writeOtherArticle: 'writeOtherArticle',
  deleteOtherArticle: 'deleteOtherArticle',
  manageBookList: 'manageBookList'
};

const schema = new mongoose.Schema({
  _id: String,
  uid: {
    type: String,
    required: true,
    index: 1
  },
  toc: {
    type: Date,
    default: Date.now,
    index: 1
  },
  name: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  cover: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false,
    index: 1
  },
  // 参与图书创作的其他用户
  members: {
    type: [{
      _id: String, // 用户 ID
      role: String, // admin, member
      status: String, // pending: 等待处理, resolved：接受邀请, rejected：拒绝邀请
    }],
    default: [],
    index: 1
  },
  // 图书可见性
  read: {
    type: String,
    default: 'self', // everyone（所有人可见）, self（仅自己可见）, member（仅创作成员可见）
  },
  // 目录列表
  // 命名规则：type:id
  // postId: post:pid
  // articleId：article:aid
  list: {
    type: [String],
    default: []
  }
}, {
  collection: 'books'
});

schema.statics.checkBookInfo = async (book) => {
  const {name, description, read} = book;
  const {checkString} = require('../nkcModules/checkData');
  checkString(name, {
    name: '文档名称',
    minLength: 1,
    maxLength: 100
  });
  checkString(description, {
    name: '文档介绍',
    minLength: 0,
    maxLength: 1000
  });
  if(!['self', 'everyone', 'member'].includes(read)) {
    throwErr(400, `阅读权限设置错误`);
  }
}

schema.statics.createBook = async (props) => {
  const {name, description, uid} = props;
  const BookModel = mongoose.model('books');
  const SettingModel = mongoose.model('settings');
  const book = BookModel({
    _id: await SettingModel.getNewId(),
    name,
    description,
    uid
  });
  await book.save();
  return book;
};
schema.methods.getBaseInfo = async function() {
  const {timeFormat, getUrl} = require('../nkcModules/tools');
  const {
    _id,
    uid,
    name,
    description,
    cover,
    toc
  } = this;
  return {
    _id,
    uid,
    name,
    description,
    time: timeFormat(toc),
    coverUrl: getUrl('bookCover', cover)
  };
};
schema.statics.getBookById = async (bid) => {
  const BookModel = mongoose.model('books');
  const book = await BookModel.findOnly({_id: bid});
  return await book.getBaseInfo();
};

schema.statics.extendBooksData = async (books) => {
  const {timeFormat, getUrl} = require('../nkcModules/tools');
  return books.map(book => {
    const {
      _id,
      name,
      description,
      toc,
      cover
    } = book;
    return {
      _id,
      time: timeFormat(toc),
      name,
      description,
      coverUrl: cover? getUrl('bookCover', cover): ''
    }
  })
}

schema.statics.getBooksByUserId = async (uid) => {
  const BookModel = mongoose.model('books');
  const books = await BookModel.find({uid, disabled: {$ne: true}});
  return await BookModel.extendBooksData(books);
};

schema.statics.getOtherBooksByUserId = async (uid) => {
  const BookModel = mongoose.model('books');
  const books = await BookModel.find({
    uid: {$ne: uid},
    members: {
      $elemMatch: {
        _id: uid
      }
    }
  });
  return await BookModel.extendBooksData(books);
}

schema.methods.bindArticle = async function(articleId) {
  await this.updateOne({
    $addToSet: {
      list: `${articleId}`
    }
  });
}

schema.methods.getList = async function() {
  const articles = await this.extendArticlesById(this.list);
  const articlesObj = {};
  for(const a of articles) {
    articlesObj[a._id] = a;
  }
  const results = [];
  for(const aid of this.list) {
    const article = articlesObj[aid];
    if(!article) continue;
    results.push(article);
  }
  return results;
}

schema.methods.extendArticlesById = async function(articlesId) {
  const ArticleModel = mongoose.model('articles');
  const DocumentModel = mongoose.model('documents');
  const {timeFormat, getUrl} = require('../nkcModules/tools');
  const articles = await ArticleModel.find({_id: {$in: articlesId}});
  const {article: documentSource} = await DocumentModel.getDocumentSources();
  const documents = await DocumentModel.find({
    type: {
      $in: ['beta', 'stable']
    },
    source: documentSource,
    sid: {
      $in: articlesId
    }
  });
  const articlesObj = {};
  for(const d of documents) {
    const {type, sid} = d;
    if (!articlesObj[sid]) articlesObj[sid] = {};
    articlesObj[sid][type] = d;
  }
  const results = [];
  for(const article of articles) {
    const {
      _id,
      toc,
      uid,
    } = article;
    const articleObj = articlesObj[_id];
    if(!articleObj) continue;
    const betaDocument = articlesObj[_id].beta;
    const stableDocument = articlesObj[_id].stable;
    if(!stableDocument && !betaDocument) {
      continue;
    }
    const document = stableDocument || betaDocument;
    const {title} = document;
    const result = {
      _id,
      uid,
      published: !!stableDocument,
      hasBeta: !!betaDocument,
      title: title || '未填写标题',
      url: getUrl('bookContent', this._id, _id),
      time: timeFormat(toc)
    };
    results.push(result);
  }
  return results;
}

schema.methods.getContentById = async function(props) {
  const {aid, uid} = props;
  const {list} = this;
  const ArticleModel = mongoose.model('articles');
  const DocumentModel = mongoose.model('documents');
  const {article: documentSource} = await DocumentModel.getDocumentSources();
  if(list.includes(aid)) {
    const article = await ArticleModel.findOnly({_id: aid});
    const {_id} = article;
    const {
      did,
      time,
      mTime,
      title,
      content,
      coverUrl,
    } = await DocumentModel.getStableDocumentRenderingContent(documentSource, _id, uid);
    return {
      aid: article._id,
      did,
      coverUrl,
      time,
      mTime,
      title,
      content,
      uid,
      note: await article.getNote()
    }
  }
};

/*
* 获取图书成员，包括待处理、拒绝邀请的成员
* @param {[Object]}
*   @param {String} uid 成员 UID
*   @param {String} avatarUrl 成员头像链接
*   @param {String} userHome 成员名片页
*   @param {String} username 成员账号名称
*   @param {String} role 成员角色 admin（管理员），member（普通成员）
*   @param {Boolean} 是否为图书创建者
*   @param {String} 成员邀请状态 pending（等待邀请），resolved（已接收邀请），rejected（已拒绝邀请）
* */
schema.methods.getAllMembers = async function() {
  const {members, uid} = this;
  const {getUrl} = require('../nkcModules/tools');
  const UserModel = mongoose.model('users');
  const usersId = new Set([uid]);
  for(const member of members) {
    usersId.add(member._id);
  }
  const users = await UserModel.find({uid: {$in: [...usersId]}}, {
    username: 1,
    uid: 1,
    avatar: 1
  });
  const usersObj = {};
  for(const user of users) {
    usersObj[user.uid] = user;
  }
  const bookMembers = [];
  members.unshift({
    _id: uid,
    role: 'admin',
    status: 'resolved',
  });
  for(const member of members) {
    const user = usersObj[member._id]
    bookMembers.push({
      uid: user.uid,
      avatarUrl: getUrl('userAvatar', user.avatar, 'sm'),
      userHome: getUrl('userHome', user.uid),
      username: user.username || user.uid,
      role: member.role,
      roleName: {admin: '管理员', member: '普通成员'}[member.role],
      isFounder: user.uid === uid,
      status: member.status,
      statusName: {pending: '已邀请，待处理', resolved: '正常', rejected: '已拒绝'}[member.status]
    })
  }
  return bookMembers;
};

/*
* 获取正常的成员，不包含未通过邀请、等待邀请的成员
* @return 参看 BookModel.methods.getAllMembers
* */
schema.methods.getMembers = async function() {
  const members = await this.getAllMembers();
  return members.filter(m => m.status === 'resolved');
}

/*
* 判断当亲用户是否为该图书的管理员
* */
schema.statics.isModerator = async function(uid, book) {

}

schema.methods.addMembers = async function(membersId) {
  if(!membersId || membersId.length === 0) return;
  const {members, uid} = this;
  // 发送邀请消息
  const messages = [];
  for(const memberId of membersId) {
    if(memberId === uid) {
      throwErr(400, `当前用户已是创作成员`)
    }
    let member;
    for(const m of members) {
      if(m._id !== memberId) continue;
      member = m;
    }
    if(member) {
      if(member.status === 'rejected') {
        member.status === 'pending';
      } else if(member.status === 'resolved') {
        throwErr(400, `当前用户已是创作成员`)
      } else {
        throwErr(400, `已邀请用户，请等待用户处理`)
      }
    } else {
      members.push({
        _id: memberId,
        role: 'member',
        status: 'pending'
      });
    }
  }
  this.members = members;
  await this.updateOne({
    $set: {
      members
    }
  });
};

schema.methods.getFounder = async function() {
  const UserModel = mongoose.model('users');
  return await UserModel.findOnly({uid: this.uid});
}

schema.statics.getBookByBid = async (bid) => {
  const BookModel = mongoose.model('books');
  return await BookModel.findOnly({_id: bid});
}
schema.methods.removeMemberByUid = async function(uid) {
  let {members} = this;
  members = members.filter(m => m._id !== uid);
  this.members = members;
  await this.updateOne({
    $set: {
      members
    }
  });
}

schema.methods.getMemberDataByUid = async function(uid) {
  const members = await this.getAllMembers();
  let member = null;
  for(const m of members) {
    if(m.uid !== uid) continue;
    member = m;
    break;
  }
  return member;
}

schema.methods.isAdmin = async function(uid) {
  const member = await this.getMemberDataByUid(uid);
  return member && member.role === "admin" && member.status === 'resolved'
}

schema.methods.isMember = async function(uid) {
  const member = await this.getMemberDataByUid(uid);
  return member && member.status === 'resolved';
}

schema.statics.getAdminPermissions = async function() {
  return [
    bookPermissions.writeOwnArticle,
    bookPermissions.deleteOwnArticle,
    bookPermissions.writeOtherArticle,
    bookPermissions.deleteOtherArticle,
    bookPermissions.manageBookList,
  ]
}

schema.statics.getMemberPermissions = async function() {
  return [
    bookPermissions.writeOwnArticle,
    bookPermissions.deleteOwnArticle,
  ]
}

/*
* 获取用户在当前图书下的权限
* @param {String} uid 用户ID
* @return {[String]} 权限名 参看 bookPermissions
* */
schema.methods.getUserPermissions = async function(uid) {
  const BookModel = mongoose.model('books');
  const isMember = await this.isMember(uid);
  const isAdmin = await this.isAdmin(uid);
  const {read} = this;
  let permissions = [];
  if(isMember) {
    const memberPermissions = await BookModel.getMemberPermissions();
    permissions = permissions.concat(memberPermissions);
  }
  if(isAdmin) {
    const adminPermissions = await BookModel.getAdminPermissions();
    permissions = permissions.concat(adminPermissions);
  }
  if(
    read === 'everyone' ||
    (read === 'self' && uid === this.uid) ||
    (read === 'member' && isMember)
  ) {
    permissions.push(bookPermissions.readBook);
  }
  return [...new Set(permissions)]
};

/*
* 判断是否拥有阅读图书的权限
* @param {String} uid 用户 ID
* @return {Boolean}
* */
schema.methods.hasReadBookPermission = async function(uid) {
  const permissions = await this.getUserPermissions(uid);
  return permissions.includes(bookPermissions.readBook);
}

schema.methods.checkReadBookPermission = async function(uid) {
  const hasReadBookPermission = await this.hasReadBookPermission(uid);
  if(!hasReadBookPermission) {
    throwErr(403, `权限不足`);
  }
}

module.exports = mongoose.model('books', schema);
