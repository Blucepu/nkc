<template lang="pug">
  div.article-common.col-xs-12.col-md-9.m-b-1
    .user-post-list
      paging(ref="paging" :pages="pageButtons" @click-button="clickButton")
      blank(v-if="(!posts || posts.length === 0) && !loading")
      .user-list-warning(v-if="loading") 加载中~
      post-list(ref="postList" :posts="posts" :permissions="permissions" type="creation")
      paging(ref="paging" :pages="pageButtons" @click-button="clickButton")
</template>
<script>
import PostList from "../../../../lib/vue/post/PostList";
import Paging from "../../../../lib/vue/Paging";
import Blank from "../../../components/Blank";
import {routesName} from "../../../routes/creation";
import {getState} from "../../../../lib/js/state";
import {nkcAPI} from "../../../../lib/js/netAPI";
export default {
  components:{
    'post-list': PostList,
    'blank': Blank,
    'paging': Paging
  },
  data: () => ({
    postRouteName: routesName.creationCommunityPost,
    threadRouteName: routesName.creationCommunityThread,
    posts: [],
    paging: {},
    loading: true,
    uid: null,
    routeName: null,
    managementBtn: false,
    permissions: {},
    checkboxPosts: [],
    t: '',
  }),
  computed: {
    pageButtons() {
      return this.paging && this.paging.buttonValue? this.paging.buttonValue: [];
    },
  },
  watch: {
    '$route.name': function (newVal, oldVal){
      if(newVal) this.initData();
    }
  },
  mounted() {
    this.initData();
  },
  methods: {
    initData() {
      const {params, path, name} = this.$route;
      const {uid: stateUid} = getState();
      const index = name.indexOf('creationCommunityThread');
      if(index === -1) {
        this.routeName = 'post';
      } else {
        this.routeName = 'thread';
      }
      const {uid} = params;
      this.t = name;
      this.uid = uid || stateUid;
      this.getPostList(0);
    },
    //获取用户卡片信息
    getPostList(page) {
      this.loading = true;
      const {uid, routeName} = this;
      const self= this;
      let url = `/u/${uid}/profile/${routeName}Data`;
      if(page) {
        const index = url .indexOf('?');
        if(index === -1) {
          url = url + `?page=${page}`;
        } else {
          url = url + `&page=${page}`;
        }
      }
      nkcAPI(url, "GET")
        .then(res => {
          self.paging = res.paging;
          self.posts = res.posts;
          self.permissions = res.permissions;
        })
        .catch(err => {
          sweetError(err);
        })
      self.loading = false;
    },
    //刷新当前页面
    refreshPage() {
      const {page} = this.paging;
      this.getPostList(page);
    },
    //点击分页
    clickButton(num) {
      this.getPostList(num);
    },
    //跳转到指定路由
    toRoute(name) {
      this.t = name;
      this.$router.push({
        name
      });
    },
  }
}
</script>
<style lang="less" scoped>
.article-common{
  padding: 0!important;
}
</style>
