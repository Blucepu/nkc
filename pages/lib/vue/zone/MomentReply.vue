<template lang="pug">
  .single-moment-container(v-if='momentData')
    moment-status(
      ref='momentStatus',
      :moment='momentData',
      :permissions='permissions'
    )
    #comment-content.single-moment-top-container
      .single-moment-left
        .single-moment-avatar(
          data-global-mouseover='showUserPanel',
          data-global-mouseout='hideUserPanel',
          :data-global-data='objToStr({ uid: momentData.uid })'
        )
          img(:src='momentData.avatarUrl')
      .single-moment-right
        .single-moment-header
          .single-moment-user(
            data-global-mouseover='showUserPanel',
            data-global-mouseout='hideUserPanel',
            :data-global-data='objToStr({ uid: momentData.uid })'
          )
            a(:href='momentData.userHome', target='_blank') {{ momentData.username }}
          .single-moment-time
            from-now(:time='momentData.toc')
            span &nbsp;IP:{{ momentData.addr }}
            span(v-if='momentData.tlm > momentData.toc') &nbsp;已编辑
          .single-moment-header-options.fa.fa-ellipsis-h(
            @click='openOption(momentData,$event)',
            data-direction='down'
          )
          moment-option(
            ref='momentOption',
            @complaint='complaint',
            @selectedMomentId='handleMid'
          )
        //- 动态内容
        .single-moment-content(
          :class='{ simple: !expandContent }',
          ref='momentDetails',
          @click.stop='handleClick(momentData.url,$event)'
        )
          .single-moment-content-html(
            v-html='momentData.plain',
            ref='momentDetailsContent'
          )
          .singe-moment-details.extend-content(
            v-if='isFold && !expandContent',
            @click.self.stop='openContent()'
          ) 显示更多
          .singe-moment-details(
            v-if='isFold && expandContent',
            @click.self.stop='closeContent'
          ) 收起  
        //- 图片视频
        .single-moment-files
          moment-files(:data='momentData.files')
        //- 引用内容
        .single-moment-quote.m-b-1(v-if='momentData.parentData')
          moment-quote(:data='momentData.parentData', :uid='momentData.uid')
  </template>

<style lang="less" scoped>
@import '../../../publicModules/base';

.single-moment-top-container {
  @avatarWidth: 4rem;
  @avatarWidthMin: 3rem;
  position: relative;
  padding-left: @avatarWidth + 1rem;
  min-height: @avatarWidth;

  @media (max-width: 768px) {
    padding-left: 4rem;
    min-height: 3.5rem;
  }

  .single-moment-left {
    position: absolute;
    top: 0;
    left: 0;
    width: @avatarWidth;

    .single-moment-avatar {
      height: @avatarWidth;
      width: @avatarWidth;

      @media (max-width: 768px) {
        height: 3.5rem;
        width: 3.5rem;
      }

      border-radius: 50%;
      overflow: hidden;

      img {
        height: 100%;
        width: 100%;
      }
    }
  }

  .single-moment-quote {
    width: 100%;
    max-width: 100%;
    padding: 1rem;
    border: 1px solid #d5d5d5;
    border-radius: 5px;
    background-color: #f6f2ee;
  }

  .single-moment-files {
    font-size: 0;
    max-width: 70%;

    @media (max-width: 768px) {
      max-width: 100%;
    }
  }

  .single-moment-options {
    position: relative;
    @padding: 3rem;
    height: @padding;
    line-height: @padding;
    padding-left: @padding;
    padding-right: @padding;
    font-size: 1.3rem;
    text-align: center;
    color: #3f3f3f;

    &>* {
      cursor: pointer;

      &.active {
        color: @accent;
      }
    }

    .single-moment-options-left {
      text-align: left;
      position: absolute;
      top: 0;
      left: 0;
      height: @padding;
      line-height: @padding;
      cursor: pointer;

      .fa {
        margin-right: 0.5rem;
      }

      span {
        font-size: 1.1rem;
      }
    }

    .single-moment-options-center {
      display: inline-block;
      padding: 0 1rem;

      .fa {
        margin-right: 0.5rem;
      }

      span {
        font-size: 1.1rem;
      }
    }

    .single-moment-options-right {
      position: absolute;
      top: 0;
      right: 0;
      height: @padding;
      line-height: @padding;
      cursor: pointer;
      text-align: right;

      .fa {
        margin-right: 0.5rem;
      }

      span {
        font-size: 1.1rem;
      }
    }
  }
}

.single-moment-header {
  padding-right: 8rem;
  margin-bottom: 0.2rem;
  @optionHeight: 2rem;
  position: relative;

  .single-moment-user {
    display: inline-block;
    margin-right: 0.3rem;
    font-weight: 700;
    font-size: 1.25rem;

    a {
      color: @primary;
    }
  }

  .single-moment-time {
    display: inline-block;
    font-size: 1rem;
    color: #555;
  }

  .single-moment-tag {
    display: inline-block;
    position: absolute;
    right: 2.2rem;
    top: 0;
    cursor: default;
    border-width: 1px;
    border-style: solid;
    font-size: 1rem;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    vertical-align: middle;
    border-radius: 4px;
    padding: 0 9px;
    height: 2rem;
    line-height: 2rem;
  }

  .own {
    border-color: #d9ecff;
    border-radius: 4px;
    background-color: #ecf5ff;
    color: #409eff;
  }

  .attention {
    border-color: #faecd8;
    background-color: #fdf6ec;
    color: #e6a23c;
  }

  .everyone {
    border-color: #e1f3d8;
    background-color: #f0f9eb;
    color: #67c23a;
  }

  .single-moment-header-options {
    height: @optionHeight;
    line-height: @optionHeight;
    text-align: center;
    width: @optionHeight;
    position: absolute;
    font-size: 1.5rem;
    color: #555;
    top: 0;
    right: 0;
    cursor: pointer;
  }
}

