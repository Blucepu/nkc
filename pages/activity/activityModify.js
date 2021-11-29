window.customForm = undefined;
if(NKC.modules.customForm) {
  window.customForm = new NKC.modules.customForm();
}
$(document).ready(function() {
  var options = JSON.parse($("#contionJSON").text());
  customForm.init(options);
})
window.ue = undefined;
$(document).ready(function(){
  // 初始化编辑器
  var replyCon = $("#replyxxx").text();
  window.ue = UE.getEditor("editor", NKC.configs.ueditor.activityConfigs);
  NKC.methods.ueditor.initDownloadEvent(window.ue);
  ue.ready(function() {
    ue.setContent(replyCon);
  });
})

//html解码
function htmlDecode(text){
  //1.首先动态创建一个容器标签元素，如DIV
  var temp = document.createElement("div");
  //2.然后将要转换的字符串设置为这个元素的innerHTML(ie，火狐，google都支持)
  temp.innerHTML = text;
  //3.最后返回这个元素的innerText(ie支持)或者textContent(火狐，google支持)，即得到经过HTML解码的字符串了。
  var output = temp.innerText || temp.textContent;
  temp = null;
  return output;
}

$('#inputFile').on('change', function() {
	var file = $('#inputFile')[0].files[0];
	if(file) {
		upLoadFile = file;
	}
	var reader = new FileReader();
	reader.onload = function() {
    var url = reader.result;
    insertToImage(url);
	};
  reader.readAsDataURL(upLoadFile);
  savePoster();
});


function insertToImage(url) {
  var imgDom = '<img id="poster" style="width:100%;" srcs="" src="'+url+'">';
  $("#exampleImg").html(imgDom);
}

// 时间校验
function timeStampCheck(stampId, stampErrDomId){
  clearErrTips(stampErrDomId);
  var stampDom = $(stampId).val();
  var errInfo = "";
  if(!stampDom) {
    errInfo += "请选择时间";
    errInfoTips(errInfo, stampErrDomId);
    return false;
  };
  var nowStamp = new Date().getTime(); // 当前时间戳
  var aimStamp = new Date(stampDom).getTime(); // 目标时间戳
  if(parseInt(nowStamp) > parseInt(aimStamp)){
    errInfo += "不得早于当前时间";
    errInfoTips(errInfo, stampErrDomId);
    return false;
  }
  return true;
}

// 截止时间检查
function deadlineCheck(start, end, endDom) {
  var stratTime = new Date(start).getTime();
  var endTime = new Date(end).getTime();
  if(parseInt(endTime) <= parseInt(stratTime)){
    errInfoTips("结束时间不得早于或等于开始时间",endDom);
    return false;
  }
  return true;
}

function savePoster() {
  var formData = new FormData();
  formData.append('file', upLoadFile);
	$.ajax({
		url: '/poster',
		method: 'POST',
		cache: false,
		data: formData,
		headers: {
			'FROM': 'nkcAPI'
		},
		dataType: 'json',
		contentType: false,
		processData: false,
	})
		.done(function(data) {
      var imgDom = '<img style="width:100%" id="poster" srcs="'+data.picname+'" src="/poster/'+data.picname+'">';
      $("#exampleImg").html(imgDom);
			screenTopAlert('海报上传成功');
		})
		.fail(function(data) {
			screenTopWarning(JSON.parse(data.responseText).error);
		})
}

