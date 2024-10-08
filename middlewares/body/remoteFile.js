const http = require('http');
const FILE = require('../../nkcModules/file');
const ContentDisposition = require('content-disposition');
const { pictureExtensions, breakpointExtensions } = FILE;
const fileBody = require('./file');
module.exports = async (ctx) => {
  // 关闭 gzip 压缩
  ctx.compress = false;
  const { remoteFile, isAttachment, settings } = ctx;
  const { url: fileUrl, filename = '' } = remoteFile;
  let ext = filename.split('.');
  ext = ext.pop() || '';
  ext = ext.toLowerCase();
  if (!ext) {
    ctx.throw(500, `远程文件格式不能为空`);
  }
  let fileRes;
  try {
    fileRes = await getRemoteFileRes(fileUrl.toString(), ctx);
  } catch (err) {
    // store service 报错时返回一张默认图片
    const { lostImage } = settings.statics;
    ctx.filePath = lostImage;
    return await fileBody(ctx);
  }

  let contentDispositionType;
  if (
    isAttachment ||
    (!pictureExtensions.includes(ext) && !breakpointExtensions.includes(ext))
  ) {
    contentDispositionType = 'attachment';
  } else {
    contentDispositionType = 'inline';
  }
  ctx.type = ext;
  ctx.body = fileRes;
  ctx.set(
    'content-disposition',
    ContentDisposition(filename, { type: contentDispositionType }),
  );
  const fileResContentLength = fileRes.headers[`content-length`];
  const fileResAcceptRanges = fileRes.headers[`accept-ranges`];
  const fileResCacheControl = fileRes.headers[`cache-control`];
  const fileResRange = fileRes.headers[`content-range`];
  const fileResConnection = fileRes.headers[`connection`];
  const fileResEtag = fileRes.headers[`etag`];
  if (fileResAcceptRanges) {
    ctx.set('accept-ranges', fileResAcceptRanges);
  }
  if (fileResCacheControl) {
    ctx.set('cache-control', fileResCacheControl);
  }
  if (fileResConnection) {
    ctx.set('connection', fileResConnection);
  }
  if (fileResContentLength) {
    ctx.set('content-length', fileResContentLength);
  }
  if (fileResEtag) {
    ctx.set('etag', fileResEtag);
  }
  if (ctx.fresh) {
    ctx.status = 304;
    return;
  }
  if (fileResRange) {
    ctx.set(`content-range`, fileResRange);
    ctx.status = 206;
  }
  ctx.fileContentLength = fileResContentLength;
};

function getRemoteFileRes(url, ctx) {
  const headerRange = ctx.request.headers['range'];
  const options = {
    agent: new http.Agent({
      keepAlive: true,
      timeout: 30000,
    }),
    method: 'GET',
  };
  if (headerRange) {
    options.headers = {
      range: headerRange,
    };
  }
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      res.on('error', reject);
      if (res.statusCode >= 400) {
        res.setEncoding('utf8');
        let resData = '';
        res.on('data', (d) => {
          resData += d;
        });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(resData);
            reject(parsedData);
          } catch (err) {
            reject(err);
          }
        });
      } else {
        resolve(res);
      }
    });
    req.on('error', reject);
    req.end();
  });
}
