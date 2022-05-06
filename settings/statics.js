const path = require('path');
const defaultPath = path.resolve(__dirname, '../public/default');
const resourcesPath = path.resolve(__dirname, '../resources');
const staticPath = path.resolve(__dirname, '../public/statics');
const siteSpecificPath = path.resolve(staticPath, './site');
const attachIconPath = path.resolve(staticPath, './file_cover');
const normalWatermark = path.resolve(defaultPath, './watermark_normal.png');
const smallWatermark = path.resolve(defaultPath, './watermark_small.png');
const watermarkPath = path.resolve(resourcesPath, './watermark')
const normalPictureWatermark = path.resolve(watermarkPath, './picture_watermark_normal.png')
const smallPictureWatermark = path.resolve(watermarkPath, './picture_watermark_small.png')
const normalVideoWatermark = path.resolve(watermarkPath, './video_watermark_normal.png')
const smallVideoWatermark = path.resolve(watermarkPath, './video_watermark_small.png')
const fontTtf = path.resolve(defaultPath, './simsun.ttc');
const fontNotoSansHansMedium = path.resolve(defaultPath, './NotoSansHans-Medium.otf');
// const fontTtf = fontNotoSansHansMedium;
const banner = path.resolve(siteSpecificPath, './ad_default.jpg');
const defaultPfBannerPath = defaultPath + '/default_pf_banner.jpg';
const defaultPfAvatarPath = defaultPath + '/default_pf_avatar.jpg';
const defaultAvatarPath = defaultPath + '/default_user_avatar.jpg';
const defaultAvatarSmallPath = defaultPath + '/default_user_avatar.jpg';
const defaultShopLogoPath = defaultPath + '/default_shopLogo.jpg';
const defaultThumbnailPath = defaultPath + '/default_user_avatar.jpg';
const defaultMediumPath = defaultPath + '/default_resource_image.jpg';
const defaultOriginPath = defaultPath + '/default_resource_image.jpg';
const defaultAdPath = siteSpecificPath + '/ad_default.jpg';
const defaultImageResourcePath = defaultPath + '/default_resource_image.jpg';
const defaultUserBannerPath = defaultPath + '/default_user_banner.jpg';
const defaultMessageFilePath = defaultPath + '/default_resource_image.jpg';
const defaultMessageVideoFramePath = defaultPath + '/default_message_video_frame.jpg';
const defaultVideoCoverPath = defaultPath + '/videoCover.jpg';
const defaultPostCoverPath = defaultPath + "/default_resource_image.jpg";
const defaultForumBannerPath = defaultPath + "/forum_banner.jpg";
const defaultColumnAvatarPath = defaultPath + "/column_avatar.jpg";
const defaultColumnBannerPath = defaultPath + "/column_banner.jpg";
const defaultPosterPath = defaultPath + "/default_resource_image.jpg";
const defaultRoleIconPath = staticPath + '/role_icon';
const defaultHomeBigLogo = siteSpecificPath + '/kclogo_misaka1.png';
const deletedPhotoPath = defaultPath + '/deleted_photo.jpg';
const disabledPhotoPath = defaultPath + '/disabled_photo.jpg';
const defaultSiteIconPath = siteSpecificPath + '/favicon.ico';
const defaultNoAccessImagePath = defaultPath + '/no_access.jpg';
// 默认表情图
const defaultStickerImage = defaultPath + '/default_avatar.gif';
const defaultScoreIconPath = defaultPath + '/kcb.png';
const defaultPreviewJPG = defaultPath + '/preview_footer.jpg';
// 网站 logo
const defaultLogoICO = path.resolve(siteSpecificPath, './favicon.ico');
const defaultLogoSM = path.resolve(siteSpecificPath, './logo.png');
const defaultLogoMD = defaultLogoSM;
const defaultLogoLG = defaultLogoSM;
const resourceLogoPath = path.resolve(resourcesPath, './logo');
const logoICO = path.resolve(resourceLogoPath, './favicon.ico');
const logoSM = path.resolve(resourceLogoPath, './logo_sm.png');
const logoMD = path.resolve(resourceLogoPath, './logo_md.png');
const logoLG = path.resolve(resourceLogoPath, './logo_lg.png');

module.exports = {
  defaultPreviewJPG,
  deletedPhotoPath,
  disabledPhotoPath,
  defaultScoreIconPath,
  defaultSiteIconPath,
  siteSpecificPath,
  defaultRoleIconPath,
  watermark: normalWatermark,
  normalWatermark,
  smallWatermark,
  banner,
  fontTtf,
  fontNotoSansHansMedium,
  defaultPfBannerPath,
  defaultPfAvatarPath,
  defaultAvatarPath,
  defaultAvatarSmallPath,
  defaultShopLogoPath,
  defaultThumbnailPath,
  defaultMediumPath,
  defaultOriginPath,
	defaultUserBannerPath,
  defaultPath,
  attachIconPath,
  defaultPostCoverPath,
  defaultAdPath,
  defaultImageResourcePath,
  defaultMessageVideoFramePath,
  defaultMessageFilePath,
  defaultForumBannerPath,
  defaultVideoCoverPath,
  defaultColumnAvatarPath,
  defaultColumnBannerPath,
  defaultPosterPath,
  defaultHomeBigLogo,
  defaultStickerImage,
  defaultNoAccessImagePath,
  normalPictureWatermark,
  smallPictureWatermark,
  normalVideoWatermark,
  smallVideoWatermark,

  defaultLogoICO,
  defaultLogoLG,
  defaultLogoMD,
  defaultLogoSM,
  logoICO,
  logoSM,
  logoMD,
  logoLG
};
