<template>
  <ion-page>
    <main-tabs selectedTab="search">
      <ion-header translucent>
        <ion-toolbar>
          <ion-title>Search</ion-title>
        </ion-toolbar>
        <ion-toolbar>
          <ion-searchbar :value="query" @ionChange="onQueryChanged" mode="ios"></ion-searchbar>
        </ion-toolbar>
        <ion-segment class="type-segment" @ionChange="onResultTypeChanged($event)" :value="resultType">
          <ion-segment-button value="popular">
            <ion-label>Top</ion-label>
          </ion-segment-button>
          <ion-segment-button value="recent">
            <ion-label>Recent</ion-label>
          </ion-segment-button>
          <ion-segment-button value="people">
            <ion-label>People</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-header>
      <ion-content fullscreen>
        <template v-if="!!query">
          <people v-if="resultType == 'people'" :searchQuery="query" />
          <timeline v-else :isSearch="true" :searchResultType="resultType" :searchQuery="query"></timeline>
        </template>
      </ion-content>
    </main-tabs>
  </ion-page>
</template>
<style scoped>
.type-segment {
  border-radius: 0;
}
</style>
<script lang="ts">
import { IonPage, IonHeader, IonLabel, IonSegment, IonSegmentButton, IonToolbar, IonTitle, IonSearchbar, IonContent } from '@ionic/vue';
import { useRoute, useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import Timeline from '@/components/timeline/index.vue'
import MainTabs from '@/components/main-tabs/index.vue'
import People from '@/components/people/index.vue'
import useTwitter from '@/hooks/twitter';
export default  {
  name: 'Search',
  components: { People, IonLabel, IonHeader, IonSegment, IonSegmentButton, IonToolbar, IonTitle, IonContent, IonPage, MainTabs, IonSearchbar, Timeline },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const routeName = computed(() => route.name || '')
    const query = computed(() => route.params.query || '')
    const resultType = computed(() => route.query.type || 'recent')

    return {
      query,
      resultType,
      onResultTypeChanged(e) {
        if (routeName.value != 'search') return
        router.push(
          String(query.value).replace(/#|@/g, '') == ''
            ? {
                name: 'search',
                query: e.detail.value == 'popular' ? {} : {
                  type: e.detail.value
                }
              }
            : {
                name: 'search',
                params: {
                  query: query.value
                },
                query: e.detail.value == 'popular' ? {} : {
                  type: e.detail.value
                }
              }
        )
      },
      onQueryChanged: (evt: CustomEvent) => {
        if (routeName.value != 'search') return
        const value = String(evt.detail.value || '').trim()
        router.push(
          value.replace(/#|@/g, '') == ''
            ? {
                name: 'search',
                query: resultType.value == 'popular' ? {} : {
                  type: resultType.value
                }
              }
            : {
                name: 'search',
                params: {
                  query: value
                },
                query: resultType.value == 'popular' ? {} : {
                  type: resultType.value
                }
              }
        )
      }
    }
  }
}
</script>