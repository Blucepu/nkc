const Router = require('koa-router');
const fsPromises = require('fs').promises;
const photoSmallRouter = new Router();
const { photoSmallPath } = require('../settings').upload;
const { Public } = require('../middlewares/permission');
photoSmallRouter.get('/:id', Public(), async (ctx, next) => {
  const { data, db, fs } = ctx;
  const { user } = data;
  const { id } = ctx.params;
  const { disabledPhotoPath, deletedPhotoPath } = ctx.settings.statics;
  const photo = await db.PhotoModel.findOnly({ _id: id });
  if (photo.type === 'fund') {
    // const applicationForm = db.FundApplicationFormModel.findOnly({_id: photo.applicationFormId});
  } else if (['life', 'cert'].includes(photo.type)) {
    const targetUserPersonal = await db.UsersPersonalModel.findOnly({
      uid: photo.uid,
    });
    let displayPhoto;
    if (photo.type === 'life') {
      displayPhoto = targetUserPersonal.privacy.lifePhoto;
    } else {
      displayPhoto = targetUserPersonal.privacy.certPhoto;
    }
    if (!user) {
      if (displayPhoto !== 4) {
        ctx.throw(403, '权限不足');
      }
    } else {
      if (
        user.uid !== photo.uid &&
        !data.userOperationsId.includes('getAnyBodyPhoto')
      ) {
        if (displayPhoto === 0) {
          ctx.throw(403, '权限不足');
        } else if (displayPhoto === 1) {
          const subscribeUsers = await db.SubscribeModel.getUserSubUsersId(
            photo.uid,
          );
          if (!subscribeUsers.includes(user.uid)) {
            ctx.throw(403, '权限不足');
          }
        } else if (displayPhoto === 2) {
          if (user.xsf <= 0) {
            ctx.throw(403, '权限不足');
          }
        } else {
          //
        }
      }
    }
  } else if (!user) {
    ctx.throw(403, '权限不足');
  } else if (
    photo.uid !== user.uid &&
    !data.userOperationsId.includes('getAnyBodyPhoto')
  ) {
    ctx.throw(403, '权限不足');
  }
  ctx.filePath = photoSmallPath + photo.path;
  if (photo.status === 'deleted') {
    ctx.filePath = deletedPhotoPath;
  }
  if (photo.status === 'disabled') {
    ctx.filePath = disabledPhotoPath;
  }
  try {
    await fs.access(ctx.filePath);
  } catch (err) {
    ctx.filePath = deletedPhotoPath;
  }
  ctx.type = 'jpg';
  ctx.set('Cache-Control', 'public, no-cache');
  const tlm = await fsPromises.stat(ctx.filePath);
  ctx.lastModified = new Date(tlm.mtime).toUTCString();
  await next();
});
module.exports = photoSmallRouter;
