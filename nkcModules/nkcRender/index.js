// const cheerio = require("./customCheerio");
const cheerio = require('cheerio');
const htmlFilter = require('./htmlFilter');
const markNotes = require('./markNotes');
const twemoji = require('twemoji');
const plainEscape = require('../plainEscaper');
const URLifyHTML = require('../URLifyHTML');
const fs = require('fs');
const path = require('path');
const filePath = path.resolve(__dirname, './sources');
const files = fs.readdirSync(filePath);
const { replaceEmojiWithImgTags } = require('../fluentuiEmoji');

const sources = {};
for (const filename of files) {
  const name = filename.split('.')[0];
  sources[name] = require(filePath + `/${name}`);
}
const { domainWhitelistReg, urlReg } = require('../../nkcModules/regExp');

const NKCWebHTMLSource = require('./sources/NKCWebHTML');

class NKCRender {
  constructor() {
    this.htmlFilter = htmlFilter;
    this.markNotes = markNotes;
  }
  /*
   * 此方法用于渲染富文本，适配原始的NKC页面
   * 新的渲染方法在renderNKCWebHTML，新方法适配NextJS页面
   * */
  renderHTML(options) {
    // 渲染html
    // <nkcsource></nkcsource>模板解析
    // 学术分判断
    const self = this;
    let {
      type = 'article',
      post = {},
      user = {},
      source = 'post',
      sid = '',
    } = options;
    if (source === 'post') {
      sid = options.post.pid;
    }
    const { resources = [], atUsers = [] } = post;
    let html = post.c || '';
    // 序列化html
    const $ = cheerio.load(html);
    // 渲染文章中的图片、视频、音频等特殊模板
    const _resources = {};
    for (let r of resources) {
      if (r.toObject) {
        r = r.toObject();
      }
      _resources[r.rid] = r;
    }
    if (type === 'article') {
      // 文中的所有a标签
      const links = $('a');
      for (let i = 0; i < links.length; i++) {
        const a = links.eq(i);
        this.replaceExternalLink(a);
      }

      // 文章中的图片
      const images = $('img');
      for (let i = 0; i < images.length; i++) {
        const image = images.eq(i);
        const src = image.attr('src');
        const dataTag = image.attr('data-tag');
        const dataType = image.attr('data-type');
        const dataId = image.attr('data-id');
        if (dataTag === 'nkcsource' && dataType === 'picture' && dataId) {
          continue;
        }
        const reg = /^(http(s)?:\/\/|ftp:\/\/)/i;
        if (!src || !reg.test(src)) {
          continue;
        }
        if (domainWhitelistReg.test(src)) {
          continue;
        }
        image.replaceWith(
          `<span data-tag="nkcsource" data-type="externalImage">外链图片已失效，请作者重新上传</span>`,
        );
      }
    }
    const sourceMethods = sources[type];

    for (const name in sourceMethods) {
      if (!sourceMethods.hasOwnProperty(name)) {
        continue;
      }
      const method = sourceMethods[name];
      $(`[data-tag="nkcsource"][data-type="${name}"]`).replaceWith(function () {
        const dom = $(this);
        const _html = dom.toString();
        const id = dom.data().id + '';
        const resource = _resources[id];
        if (resource && !resource._rendered) {
          resource.oname = self.plainEscape(resource.oname || '');
          resource._rendered = true;
        }
        return method(_html, id, resource, user);
      });
    }

    const body = $('body');

    if (type === 'article') {
      this.replaceATInfo($, body[0], atUsers);
      this.replaceLinkInfo($, body[0]);
      // this.addLinksToArticle($, body[0]);
    }
    html = body.html();
    if (type === 'article') {
      html = replaceEmojiWithImgTags(html);
    }
    // 过滤标签及样式
    let id;
    if (post.pid) {
      id = `${post.pid}`;
    }

    const container = $('<div></div>');
    container
      .attr({
        class: 'render-content math-jax',
        'data-type': 'nkc-render-content',
        'data-id': id,
        'data-source': source,
        'data-sid': sid,
      })
      .html(html || '');

    html = container.prop('outerHTML');
    return htmlFilter(html);
  }

