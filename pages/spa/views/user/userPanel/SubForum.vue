<template lang="pug">
  .sub-forums.m-b-1
    .panel-header 订阅的领域
    .m-b-2
      .user-card-sub-div
        .home-topic-item-div
          a(
            v-for="f in forums"
            :href="`/f/${f.fid}`"
            :style="`background-color: ${f.color || '#808080'}`"
            :title="f.description"
            data-global-mouseover="showForumPanel"
            data-global-mouseout="hideForumPanel"
            :data-global-data="objToStr({fid: f.fid})"
          ).topic-item
            img(v-if="f.logo" :src="getUrl('forumLogo', f.logo)")
            span {{f.displayName}}
</template>
<style lang="less" scoped>
@import "../../../../publicModules/base";
.sub-forums {
  .panel-header {
    margin: -15px -15px 1rem -15px;
    border-bottom: 1px solid #f4f4f4;
    padding: 0 1rem;
  }
}
</style>
<script>
import {getUrl} from "../../../../lib/js/tools";
import {objToStr} from "../../../../lib/js/tools";
export default {
  props: ['forums'],
  data: () => ({

  }),
  methods: {
    objToStr: objToStr,
    getUrl: getUrl,
  }
}
</script>
