import {getPostEditorConfigs} from '../lib/js/editor'
import Editor from '../lib/vue/Editor'
const container = $('#editorContainer');
if(container.length > 0) {
  const postEditor = new Vue({
    el: '#editorContainer',
    data: {
      editorPlugs: {
        resourceSelector: true,
        draftSelector: true,
        stickerSelector: true,
        xsfSelector: true,
        mathJaxSelector: true,
      }
    },
    mounted() {
    },
    computed: {
      editorConfigs() {
        return getPostEditorConfigs();
      },
    },
    components: {
      'editor': Editor,
    },
    methods: {
      removeEvent() {
        this.$refs.postEditor.removeNoticeEvent();
      },
      getRef() {
        return this.$refs.postEditor;
      }
    },
  });
  window.ue = postEditor.getRef();
}

// var ue = UE.getEditor('container', NKC.configs.ueditor.postConfigs);
// NKC.methods.ueditor.initDownloadEvent(ue);
// window.ue = ue;

/*
var ue = UE.getEditor('container', {
  toolbars: [
    [
      'fullscreen', 'undo', 'redo', '|', 'bold', 'italic', 'underline', 'strikethrough', '|', 'blockquote', 'horizontal', 'superscript', 'subscript', '|', 'fontsize', 'forecolor', 'backcolor',  '|', 'indent', '|','link', 'unlink', '|', 'emotion', 'inserttable', '|' ,'removeformat', 'pasteplain', '|', 'justifyleft', 'justifycenter', 'justifyright','|', 'insertcode'
    ]
  ],
  maximumWords: 100000, // 最大字符数
  initialFrameHeight: 200, // 编辑器高度
  autoHeightEnabled:false, // 编辑器是否随着行数增加而自动长高
  scaleEnabled: true, // 是否允许拉长
  topOffset: 47, // toolbar工具栏在滚动时的固定位置
  //- imagePopup: false, // 是否开启图片调整浮层
  //- enableContextMenu: false, // 是否开启右键菜单
  enableAutoSave: false, // 是否启动自动保存
  elementPathEnabled: false, // 是否显示元素路径
  imageScaleEnabled: false, // 启用图片拉伸缩放
  zIndex : 499
});*/
