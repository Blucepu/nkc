import { RNUpdateLocalUser } from './lib/js/reactNative';
import { getState } from './lib/js/state';
const { isApp, fileDomain } = getState();
function submit(id) {
  var obj = {
    description: $('#description').val(),
    postSign: $('#postSign').val(),
  };

  nkcAPI('/u/' + id + '/settings/info', 'PUT', obj)
    .then(function (data) {
      screenTopAlert('修改成功');
      emitEventToUpdateLocalUser(data);
    })
    .catch(function (data) {
      screenTopWarning(data.error);
    });
}

function changeUsername() {
  $('#app').toggle();
}

function getFocus(a) {
  $(a).css('border-color', '#f88');
  $(a).focus();
  $(a).blur(function () {
    $(a).css('border-color', '');
  });
}
window.selectImage = undefined;
$(function () {
  if (NKC.methods.selectImage) {
    window.selectImage = new NKC.methods.selectImage();
  }
});

function selectAvatar() {
  selectImage.show(
    function (data) {
      var user = NKC.methods.getDataById('data').user;
      var formData = new FormData();
      Promise.resolve()
        .then(function () {
          formData.append('file', data, Date.now() + '.png');
          let url = '/avatar/' + user.uid;
          /*if(fileDomain) {
          url = fileDomain + url;
        }*/
          return uploadFilePromise(
            url,
            formData,
            function (e, percentage) {
              $('.upload-info').text('上传中...' + percentage);
              if (e.total === e.loaded) {
                $('.upload-info').text('上传完成！');
                setTimeout(function () {
                  $('.upload-info').text('');
                }, 2000);
              }
            },
            'POST',
          );
        })
        .then(function (data) {
          $('#userAvatar').attr(
            'src',
            NKC.methods.tools.getUrl('userAvatar', data.user.avatar) +
              '&time=' +
              Date.now(),
          );
          emitEventToUpdateLocalUser(data);
          selectImage.close();
        })
        .catch(function (data) {
          screenTopWarning(data);
        });
    },
    {
      aspectRatio: 1,
    },
  );
}

function selectBanner() {
  selectImage.show(
    function (data) {
      var user = NKC.methods.getDataById('data').user;
      var formData = new FormData();
      formData.append('file', data, Date.now() + '.png');
      let url = '/banner/' + user.uid;
      /*if(fileDomain) {
      url = fileDomain + url;
    }*/
      uploadFilePromise(
        url,
        formData,
        function (e, percentage) {
          $('.upload-info-banner').text('上传中...' + percentage);
          if (e.total === e.loaded) {
            $('.upload-info-banner').text('上传完成！');
            setTimeout(function () {
              $('.upload-ifo-bnanner').text('');
            }, 2000);
          }
        },
        'POST',
      )
        .then(function (data) {
          $('#userBanner').attr('src', data.data.url);
          emitEventToUpdateLocalUser(data);
          selectImage.close();
        })
        .catch(function (data) {
          screenTopWarning(data);
        });
    },
    {
      aspectRatio: 2,
    },
  );
}
function selectBackBanner() {
  selectImage.show(
    function (data) {
      var user = NKC.methods.getDataById('data').user;
      var formData = new FormData();
      formData.append('file', data, Date.now() + '.png');
      uploadFilePromise(
        '/banner/' + user.uid + '/homeBanner',
        formData,
        function (e, percentage) {
          $('.upload-info-home-banner').text('上传中...' + percentage);
          if (e.total === e.loaded) {
            $('.upload-info-home-banner').text('上传完成！');
            setTimeout(function () {
              $('.upload-info-home-banner').text('');
            }, 2000);
          }
        },
        'POST',
      )
        .then(function (data) {
          $('#userBackBanner').attr('src', data.data.url);
          emitEventToUpdateLocalUser(data);
          selectImage.close();
        })
        .catch(function (data) {
          screenTopWarning(data);
        });
    },
    {
      aspectRatio: 7,
    },
  );
}

var data = NKC.methods.getDataById('data');
var app = new Vue({
  el: '#app',
  data: {
    usernameSettings: data.usernameSettings,
    user: data.user,
    modifyUsernameCount: data.modifyUsernameCount,
    newUsername: '',
    usernameScore: data.usernameScore,
  },
  computed: {
    needScore: function () {
      if (this.usernameSettings.free) {
        return 0;
      }
      if (this.modifyUsernameCount < this.usernameSettings.freeCount) {
        return 0;
      }
      var reduce =
        this.modifyUsernameCount + 1 - this.usernameSettings.freeCount;
      if (
        reduce * this.usernameSettings.onceKcb <
        this.usernameSettings.maxKcb
      ) {
        return reduce * this.usernameSettings.onceKcb;
      } else {
        return this.usernameSettings.maxKcb;
      }
    },
  },
  methods: {
    saveNewUsername: function () {
      return sweetQuestion(`确定要将用户名修改为“${this.newUsername}”吗？`)
        .then(() => {
          return nkcAPI('/u/' + this.user.uid + '/settings/username', 'PUT', {
            newUsername: this.newUsername,
          });
        })
        .then(function (data) {
          sweetSuccess('修改成功');
          emitEventToUpdateLocalUser(data);
        })
        .catch(function (data) {
          sweetError(data);
        });
    },
  },
});

function emitEventToUpdateLocalUser() {
  if (isApp) {
    RNUpdateLocalUser();
  }
}

Object.assign(window, {
  submit,
  changeUsername,
  getFocus,
  selectAvatar,
  selectBanner,
  selectBackBanner,
  app,
  emitEventToUpdateLocalUser,
});