// 
function submitredit(acid){
    // 检查标题
    var titleDom = $('#activityTitle').val().trim();
    clearErrTips("#titleErr");
    if(!titleDom || titleDom.length == 0){
      errInfoTips("请填写活动标题","#titleErr");
      return;
    };
  
    // 检查时间
    var enrollStartTime = $("#enrollStartTime").val(); // 报名开始时间
    var enrollEndTime = $("#enrollEndTime").val(); // 报名结束时间
    var holdStartTime = $("#holdStartTime").val(); // 活动开始时间
    var holdEndTime = $("#holdEndTime").val(); // 活动结束时间
    // if(!timeStampCheck("#enrollStartTime","#enrollStartTimeErr")){
    //   return;
    // }
    if(!timeStampCheck("#enrollEndTime","#enrollEndTimeErr")){
      return;
    }
    if(!deadlineCheck(enrollStartTime,enrollEndTime,"#enrollEndTimeErr")){
      return;
    }
    // if(!timeStampCheck("#holdStartTime","#holdStartTimeErr")){
    //   return;
    // }
    if(!timeStampCheck("#holdEndTime","#holdEndTimeErr")){
      return;
    }
    if(!deadlineCheck(holdStartTime, holdEndTime ,"#holdEndTimeErr")){
      return;
    }
  
    // 检查地址
    var address = $('#address').val();
    clearErrTips('#addressErr');
    if(!address) return errInfoTips("请填写详细地址", "#addressErr");
  
    // 检查海报
    clearErrTips("#posterErr");
    var posterSrc = $("#poster").attr("srcs");
    if(posterSrc.length == 0){
      return errInfoTips("请上传一张海报","#posterErr");
    }
  
    // 检查主办方
    var sponsor = $("#sponsor").val();
    clearErrTips("#sponsorErr");
    if(!sponsor.length) return errInfoTips("请填写主办方名称", "#sponsorErr");
  
    // 联系电话
    var contactNum = $("#contactNum").val().trim();
    clearErrTips("#contactNumErr");
    if(contactNum == ""){
      return errInfoTips("请填写联系电话", "#contactNumErr")
    }
  
    // 检查人数
    var activityPartNum = $("#activityPartNum").val();
    clearErrTips("#activityPartNumErr");
    var reg = /^\+?[1-9][0-9]*$/;
    if(activityPartNum != "0" && !reg.test(activityPartNum)){
      return errInfoTips("请填写正确数字","#activityPartNumErr")
    }
  
    // 检查报名人数条件
    var continueTofull = $("#continueTofull").is(":checked");
    // 获取报名条件
    var conditions = customForm.outputJSON();
    for(var c in conditions) {
      if(conditions[c].infoName.length === 0) {
        return errInfoTips("表单名称不可为空！")
      }
      if(conditions[c].errorInfo && conditions[c].errorInfo.length > 0) {
        return errInfoTips(conditions[c].errorInfo)
      }
    }
    // $("#conditions").find("input").each(function(){
    //   if($(this).is(":checked") == true){
    //     conditions.push($(this).attr("id"))
    //   }
    // })
  
    // 检查活动详情
    var description = ue.getContent();
    description = common.URLifyHTML(description);
    
    // 是否通知
    var isnotice = $("#isnotice").is(":checked");
    var noticeContent = "";
    if(isnotice)
    {
      noticeContent = $("#noticeContent").val();
    }
  
    var post = {
      acid: acid,
      activityTitle: titleDom,
      limitNum: activityPartNum,
      enrollStartTime: new Date(enrollStartTime).toJSON(),
      enrollEndTime: new Date(enrollEndTime).toJSON(),
      holdStartTime: new Date(holdStartTime).toJSON(),
      holdEndTime: new Date(holdEndTime).toJSON(),
      address: address,
      sponsor: sponsor,
      contactNum: contactNum,
      posterId: posterSrc,
      description: description,
      continueTofull: continueTofull,
      isnotice: isnotice,
      noticeContent: noticeContent,
      conditions: conditions
    }
  
    nkcAPI('/activity/modify/'+acid, "POST" ,{post:post})
    .then(function(data) {    
      screenTopAlert("修改成功！");
      setTimeout(function() {
        // window.location.href = "/activity/list";
        openToNewLocation("/activity/single/" + acid);
      }, 1500);
    })
    .catch(function(data){
      screenTopWarning(data.error)
    })
}

// 取消报名
function cancelApply(acid,uid) {
  if(confirm('确认放弃报名？') === false) return;
  var url = '/activity/modify/'+acid;
  var method = "DELETE";
  var alertInfo = "已取消报名";
  var post = {
    uid:uid
  }
  nkcAPI(url, method, post)
    .then(function(){
      screenTopAlert(alertInfo);
      setTimeout(function(){
        window.location.reload();
      }, 1000);
    })
    .catch(function(data){
      screenTopWarning(data.error)
    })
}

// 关闭活动
function closeActivity(acid) {
  if(confirm('确认关闭活动？') === false) return;
  var url = '/activity/modify/'+acid;
  var method = "DELETE";
  var alertInfo = "已关闭活动";
  nkcAPI(url, method, {})
    .then(function(){
      screenTopAlert(alertInfo);
      setTimeout(function(){
        window.location.reload();
      }, 1000);
    })
    .catch(function(data){
      screenTopWarning(data.error)
    })
}

// 发送通知
function sendMessage(acid) {
  var noticeContent = $("#noticeContent").text();
  var post = {
    noticeContent: noticeContent
  }
  var url = '/activity/modify/' + acid;
  var method = "PUT";
  var alertInfo = "通知已发给全体报名者"
  nkcAPI(url, method, post)
    .then(function(){
      screenTopAlert(alertInfo);
    })
    .catch(function(data){
      screenTopWarning(data.error)
    })
}

Object.assign(window, {
  htmlDecode,
  insertToImage,
  timeStampCheck,
  deadlineCheck,
  savePoster,
  submitredit,
  cancelApply,
  closeActivity,
  sendMessage,
  ue
});