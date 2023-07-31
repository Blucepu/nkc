let app = new Vue({
  el: '#app',
  data: {
    category: {
      rolesId: [],
      name: '',
      description: '',
      volume: 'A',
      passScore: '',
      from: [],
      disabled: false,
      type: 'secret',
    },
    roles: [],
    from: [],
    showForums: false,
  },
  computed: {
    f: function () {
      let arr = [];
      let volume = this.category.volume;
      for (let i = 0; i < this.from.length; i++) {
        let fr = this.from[i];
        if (fr['count' + volume] > 0) {
          arr.push(fr);
        }
      }
      return arr;
    },
    questionsCount: function () {
      let count = 0;
      for (let i = 0; i < this.category.from.length; i++) {
        count += this.category.from[i].count || 0;
      }
      return count;
    },
  },
  mounted: function () {
    let data = document.getElementById('data');
    data = data.innerHTML;
    data = JSON.parse(data);
    this.roles = data.roles;
    this.from = data.from;
    if (data.category) {
      this.category = data.category;
    }
  },
  methods: {
    addForum: function (from) {
      let have = false;
      for (let i = 0; i < this.category.from.length; i++) {
        let f = this.category.from[i];
        if (
          from.type === f.type &&
          (from.type === 'pub' || from.fid === f.fid)
        ) {
          have = true;
        }
      }
      if (!have) {
        this.category.from.push(from);
      }
    },
    removeForum: function (forum) {
      console.log(this.category, 'this.category');
      let index = this.category.from.indexOf(forum);
      this.category.from.splice(index, 1);
    },
    save: function () {
      let category = this.category;
      if (category.name === '') {
        return screenTopWarning('请输入考卷名称');
      }
      if (category.description === '') {
        return screenTopWarning('请输入考卷介绍');
      }
      if (['A', 'B'].indexOf(category.volume) === -1) {
        return screenTopWarning('请选择考卷难度');
      }

      if (category.from.length === 0) {
        return screenTopWarning('请选择试题来源');
      }
      for (let i = 0; i < category.from.length; i++) {
        let f = category.from[i];
        let name = f.forum ? f.forum.displayName : '公共题库';
        if (f.count === 0 || f.count === '') {
          return screenTopWarning(name + '的抽取数目不能小于1');
        }
        let volumeName = {
          A: '基础题数目',
          B: '专业题数目',
        }[category.volume];
        if (f.count > f['count' + category.volume]) {
          return screenTopWarning(name + '的' + volumeName + '不足');
        }
        f.fid = f.forum ? f.forum.fid : '';
        delete f.forum;
      }

      if (category.passScore < 1 || category.passScore > this.questionsCount) {
        return screenTopWarning('及格分数不能大于试题总数且不能小于1');
      }
      if (category.time <= 0) {
        return screenTopWarning('答题时间必须大于0分钟');
      }
      category.disabled = ['true', true].indexOf(category.disabled) !== -1;
      let method = 'POST',
        url = '/exam/categories';
      if (category._id) {
        method = 'PUT';
        url = '/exam/category/' + category._id;
      }
      nkcAPI(url, method, { category: category })
        .then(function () {
          // window.location.href='/exam';
          screenTopAlert('保存成功');
        })
        .catch(function (data) {
          screenTopWarning(data);
        });
    },
  },
});
