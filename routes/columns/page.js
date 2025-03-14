const Router = require('koa-router');
const { renderHTMLByJSON } = require('../../nkcModules/nkcRender/json');
const { getJsonStringTextSlice } = require('../../nkcModules/json');
const { OnlyUnbannedUser, Public } = require('../../middlewares/permission');
const router = new Router();
router
  .post('/', OnlyUnbannedUser(), async (ctx, next) => {
    const { data, db, body } = ctx;
    const { column, user } = data;
    const userPermissionObject =
      await db.ColumnModel.getUsersPermissionKeyObject();
    const isPermission = await db.ColumnModel.checkUsersPermission(
      column.users,
      user.uid,
      userPermissionObject.column_settings_page,
    );
    if (column.uid !== user.uid && !isPermission) ctx.throw(403, '权限不足');
    // if(column.uid !== user.uid) ctx.throw(403, "权限不足");
    const pageCount = await db.ColumnPageModel.countDocuments({
      columnId: column._id,
    });
    const columnSettings = await db.SettingModel.getSettings('column');
    if (pageCount >= columnSettings.pageCount)
      ctx.throw(400, `最多允许创建${columnSettings.pageCount}个自定义页面`);
    const { title, content } = body;
    if (!content) ctx.throw(400, '页面内容不能为空');
    const page = db.ColumnPageModel({
      _id: await db.SettingModel.operateSystemID('columnPages', 1),
      columnId: column._id,
      t: title,
      c: content,
      l: 'json',
    });
    await page.save();
    data.page = page;
    await db.ColumnPageModel.toSearch(page._id);
    await next();
  })
  .put('/:pageId', OnlyUnbannedUser(), async (ctx, next) => {
    const { data, db, body, params } = ctx;
    const { column, user } = data;
    const { pageId } = params;
    const { type } = body;
    const userPermissionObject =
      await db.ColumnModel.getUsersPermissionKeyObject();
    const isPermission = await db.ColumnModel.checkUsersPermission(
      column.users,
      user.uid,
      userPermissionObject.column_settings_page,
    );
    if (column.uid !== user.uid && !isPermission) ctx.throw(403, '权限不足');
    // if(column.uid !== user.uid) ctx.throw(403, "权限不足");
    const page = await db.ColumnPageModel.findOne({
      columnId: column._id,
      _id: pageId,
    });
    if (!page) ctx.throw(400, `未找到ID为${pageId}的自定义页面`);
    if (type === 'modifyContent') {
      const { title, content } = body;
      if (!content) ctx.throw(400, '页面内容不能为空');
      page.t = title;
      page.c = content;
      page.tlm = Date.now();
      await page.save();
      await db.ColumnPageModel.toSearch(page._id);
    } else if (type === 'hide') {
      let { hidden } = body;
      hidden = !!hidden;
      await page.updateOne({
        hidden,
      });
    } else if (type === 'toNav') {
      const { links } = column;
      let added = false;
      for (const link of links) {
        if (link.url === url) {
          added = true;
          break;
        }
      }
      if (!added) {
        await column.updateOne({
          $addToSet: {
            links: {
              name: page.t || '新建导航',
              url,
            },
          },
        });
      }
    } else if (type === 'setAsHome') {
      const { asHome } = body;
      await db.ColumnPageModel.updateMany(
        {
          columnId: column._id,
          asHome: true,
        },
        {
          $set: {
            asHome: false,
          },
        },
      );
      if (asHome) {
        await page.updateOne({
          $set: {
            asHome: true,
          },
        });
      }
    }
    data.page = page;
    await next();
  })
  .del('/:pageId', OnlyUnbannedUser(), async (ctx, next) => {
    const { data, db, params } = ctx;
    const { column, user } = data;
    const { pageId } = params;
    const userPermissionObject =
      await db.ColumnModel.getUsersPermissionKeyObject();
    const isPermission = await db.ColumnModel.checkUsersPermission(
      column.users,
      user.uid,
      userPermissionObject.column_settings_page,
    );
    if (column.uid !== user.uid && !isPermission) ctx.throw(403, '权限不足');
    // if(column.uid !== user.uid) ctx.throw(403, "权限不足");
    const page = await db.ColumnPageModel.findOne({
      columnId: column._id,
      _id: pageId,
    });
    if (!page) ctx.throw(400, `未找到ID为${pageId}的自定义页面`);
    await page.deleteOne();
    await next();
  })
  .get('/:pageId', Public(), async (ctx, next) => {
    const { data, db, params, nkcModules } = ctx;
    const { pageId } = params;
    const { column, user } = data;
    // data.column = await column.extendColumn();
    const page = await db.ColumnPageModel.findOne({
      columnId: column._id,
      _id: pageId,
    });
    if (!page) ctx.throw(404, `未找到ID为${pageId}的自定义页面`);
    if (page.hidden && (!user || column.uid !== user.uid))
      ctx.throw(403, '该页面已被专栏主关闭');
    data.pageContent =
      page.l === 'json'
        ? getJsonStringTextSlice(page.c, 150)
        : nkcModules.nkcRender.htmlToPlain(page.c, 150);
    page.c =
      page.l === 'json'
        ? renderHTMLByJSON({
            json: page.c,
            resources: await db.ResourceModel.getResourcesByReference(
              `column-${pageId}`,
            ),
            xsf: data?.user?.xsf,
          })
        : nkcModules.nkcRender.renderHTML({
            type: 'article',
            post: {
              c: page.c,
              resources: await db.ResourceModel.getResourcesByReference(
                `column-${pageId}`,
              ),
            },
            user: data.user,
          });
    data.page = page;
    data.authorAccountRegisterInfo = await db.UserModel.getAccountRegisterInfo({
      uid: column.uid,
    });
    // data.navCategories = await db.ColumnPostCategoryModel.getColumnNavCategory(column._id);
    // data.categories = await db.ColumnPostCategoryModel.getCategoryList(column._id);
    // data.timeline = await db.ColumnModel.getTimeline(column._id);
    data.permissions = {
      column_single_disabled: ctx.permission('column_single_disabled'),
    };
    ctx.template = 'columns/page.pug';
    await next();
  });
module.exports = router;
