const mongoose = require("../settings/database");
const {getUrl} = require("../nkcModules/tools");
const Schema = mongoose.Schema;
const schema = new Schema({
  _id: Number,
  // 专栏ID
  columnId: {
    type: Number,
    required: true,
    index: 1
  },
  // 分类中置顶的内容 columnPostId
  topped: {
    type: [Number],
    default: [],
    index: 1
  },
  // 分类顺序
  order: {
    type: Number,
    default: 1000,
    index: 1
  },
  // 上级分类
  parentId: {
    type: Number,
    default: null,
    index: 1
  },
  // 所在层级
  level: {
    type: Number,
    default: 0,
    index: 1
  },
  // 是否为默认分类
  default: {
    type: Boolean,
    default: false,
    index: 1
  },
  // 分类名称
  name: {
    type: String,
    required: true,
    index: 1
  },
  // 分类介绍
  description: {
    type: String,
    default: ""
  },
  // 分类简介
  brief: {
    type: String,
    default: ''
  },
  // 分类的创建时间
  toc: {
    type: Date,
    default: Date.now,
    index: 1
  },
  // 分类的类型 主分类或辅分类
  type: {
    type: String,
    enum: ['main', 'minor'],
    index: 1
  }
}, {
  collection: "columnPostCategories"
});
/*
* 拓展专栏内容分类
* */
schema.statics.extendCategories = async (categories) => {
  const ColumnPostModel = mongoose.model("columnPosts");
  const results = [];
  for(let c of categories) {
    c = c.toObject();
    c.count = await ColumnPostModel.countDocuments({cid: c._id});
    results.push(c);
  }
  return results;
};

/*
* 获取专栏的分类树状结构
* @param {Number} columnId 专栏ID
* @author pengxiguaa 2019-7-2
* */

schema.statics.getCategoryTree = async (columnId) => {
  const ColumnPostCategoryModel = mongoose.model('columnPostCategories');
  const ColumnPostModel = mongoose.model('columnPosts');
  let categories = await ColumnPostCategoryModel.find({
    columnId,
    type: 'main'
  }).sort({order: 1});
  const parents = [];
  const categoriesObj = {};
  categories = categories.map(c => {
    c = c.toObject();
    c.children = [];
    categoriesObj[c._id] = c;
    return c;
  });
  for(const c of categories) {
    c.count = await ColumnPostModel.countDocuments({cid: c._id});
    let insert = false;
    if(c.parentId) {
      const parent = categoriesObj[c.parentId];
      if(parent) {
        parent.children.push(c);
        insert = true;
      }
    }
    if(!insert) parents.push(c);
  }
  return parents;
};
/*
* 已分类名缩进表示层级关系
* */
schema.statics.getCategoryList = async (columnId) => {
  const categories = await mongoose.model("columnPostCategories").getCategoryTree(columnId);
  const {getUrl} = require('../nkcModules/tools');
  const arr = [];
  const func = (cc, index) => {
    for(const c of cc) {
      c.level = index;
      c.columnCategoryUrl = getUrl('columnCategory', columnId, c._id);
      arr.push(c);
      if(c.children && c.children.length > 0) {
        func(c.children, index+1);
      }
    }
  };
  func(categories, 0);
  arr.map(a => {
    delete a.children
  });
  return arr;
};

