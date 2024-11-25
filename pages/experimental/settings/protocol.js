import { getDataById } from '../../lib/js/dataConversion';
import {getExperimentalProtocolEditorConfigs} from '../../lib/js/editor'
import Editor from '../../lib/vue/Editor'
const  protocolEditor = $('#protocolEditorContainer');
if(protocolEditor.length > 0) {
  const editorContainer = new Vue({
    el: '#protocolEditorContainer',
    data: {
      editorPlugs: {
        resourceSelector: true,
        draftSelector: true,
        stickerSelector: true,
        xsfSelector: true,
        mathJaxSelector: true,
      },
      protocol: null,
    },
    created() {
      if (getDataById('protocolHide')) {
        this.protocol = getDataById('protocolHide');
      }
    },
    mounted() {
    },
    components: {
      'editor': Editor,
    },
    computed: {
      editorConfigs() {
        return getExperimentalProtocolEditorConfigs();
      },
    },
    methods: {
      getRef() {
        return this.$refs.protocolEditor;
      },
      setContent() {
        // if($("#protocolHide").length > 0) {
        //   var protocolHide = $("#protocolHide").text();
        //   this.$refs.protocolEditor.setContent(protocolHide);
        // }
        if (this.protocol) {
          this.$refs.protocolEditor.setContent(this.protocol.protocolContent);
        }
      },
      removeEvent() {
        this.$refs.protocolEditor.removeNoticeEvent();
      },
    }
  });
  var ue = editorContainer.getRef();
}
// $("document").ready(function() {
//   if($("#protocolHide").length > 0) {
//     var protocolHide = $("#protocolHide").text();
//     ue.setContent(protocolHide);
//   }
// })

function test() {
  var content = document.getElementById("text-elem").innerHTML;
  content = common.URLifyHTML(content);
}

// 新增协议
function addProtocol() {
  try{
    var post = getProtocol();
  }catch(err) {
    return screenTopWarning(err)
  }
  document.getElementById("updateAdd").disabled = true;
  nkcAPI("/e/settings/protocol", "POST", post)
  .then(function(data) {
    ue.removeNoticeEvent();
    screenTopAlert("保存成功");
    openToNewLocation('/e/settings/protocol/' + data.protocolTypeId);
  })
  .catch(function(data) {
    screenTopWarning(data || data.error);
    document.getElementById("updateAdd").disabled = false;
  })
}

// 跳转到协议修改页
function turnProtocolUpdate(id) {
  openToNewLocation("/e/settings/protocol/"+id+"?visitType=update");
  // window.location.href = "/e/settings/protocol/"+id+"?visitType=update";
}

// 修改协议
function updateProtocol(id) {
  try{
    var post = getProtocol();
  }catch(err) {
    return screenTopWarning(err)
  }
  post.id = id;
  document.getElementById("updateEdit").disabled = true;
  nkcAPI("/e/settings/protocol/"+id, "PUT", post)
  .then(function(data) {
    ue.removeNoticeEvent();
    screenTopAlert("保存成功");
    openToNewLocation('/e/settings/protocol/' + data.protocolTypeId);
    // window.location.href = '/e/settings/protocol/' + data.protocolTypeId;
  })
  .catch(function(data) {
    screenTopWarning(data || data.error);
    document.getElementById("updateEdit").disabled = false;
  })
}

// 删除当前协议
function deleteProtocol(id) {
  var post = {id: id};
  var sureDel = confirm("是否删除当前协议？");
  if(sureDel) {
    nkcAPI("/e/settings/protocol/"+id, "POST", post)
    .then(function(data) {
      screenTopAlert("该协议已删除");
      openToNewLocation("/e/settings/protocol");
      // window.location.href = "/e/settings/protocol"
    })
    .catch(function(data) {
      screenTopWarning(data || data.error);
    })
  }
}

// 获取当前协议
function getProtocol() {
  var protocolName = $("#protocolName").val();
  if(!protocolName) throw("请填写协议名称");
  var protocolTypeId = $("#protocolTypeId").val();
  if(!protocolTypeId) throw("请使用小写英文填写协议类型ID");
  var existEn = /.*[\u4e00-\u9fa5]+.*$/.test(protocolTypeId);
  if(existEn) throw("协议类型ID不可包含中文字符");
  protocolTypeId = protocolTypeId.toLocaleLowerCase();
  var protocolTypeName = $("#protocolTypeName").val();
  if(!protocolTypeName) throw("请使用中文填写协议类型名称");
  var protocolContent = ue.getContent();
  protocolContent = common.URLifyHTML(protocolContent);
  var post = {
    protocolName: protocolName,
    protocolTypeId: protocolTypeId,
    protocolTypeName: protocolTypeName,
    protocolContent: protocolContent
  }
  return post;
}

Object.assign(window, {
  test,
  addProtocol,
  turnProtocolUpdate,
  updateProtocol,
  deleteProtocol,
  getProtocol,
});
