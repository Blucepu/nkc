<template lang="pug">
  .sub-fans(v-if="sidUsers && sidUsers.length !== 0")
    .panel-header {{title}}
    .m-b-2
      .user-card-sub-div
        .home-topic-item-div
          .user-card-panel
            .user-card-user-list
              .side-user(
                v-for="(u, index) in sidUsers"
                data-global-mouseover="showUserPanel"
                data-global-mouseout="hideUserPanel"
                :data-global-data="objToStr({uid: u.uid})"
                v-if="index <= 7"
              )
                a(:href="`/u/${u.uid}`" target="_blank")
                  img(
                    :src="getUrl('userAvatar', u.avatar)"
                    )
            .text-center
              a(:href="`/u/${targetUser.uid}/profile/${type}`" v-if="sidUsers.length > 8").user-card-user-link 查看更多
</template>
<style lang="less">
.sub-fans {
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
  props: ['targetUser', 'sidUsers', 'title', 'type'],
  data: () => ({
  }),
  methods: {
    getUrl: getUrl,
    objToStr: objToStr,
  }
}
</script>