schema.statics.findById = async (_id) => {
  const ColumnPostCategoryModel = mongoose.model("columnPostCategories");
  const category = await ColumnPostCategoryModel.findOne({_id});
  if(category) {
    const categories = await ColumnPostCategoryModel.extendCategories([category]);
    return categories[0];
  }
  return null;
};
/*
* 获取专栏分类层级关系数组
* */
schema.statics.getCategoryNav = async (_id) => {
  const ColumnPostCategoryModel = mongoose.model("columnPostCategories");
  const category = await ColumnPostCategoryModel.findOne({
    _id,
    type: 'main'
  });
  if(!category) return [];
  const categories = await ColumnPostCategoryModel.find({
    columnId: category.columnId,
    type: 'main'
  });
  const categoriesObj = {};
  categories.map(c => {
    categoriesObj[c._id] = c;
  });
  const arr = [];
  const func = (category) => {
    arr.unshift(category);
    if(category.parentId) {
      const parentCategory = categoriesObj[category.parentId];
      if(parentCategory) func(parentCategory);
    }
  };
  func(category);
  return arr;
};
/*
* 计算专栏文章分类的等级
* @param {String} _id 专栏ID
* */
schema.statics.computeCategoryOrder = async (_id) => {
  const ColumnPostCategoryModel = mongoose.model("columnPostCategories");
  const categoriesList = await ColumnPostCategoryModel.getCategoryList(_id);
  await Promise.all(categoriesList.map(async c => {
    await ColumnPostCategoryModel.updateOne({
      _id: c._id
    }, {
      $set: {
        level: c.level
      }
    });
  }));
};
/*
* 获取所有下级分类
* @param {Number} categoryId 分类ID
* @return [Object] 所有分类对象组成的数组
* @author pengxiguaa 2019-7-5
* */
schema.statics.getChildCategory = async (categoryId) => {
  const ColumnPostCategoryModel = mongoose.model("columnPostCategories");
  const {getUrl} = require('../nkcModules/tools');
  const category = await ColumnPostCategoryModel.findOne({
    _id: categoryId,
    type: 'main'
  });
  const results = [];
  const categories = await ColumnPostCategoryModel.getCategoryList(category.columnId);
  const func = (category) => {
    for(const c of categories) {
      if(c.parentId === category._id) {
        c.columnCategoryUrl = getUrl('columnCategory', category.columnId, c._id)
        results.push(c);
        func(c);
      }
    }
  };
  func(category);
  return results;
};
/*
* 返回专栏导航中的分类，只显示第一层，其余都在第二层
* @param {Number} columnId 专栏ID
* */
schema.statics.getColumnNavCategory = async (columnId) => {
  const ColumnPostCategoryModel = mongoose.model("columnPostCategories");
  const categories = await ColumnPostCategoryModel.find({
    columnId,
    type: 'main',
    level: 0
  }).sort({order: 1});
  const results = [];
  for(let category of categories) {
    category = category.toObject();
    category.columnCategoryUrl = getUrl('columnCategory', columnId, category._id)
    category.children = await ColumnPostCategoryModel.getChildCategory(category._id);
    results.push(category);
  }
  return results;
};

/*
* 获取所有下级分类ID
* @param {Number} categoryId 分类ID
* @return [Object] 所有分类ID组成的数组
* @author pengxiguaa 2019-7-5
* */
schema.statics.getChildCategoryId = async (categoryId) => {
  const results = await mongoose.model("columnPostCategories").getChildCategory(categoryId);
  return results.map(r => r._id);
};
/*
 * 获取专栏下一篇文章的分类及其父级分类
 * @param {Array} ids columnPosts表的cid
 *
 */
schema.statics.getParentCategoryByIds = async (ids)=>{
  // 只获取了第一个ID
  const id = ids[0];
  // console.log(id,'id')
  const navList = [];
  const ColumnPostCategoryModel = mongoose.model("columnPostCategories");

  async function currentCategory(id){
    let nav = await ColumnPostCategoryModel.findOne({_id: id, type:'main'});
    nav && navList.push(nav) && nav.parentId && await currentCategory(nav.parentId)
  }
  await currentCategory(id)
  return navList.reverse()


}
/*
* 操作分类内容时，移除不在该分类下的置顶文章
* @param {Number} columnId 专栏ID
* */
schema.statics.removeToppedThreads = async (columnId) => {
  const ColumnPostCategoryModel = mongoose.model("columnPostCategories");
  const ColumnPostModel = mongoose.model("columnPosts");
  const categories = await ColumnPostCategoryModel.find({columnId});
  await Promise.all(categories.map(async c => {
    let {topped} = c;
    const markId = [];
    const columnPosts = await ColumnPostModel.find({_id: {$in: topped}});
    for(const columnPost of columnPosts) {
      if(!columnPost.cid.includes(c._id)) {
        markId.push(columnPost._id);
      }
    }
    topped = topped.filter(t => !markId.includes(t));
    await c.updateOne({topped});
  }));
};
schema.statics.getCategories = async (columnId) => {
  const ColumnPostCategoryModel = mongoose.model('columnPostCategories');
  return await ColumnPostCategoryModel.find({columnId}).sort({order: 1});
};
/*
* 获取指定文章的辅分类
* @param {Array} mcid 专栏ID
* */
schema.statics.getArticleAllMinorCategories = async (mcid) =>{
  const ColumnPostCategoryModel = mongoose.model('columnPostCategories');
  const articleMinorCategories = await ColumnPostCategoryModel.find({_id: {$in: mcid}, type: 'minor'});
  return articleMinorCategories
};
  /*
  * 获取指定专栏的全部辅分类
  * @param {Number} columnId 专栏ID
  * @param {Number} cid 主分类ID
  * @param {Boolean} containChildCategoryPostCount 辅分类条数包含主分类以及主分类下的子分类文章的条数
  * */