  renderNKCWebHTML(props) {
    const {
      source = '',
      sid = '',
      resources = [],
      atUsers = [],
      html: originHTML,
      userXSF = 0,
      userLogged = false,
      showVideoMask = false,
      videoMaskContent = '',
    } = props;
    const $ = cheerio.load(originHTML);
    const _resources = {};
    for (let r of resources) {
      if (r.toObject()) {
        r = r.toObject();
      }
      _resources[r.rid] = r;
    }
    // 文中的所有a标签
    const links = $('a');
    for (let i = 0; i < links.length; i++) {
      const a = links.eq(i);
      this.replaceExternalLink(a);
    }

    // 文章中的图片
    const images = $('img');
    for (let i = 0; i < images.length; i++) {
      const image = images.eq(i);
      const src = image.attr('src');
      const dataTag = image.attr('data-tag');
      const dataType = image.attr('data-type');
      const dataId = image.attr('data-id');
      if (dataTag === 'nkcsource' && dataType === 'picture' && dataId) {
        continue;
      }
      const reg = /^(http(s)?:\/\/|ftp:\/\/)/i;
      if (!src || !reg.test(src)) {
        continue;
      }
      if (domainWhitelistReg.test(src)) {
        continue;
      }
      image.replaceWith(
        `<span data-tag="nkcsource" data-type="external-image">外链图片已失效，请作者重新上传</span>`,
      );
    }

    const { attachment, xsf, pre, sticker, video, picture, audio } =
      NKCWebHTMLSource;

    const nkcSources = $(`[data-tag="nkcsource"]`);

    for (let i = 0; i < nkcSources.length; i++) {
      const nkcSource = nkcSources.eq(i);
      nkcSource.replaceWith(function () {
        const dom = $(this);
        const domHTML = dom.toString();
        const { id, type } = dom.data();
        const resource = _resources[id];
        resource.oname = self.plainEscape(resource.oname || '');
        resource._rendered = true;

        const limitVisitor = resource.visitorAccess && !userLogged;

        switch (type) {
          case 'xsf': {
            return xsf({
              html: domHTML,
              presetMinXSF: id,
              userXSF: userXSF,
            });
          }
          case 'pre': {
            return pre({
              html: domHTML,
            });
          }
          case 'sticker': {
            return sticker({
              rid: id,
            });
          }
          case 'video': {
            return video({
              rid: id,
              resource,
              limitVisitor,
              showMask: showVideoMask,
              maskContent: videoMaskContent,
            });
          }
          case 'audio': {
            return audio({
              rid: id,
              resource,
              limitVisitor,
            });
          }
          case 'picture': {
            return picture({
              rid: id,
              resource,
              limitVisitor,
            });
          }
          case 'attachment': {
            return attachment({
              rid: id,
              resource,
              limitVisitor,
            });
          }
          default: {
            return domHTML;
          }
        }
      });
    }

    const body = $('body');

    this.replaceATInfo($, body[0], atUsers);
    this.replaceLinkInfo($, body[0]);

    let html = body.html();
    html = twemoji.parse(html, {
      folder: '/2/svg',
      class: 'emoji',
      attributes: () => {
        return {
          'data-tag': 'nkcsource',
          'data-type': 'twemoji',
        };
      },
      base: '/twemoji',
      ext: '.svg',
    });

    // 过滤标签及样式
    return htmlFilter(
      `
      <div data-type="nkc-rendered-content" data-source="${source}" data-sid="${sid}">${html}</div>
    `.trim(),
    );
  }

  replaceNKCSource() {}