.single-moment-content {
  &.simple {
    overflow: hidden;
    max-height: 192px;
    position: relative;

    .single-moment-content-html {
      cursor: pointer;
    }
  }

  .single-moment-content-html {
    all: initial;
    overflow: hidden;

    &/deep/ img.message-emoji {
      height: 2rem;
      width: 2rem;
      margin: 0 0.1rem;
      vertical-align: text-bottom;
    }

    &/deep/ a {
      color: @primary;
    }

    /deep/p {
      font-size: 1.25rem;
      color: #000;
      line-height: 1.6em;
      margin-bottom: 0.5rem;
      word-break: break-word;
      word-wrap: break-word;
      min-height: 1.6em;
    }
  }
}

.singe-moment-details {
  color: rgb(29, 155, 240);
  cursor: pointer;
  padding-bottom: 0.5rem;

  &.extend-content {
    display: flex;
    flex-direction: column;
    justify-content: end;
    height: 5rem;
    position: absolute;
    width: 100%;
    bottom: 0;
    left: 0;
    background: rgb(255, 255, 255);
    background: linear-gradient(0deg,
        rgba(255, 255, 255, 1) 0%,
        rgba(255, 255, 255, 1) 50%,
        rgba(255, 255, 255, 0) 100%);
  }
}
</style>

<script>
import { sweetError } from '../../js/sweetAlert';
import { objToStr } from '../../js/tools';
import FromNow from '../../../lib/vue/FromNow';
import MomentFiles from './MomentFiles';
import MomentComments from './MomentComments';
import MomentQuote from './MomentQuote';
import MomentStatus from './MomentStatus';
import { visitUrl } from '../../js/pageSwitch';
import MomentOptionFixed from './momentOption/MomentOptionFixed';
import { getState } from '../../js/state';
import MomentEditor from './MomentEditor.vue';
import { lazyLoadInit } from '../../js/lazyLoad';
import { copyTextToClipboard } from '../../js/clipboard';

const state = getState();
export default {
  components: {
    'from-now': FromNow,
    'moment-files': MomentFiles,
    'moment-comments': MomentComments,
    'moment-quote': MomentQuote,
    'moment-status': MomentStatus,
    'moment-option': MomentOptionFixed,
    'moment-editor': MomentEditor,
  },
  props: ['data', 'focus', 'permissions', 'mode',],
  data: () => ({
    uid: state.uid,
    momentData: null,
    selectedMomentId: '',
    isFold: false, //是否折叠
    expandContent: false,
  }),
  mounted() {
    this.initData();
    setTimeout(() => {
      lazyLoadInit();
    }, 10);
  },
  computed: {
  },
  methods: {
    objToStr: objToStr,
    visitUrl,
    copyString: (text) => {
      copyTextToClipboard(text)
        .then(() => {
          screenTopAlert('文号已复制到粘贴板');
        })
        .catch(sweetError);
    },
    handleClick(url, e) {
      if (e) {
        // 处理未阻止捕获的事件
        if (e.target.tagName === 'A') {
          e.preventDefault();
          this.visitUrl(e.target.href, true);
          return;
        }
      }
      // 检查是否为选中文本
      const selectedText = window.getSelection().toString();
      if (selectedText) {
        // 用户选中了文本，不执行后续操作
        return;
      }
      this.visitUrl(`${url}`, true);

    },
    initData() {
      const { data } = this;
      this.momentData = JSON.parse(JSON.stringify(data));
      this.showLoadMore();
    },
    //打开其他操作
    openOption(momentData, e) {
      if (!state.uid) {
        return window.RootApp.openLoginPanel();
      }
      const target = e.target;
      const init = $(target).attr('data-init');
      if (init === 'true') return;
      this.$refs.momentOption.open({ DOM: $(target), moment: momentData });
    },
    //投诉或举报
    complaint(mid) {
      this.$emit('complaint', mid);
    },
    handleMid(mid) {
      this.selectedMomentId = mid;
    },
    //显示是否加载更多
    showLoadMore() {
      this.$nextTick(() => {
        if (!this.$refs.momentDetails) {
          return;
        }
        const momentDetailsHeight = this.$refs.momentDetails.clientHeight;
        const momentDetailsContentHeight =
          this.$refs.momentDetailsContent.getBoundingClientRect().height;
        const overFold = momentDetailsContentHeight > momentDetailsHeight;
        this.isFold = this.$refs.momentDetailsContent.innerHTML
          ? overFold
          : false;
      });
    },
    openContent() {
      if (this.momentData.mode === 'rich') {
        this.visitRichContent();
      } else {
        this.expandContent = true;
      }
    },
    visitRichContent() {
      this.visitUrl(this.momentData.url, true);
    },
    closeContent() {
      this.expandContent = false;
    },
  },
};
</script>