schema.statics.getMinorCategories = async (columnId, cid, containChildCategoryPostCount = false) => {
  const ColumnPostCategoryModel = mongoose.model('columnPostCategories');
  const ColumnPostModel = mongoose.model('columnPosts');
  let minorCategories = await ColumnPostCategoryModel.find({
    columnId,
    type: 'minor'
  }).sort({order: 1});
  const minorCategoriesObj = {};
  const mcid = [];
  minorCategories = minorCategories.map(category => {
    category = category.toObject();
    minorCategoriesObj[category._id] = category;
    mcid.push(category._id);
    category.count = 0;
    return category;
  });
  const match = {
    mcid: {
      $in: mcid
    }
  };
  if(cid) {
    if(containChildCategoryPostCount) {
      const childCategoryId = await ColumnPostCategoryModel.getChildCategoryId(cid);
      childCategoryId.push(cid);
      match.cid = {$in: childCategoryId};
    } else {
      match.cid = cid;
    }

  }
  const result = await ColumnPostModel.aggregate(
    [
      {
        $match: match
      },
      {
        $unwind: {
          path: "$mcid"
        }
      },
      {
        $group: {
          _id: "$mcid",
          count: {
            $sum: 1
          }
        }
      }
    ]
  );
  for(const r of result) {
    const {_id, count} = r;
    const category = minorCategoriesObj[_id];
    if(!category) continue;
    category.count = count;
  }
  return minorCategories;
};

/*
* 检测专栏文章分类ID是否存在
* */
schema.statics.checkCategoriesId = async (categoriesId) => {
  const ColumnPostCategoryModel = mongoose.model('columnPostCategories');
  const categories = await ColumnPostCategoryModel.find({_id: categoriesId}, {_id: 1});
  const _categoriesId = categories.map(c => c._id);
  for(const id of categoriesId) {
    if(!_categoriesId.includes(id)) {
      const err = new Error(`未找到ID为${id}的专栏文章分类`);
      err.status = 400;
      throw err;
    }
  }
}
/*
* 渲染分类介绍
* */
schema.methods.renderDescription = async function() {
  const {_id, description} = this;
  const ResourceModel = mongoose.model('resources');
  const referenceId = `columnCategory-${_id}`;
  const resources = await ResourceModel.getResourcesByReference(referenceId);
  const nkcRender = require('../nkcModules/nkcRender');
  this.description = nkcRender.renderHTML({
    type: "article",
    post: {
      c: description,
      resources
    }
  });
  return this.description;
};
/*
* 获取专业分类的下级分类
* */
schema.methods.getChildCategories = async function() {
  const ColumnPostCategoryModel = mongoose.model('columnPostCategories');
  const {_id} = this;
  return await ColumnPostCategoryModel.find({
    parentId: _id
  }, {
    name: 1,
    _id: 1,
    brief: 1
  }).sort({
    order: 1
  });
}

/*
* 检测专栏分类是否合法
* */
schema.statics.checkColumnCategory = async function(selectCategory) {
  const {selectedMainCategoriesId, selectedMinorCategoriesId} = selectCategory;
  const ColumnPostCategoryModel = mongoose.model('columnPostCategories');
  const arr = selectedMainCategoriesId.concat(selectedMinorCategoriesId);
  const categories = await ColumnPostCategoryModel.find({_id: {$in: arr}});
  const obj = {};
  for(const category of categories) {
    obj[category._id] = category;
  }
  for(const id of arr) {
    const category = obj[id];
    if(!category) throwErr(401, `分类Id ${id}无效`);
  }
}

module.exports = mongoose.model("columnPostCategories", schema);