  /* 解析字符串中的@信息
     例如: 这是前面的内容@username这是后面的内容
     输出：
     [
      {
        type: 'text',
        content: '这是前面的内容'
      },
      {
        type: 'tag',
        content: '<a href="/u/:uid" target="_blank">@username</a>'
      },
      {
        type: 'text',
        content: '这是后面的内容'
      }
    ]
  */
  extendAtByText(text, atUsers) {
    const nodes = [];
    const usersObj = {};
    const usersName = [];
    for (let i = 0; i < atUsers.length; i++) {
      const u = atUsers[i];
      let username = u.username ? u.username.toLowerCase() : '';
      if (!username) {
        continue;
      }
      usersObj[username] = u;
      usersName.push(`@${username}`);
    }
    if (usersName.length === 0 || !text) {
      nodes.push({
        type: 'text',
        content: text,
      });
    } else {
      const atReg = new RegExp(`(${usersName.join('|')})`, 'i');
      const extendNode = function (text) {
        if (!text) {
          return;
        }
        const result = text.match(atReg);
        if (result === null) {
          return nodes.push({
            type: 'text',
            content: text,
          });
        }
        const { index } = result;
        const [targetText] = result;
        if (index > 0) {
          const beforeText = text.slice(0, index);
          nodes.push({
            type: 'text',
            content: beforeText,
          });
        }
        const username = targetText.slice(1, targetText.length);
        const u = usersObj[username.toLowerCase()];
        if (!u) {
          nodes.push({
            type: 'text',
            content: targetText,
          });
        } else {
          nodes.push({
            type: 'tag',
            content: `<a href="/u/${u.uid}" target="_blank">${targetText}</a>`,
          });
        }
        const afterText = text.slice(index + targetText.length, text.length);
        extendNode(afterText);
      };
      extendNode(text);
    }

    if (
      nodes.length === 0 ||
      (nodes.length === 1 && nodes[0].type === 'text')
    ) {
      return [];
    } else {
      return nodes;
    }
  }

  // 处理文本中的@信息，将@+用户名改为#nkcat{uid}用于后边插入a标签
  replaceATInfo($, node, atUsers) {
    if (atUsers.length === 0 || !node.children || node.children.length === 0) {
      return;
    }
    for (let i = 0; i < node.children.length; i++) {
      const c = node.children[i];
      if (c.type === 'text') {
        const nodes = this.extendAtByText(c.data, atUsers);
        if (nodes.length === 0) {
          continue;
        }
        const container = $('<span></span>');
        for (const node of nodes) {
          const { content, type } = node;
          let nodeDom;
          if (type === 'text') {
            nodeDom = $('<span></span>');
            nodeDom.text(content);
          } else {
            nodeDom = $(content);
          }
          container.append(nodeDom);
        }
        $(c).replaceWith(container);
      } else if (c.type === 'tag') {
        if (['a', 'blockquote', 'code', 'pre'].includes(c.name)) {
          continue;
        }
        if (c.attribs['data-tag'] === 'nkcsource') {
          continue;
        }
        this.replaceATInfo($, c, atUsers);
      }
    }
  }

  // 处理所有的文本外链
  replaceLinkInfo($, node) {
    if (!node.children || node.children.length === 0) {
      return;
    }
    for (let i = 0; i < node.children.length; i++) {
      const c = node.children[i];
      if (c.type === 'text') {
        // 替换外链
        let oldData = c.data;
        const newData = this.replaceLink(c.data);
        if (oldData !== newData) {
          oldData = Buffer.from(encodeURIComponent(oldData)).toString('base64');
          const nodeDom = $(
            `<span data-type="nkc-url" data-url="${oldData}"></span>`,
          );
          nodeDom.text(newData);
          $(c).replaceWith(nodeDom);
        }
      } else if (c.type === 'tag') {
        if (['code', 'pre'].includes(c.name)) {
          continue;
        }
        if (c.attribs['data-tag'] === 'nkcsource') {
          continue;
        }
        this.replaceLinkInfo($, c);
      }
    }
  }

