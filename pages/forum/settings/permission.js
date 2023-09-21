import { objToStr } from '../../lib/js/tools';
import { getDataById } from '../../lib/js/dataConversion';
import Vue from 'vue';
import {
  sweetSuccess,
  sweetQuestion,
  sweetError,
} from '../../lib/js/sweetAlert';
import { nkcAPI } from '../../lib/js/netAPI';

const data = getDataById('data');
const selectUser = new NKC.modules.SelectUser();

const app = new Vue({
  el: '#app',
  data: {
    forum: data.forum,
    roles: data.roles,
    grades: data.grades,
    permission: data.permission,
    operations: data.operation,
    libraryClosed: data.libraryClosed,
    saving: false,
    moderators: data.moderators,
    articlePanelStyleTypes: data.articlePanelStyleTypes,
    articlePanelCoverTypes: data.articlePanelCoverTypes,
  },
  computed: {
    users() {
      const { moderators } = this;
      const users = {};
      for (const u of moderators) {
        users[u.uid] = u;
      }
      return users;
    },
    operationsId: function () {
      var arr = [];
      for (var i = 0; i < this.operations.length; i++) {
        arr.push(this.operations[i].name);
      }
      return arr;
    },
  },
  mounted() {
    this.initUserPanel();
  },
  updated() {
    this.initUserPanel();
  },
  methods: {
    objToStr: objToStr,
    initUserPanel() {
      /*setTimeout(() => {
        window.floatUserPanel.initPanel();
      }, 500)*/
    },
    selectAll: function (p) {
      if (p.operationsId.length === this.operationsId.length) {
        p.operationsId = [];
      } else {
        p.operationsId = this.operationsId;
      }
    },
    removeModerator(index) {
      this.forum.moderators.splice(index, 1);
    },
    addModerator() {
      const self = this;
      selectUser.open((data) => {
        const { users, usersId } = data;
        self.moderators = self.moderators.concat(users);
        for (const uid of usersId) {
          if (!self.forum.moderators.includes(uid)) {
            self.forum.moderators.push(uid);
          }
        }
      });
    },
    libraryOperation(fid, type) {
      const self = this;
      const typeName = {
        create: '开设',
        open: '开启',
        close: '关闭',
      }[type];
      sweetQuestion(`确定要${typeName}文库？`)
        .then(() => {
          return nkcAPI('/f/' + fid + '/library', 'POST', {
            type: type,
          });
        })
        .then(function (data) {
          const { libraryClosed, library } = data;
          self.forum.lid = library._id;
          self.libraryClosed = libraryClosed;
          sweetSuccess('执行成功');
        })
        .catch(function (data) {
          sweetError(data);
        });
    },
    save() {
      const { forum } = this;
      this.saving = true;
      const self = this;
      return nkcAPI(`/f/${forum.fid}/settings/permission`, 'PUT', {
        forum,
      })
        .then(() => {
          sweetSuccess('保存成功');
          self.saving = false;
        })
        .catch((err) => {
          self.saving = false;
          sweetError(err);
        });
    },
  },
});

Object.assign(window, {
  selectUser,
  app,
});
