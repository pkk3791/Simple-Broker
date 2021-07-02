<template>
  <ion-content :scroll-events="true" @ionScroll="onScroll">
    <ion-refresher ref="refresher" slot="fixed" @ionRefresh="doRefresh">
      <ion-refresher-content></ion-refresher-content>
    </ion-refresher>
    <slot></slot>
    <template v-if="errors.length > 0">
      <div class="error" v-for="error in errors" :key="error.message">
        <div class="error-text">
          <ion-badge class="error-code" color="danger">{{error.code}}</ion-badge>
          <div>{{error.message}}</div>
        </div>
      </div>
    </template>
    <template v-else-if="isLoading && userList.length == 0">
      <people-item v-for="index in 8" :key="index" />
    </template>
    <div class="tweet-list" ref="lstTweets">
      <template v-if="userList.length > 0">
        <people-item :value="user" v-for="user in userList" :key="user.id" />
      </template>
      <p v-else-if="!isLoading" class="ion-text-center">
        Nothing found
      </p>
    </div>
    <ion-infinite-scroll threshold="100px" @ionInfinite="loadData($event)">
      <ion-infinite-scroll-content
        loadingSpinner="dots">
      </ion-infinite-scroll-content>
    </ion-infinite-scroll>
  </ion-content>
</template>
<style lang="css" scoped>
ion-content {
  overflow: auto;
}
.error {
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.error img {
  width: 150px;
}
.error .error-text {
  width: 100%;
  text-align: center;
  margin-top: 50px;
}
.error-code {
  font-size: 1rem;
  margin-top: 10px;
}
 
</style>

<script lang="ts">
/* eslint-disable @typescript-eslint/camelcase */
import { IonContent, IonRefresher, IonBadge, IonRefresherContent, IonInfiniteScroll, IonInfiniteScrollContent, toastController } from '@ionic/vue';
import PeopleItem from './item.vue'
import { ref, Ref, watch, computed, onMounted } from 'vue';
import { subSeconds, addSeconds } from 'date-fns'
import useTwitter from '@/hooks/twitter';
import { uniqBy, take } from 'ramda';
import Storage from '@/utils/storage'
export default {
  components: {
    IonContent, IonRefresher, IonBadge, IonRefresherContent,
    IonInfiniteScroll, IonInfiniteScrollContent, PeopleItem
  },
  name: 'People',
  props: {
    searchQuery: {
      type: String,
      default: null,
    },
    batchCount: {
      type: Number,
      default: 20,
    },
    type: {
      default: 'search',
      type: String
    }
  },
  setup(props, { emit }) {
    const userList = ref([] as any[])
    const isLoading = ref(true)
    const errors = ref([] as any[])
    const page = ref(1)
    const nextCursor = ref(null)
    const hasNextPage = ref(false)
    const { client } = useTwitter()
    
    let users: any = []

    const refreshResults = async () => {
      try {
        errors.value = []
        isLoading.value = true
        let tmp: any = null
        switch(props.type) {
          case 'search':    
            users = await client.get('users/search', {
              include_entities: true,
              q: props.searchQuery,
              count: props.batchCount,
            })
            hasNextPage.value = true
            page.value = 1
            break;
          case 'mutes':
            tmp = await client.get('mutes/users/list', {
              include_entities: true
            })
            users = tmp.users
            nextCursor.value = tmp.next_cursor_str
            hasNextPage.value = !!tmp.next_cursor_str
            break;
          case 'blocks':
            // eslint-disable-next-line no-case-declarations    
            tmp = await client.get('blocks/list', {
              include_entities: true
            })
            users = tmp.users
            nextCursor.value = tmp.next_cursor_str
            hasNextPage.value = !!tmp.next_cursor_str
            break;
        }
        userList.value = users
      } catch (e) {
        let error = e.toString()
        if (e.errors && e.errors.length) {
          error = e.errors[0].message
        }
        const toast = await toastController
          .create({
            message: error,
            duration: 5000,
            color: 'danger',
            position: 'top'
          })
        toast.present();
        errors.value = e.errors || []
      } finally {
        isLoading.value = false
      }
    }

    const loadMore = async () => {
      if (!hasNextPage.value) return
      try {
        let tmp: any = null
        switch(props.type) {
          case 'search':    
            users = await client.get('users/search', {
              count: props.batchCount,
              include_entities: true,
              q: props.searchQuery,
              page: page.value + 1
            })
            break;
          case 'mutes':
            tmp = await client.get('mutes/users', {
              include_entities: true,
              cursor: nextCursor.value
            })
            users = tmp.users
            nextCursor.value = tmp.next_cursor_str
            break;
          case 'blocks':
            // eslint-disable-next-line no-case-declarations    
            tmp = await client.get('blocks/list', {
              include_entities: true,
              cursor: nextCursor.value
            })
            users = tmp.users
            nextCursor.value = tmp.next_cursor_str
            break;
        }

        userList.value = uniqBy(t => t.id, userList.value.concat(users))
        if (users.length) {
          hasNextPage.value = props.type == 'search' || !!tmp.next_cursor_str
          page.value = page.value + 1
        } else {
          hasNextPage.value = false
        }
        
      } catch (e) {
        let error = e.toString()
        if (e.errors && e.errors.length) {
          error = e.errors[0].message
        }
        const toast = await toastController
          .create({
            message: error,
            duration: 5000,
            color: 'danger',
            position: 'top'
          })
        toast.present();
        console.log(e)
      } finally {
        // isLoadingMore.value = false
      }
    }

    watch(() => props.searchQuery, (v, o) => {
      userList.value = []
      refreshResults()
    })

    watch(() => props.type, (v, o) => {
      userList.value = []
      refreshResults()
    })

    onMounted(() => {
      refreshResults()
    })

    return {
      errors,
      userList,
      isLoading,
      onScroll(e) {
        emit('scroll', e)
      },
      async loadData(event: any) {
        await loadMore()
        event.target.complete()
      },
      async doRefresh(event: any) {
        await refreshResults()
        event.target.complete()
      }
    }
  }
}
</script>