  // 替换文本中的链接为span标签，标签内容为xxx，前端再根据span属性中的链接信息恢复链接
  replaceTextLinkToHTML(content = '') {
    const $ = cheerio.load('');
    const body = $('body');
    body.text(content);
    this.replaceLinkInfo($, body[0]);
    const html = body.html();
    return htmlFilter(html);
  }

  encodeRFC5987ValueChars(str) {
    return (
      encodeURIComponent(str)
        // 注意，仅管 RFC3986 保留 "!"，但 RFC5987 并没有
        // 所以我们并不需要过滤它
        .replace(/['()]/g, (c) => {
          if (c === "'") {
            return '%27';
          } else if (c === '(') {
            return '%28';
          } else {
            return '%29';
          }
        }) // i.e., %27 %28 %29
        .replace(/\*/g, '%2A')
    );
    // 下面的并不是 RFC5987 中 URI 编码必须的
    // 所以对于 |`^ 这3个字符我们可以稍稍提高一点可读性
    // replace(/%(?:7C|60|5E)/g, unescape);
  }
  plainEscape(c) {
    c = plainEscape(c);
    return htmlFilter(c);
  }
  URLifyHTML(c) {
    return URLifyHTML(c);
  }

  // 将html中的外链替换成外链中转页的链接
  replaceHTMLExternalLink(html = '') {
    const $ = cheerio.load(html);
    const aElements = $('a');
    for (let i = 0; i < aElements.length; i++) {
      const aElement = aElements.eq(i);
      this.replaceExternalLink(aElement);
    }
    return $('body').html();
  }
  // 将a标签实例中的外链替换成外链中转页的链接
  replaceExternalLink(aElement) {
    if (!aElement) {
      return;
    }
    const href = aElement.attr('href');
    // 外链在新标签页打开
    if (href && !domainWhitelistReg.test(href)) {
      aElement.attr('target', '_blank');
      // 通过提示页代理外链的访问
      const url = encodeURIComponent(Buffer.from(href).toString('base64'));
      aElement.attr('href', '/l?t=' + url);
      // a.attr('data-type', 'nkc-url');
      // a.attr('data-url', url);
    }
  }

  htmlToPlain(html = '', count) {
    const $ = cheerio.load(html);
    $(`[data-tag="nkcsource"]`).remove();
    let text = $.text();
    const textLength = text.length;
    text = text.slice(0, count);
    if (count < textLength) {
      text += '...';
    }
    return text;
  }
  replaceLink(data) {
    data = data || '';
    return data.replace(urlReg, (c) => {
      if (domainWhitelistReg.test(c)) {
        return c;
      } else {
        const arr = Array(c.length).fill('X');
        return arr.join('');
      }
    });
  }
  addLinksToArticle($, element) {
    const childNodes = element.childNodes;
    if (!childNodes || childNodes.length === 0) {
      return;
    }
    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];

      if (node.type === 'text') {
        const text = node.data || '';
        const replacedText = text.replace(/#((D|t)?\d+)/g, (match, p1) => {
          const link = /^D(\d+)$/.test(p1)
            ? `/document/d/${p1.replace(/^D/, '')}`
            : `/p/${p1}?redirect=true`;
          return `<a href="${link}" target="_blank">${match}</a>`;
        });

        if (replacedText !== text) {
          // const newNode = $(`<span>${replacedText}</span>`);
          const newNode = $(replacedText);
          $(node).replaceWith(newNode);
        }
      } else if (node.type === 'tag') {
        if (['a', 'blockquote', 'code', 'pre'].includes(node.name)) {
          continue;
        }
        if (node.attribs['data-tag'] === 'nkcsource') {
          continue;
        }
        this.addLinksToArticle($, node);
      }
    }
  }
}

module.exports = new NKCRender();
