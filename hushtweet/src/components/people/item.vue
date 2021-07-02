<template>
  <div class="item animate__animated animate__faster animate__slideInUp">
    <div class="item-header">
      <tweet-avatar :isLarge="true" :isLoading="value == null" :user="value" />
      <div class="item-names">
        <div>
          <ion-skeleton-text v-if="value == null"></ion-skeleton-text>
          <template v-else>{{value.name}}</template>
        </div>
        <div class="item-screenname">
          <ion-skeleton-text v-if="value == null"></ion-skeleton-text>
          <template v-else>@{{value.screen_name}}</template>
        </div>
      </div>
    </div>
    <div class="item-description">
      <ion-skeleton-text v-if="value == null"></ion-skeleton-text>
      <template v-else>@{{value.description}}</template>
    </div>
  </div>
</template>
<style scoped>
.item {
  padding: 1rem;
}
.item:not(:last-child) {
  border-bottom: solid 1px #eee;
}
.item-header {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.item-description {
  font-size: 1rem;
  margin: 1rem 0 0;
}
.item-names {
  display: flex;
  width: 100%;
  flex-direction: column;
}
.item-names div {
  width: 100%;
}
.item-screenname {
  color: #999;
}
</style>
<script lang="ts">
import { IonSkeletonText } from '@ionic/vue';
import TweetAvatar from '@/components/tweet/avatar.vue'
export default {
  components: {
    TweetAvatar,
    IonSkeletonText
  },
  props: {
    value: {
      type: Object,
      default: null
    }
  }
}
</script>