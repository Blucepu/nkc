const data = NKC.methods.getDataById('data');
const app = new Vue({
  el: "#app",
  data: {
    t: data.t || '',
    searchType: data.searchType || 'rid',
    searchContent: data.searchContent || '',
  },
  methods: {
    search() {
      const {searchType, searchContent, t} = this;
      if(!searchContent) return sweetError('请输入搜索内容');
      window.location.href = `/e/log/resource?t=${t}&c=${searchType},${searchContent}`;
    }
  }
});
function initiate(rid, disabled){
  nkcAPI('/r/' + rid, 'PUT', {
    disabled: !!disabled
  }).then(()=>{
    sweetSuccess('执行成功');
  }).catch((err)=>{
    sweetError(err);
  });
}
function removeInfo(rid){
  return sweetQuestion(`确定要执行当前操作？`)
    .then(() => {
      return nkcAPI('/e/log/resource', 'PUT', {rid})
    })
    .then(() => {
      sweetSuccess('执行成功');
    })
    .catch((err) => {
      sweetError(err);
    });
}
//更新存储服务文件信息
function update(rid) {
  nkcAPI('/e/log/resource/updateInfo', 'PUT', {rid})
    .then(() => {
      sweetSuccess('更新成功!');
    })
}
Object.assign(window, {
  initiate,
  removeInfo,
  update
});

