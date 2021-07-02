<template lang="html">
  <ion-page style="background: #fff">
    <ion-header class="profile-header" :class="{ 'profile-header--scrolling': showHeader && lastScrollPosition > 60, 'profile-header--hidden': !showHeader }">
      <div
        class="profile-background"
        :style="profile && showHeader && lastScrollPosition <= 60 ? `background-image: url(${profile.profile_banner_url});` : ''"></div>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button style="display: block; background: rgba(255, 255, 255, 0.5); border-radius: 50%; width: 32px" @click="$router.back()">
            <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" style="width: 28px; height: 28px; color: #000">
              <polyline points="244 400 100 256 244 112" style="fill:none;stroke:currentColor;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px"></polyline>
              <line x1="120" y1="256" x2="412" y2="256" style="fill:none;stroke:currentColor;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px"></line>
            </svg>
          </ion-button>
        </ion-buttons>
        <ion-title>
          <ion-skeleton-text v-if="isLoading" animated></ion-skeleton-text>
          <template v-else>{{profile.name}}</template>
        </ion-title>
        <ion-buttons v-if="!isLoading && !isAuthenticatedUser" slot="end" style="margin-right: 20px">
          <ion-button class="follow-button" color="primary" fill="solid">
            <template v-if="profile.following">Unfollow</template>
            <template v-else>Follow</template>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <div class="profile-details">
        <ion-avatar class="profile-details-avatar">
          <ion-skeleton-text v-if="isLoading" animated circle="circle"></ion-skeleton-text>
          <img v-else :src="profile.profile_image_url_https" />
        </ion-avatar>
        <div class="profile-details-name">
          <ion-skeleton-text v-if="isLoading" animated></ion-skeleton-text>
          <template v-else>
            {{profile.name}}
            <svg class="profile-details-verified" v-if="profile.verified" viewBox="0 0 24 24">
              <g>
                <path fill="#1DA1F2" d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"></path>
              </g>
            </svg>
          </template>
        </div>
        <div class="profile-details-screen_name">
          <ion-skeleton-text v-if="isLoading" animated></ion-skeleton-text>
          <template v-else>@{{profile.screen_name}}</template>
        </div>
        <div v-if="isLoading || !!profile.description" class="profile-details-description">
          <ion-skeleton-text v-if="isLoading" animated></ion-skeleton-text>
          <template v-else>{{profile.description}}</template>
        </div>
        <div class="profile-details-location" v-if="profile && profile.location">
          <ion-skeleton-text v-if="isLoading" animated></ion-skeleton-text>
          <template v-else>
            <ion-icon :icon="locationOutline" style="width: 1rem; height: 1rem" />&nbsp;{{profile.location}}
          </template>
        </div>
        <div class="profile-details-joined">
          <ion-skeleton-text v-if="isLoading" animated></ion-skeleton-text>
          <template v-else>
            <ion-icon :icon="calendarOutline" style="width: 1rem; height: 1rem" />&nbsp;Joined {{profile.formattedCreatedAt}}
          </template>
        </div>
        <div class="profile-details-stats">
          <div class="profile-details-stat">
            <ion-skeleton-text v-if="isLoading" animated></ion-skeleton-text>
            <template v-else>
              <strong>{{friendsCount}}</strong>
              Following
            </template>
          </div>
          <div class="profile-details-stat">
            <ion-skeleton-text v-if="isLoading" animated></ion-skeleton-text>
            <template v-else>
              <strong>{{followersCount}}</strong>
              Followers
            </template>
          </div>
        </div>
      </div>
    </ion-header>
    <timeline
      class="profile-timeline" 
      :includeReplies="includeReplies" 
      :isMentionsTimeline="isMentionsTimeline" 
      :isPersonal="true" 
      :screenName="profile ? profile.screen_name : null"
      @scroll="onScroll"
    >
      <ion-segment class="type-segment" @ionChange="onTimelineTypeChange($event)" value="false">
        <ion-segment-button value="false">
          <ion-label>Tweets</ion-label>
        </ion-segment-button>
        <ion-segment-button value="true">
          <ion-label>Tweets & Replies</ion-label>
        </ion-segment-button>
        <ion-segment-button value="mentions" v-if="isAuthenticatedUser">
          <ion-label>Mentions</ion-label>
        </ion-segment-button>
      </ion-segment>
    </timeline>
  </ion-page>
</template>
<script lang="ts">
import { IonButtons, IonLabel, IonSkeletonText, IonIcon, IonSegment, IonSegmentButton, IonButton, IonAvatar, IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { view, lensPath } from 'ramda'
import Timeline from '@/components/timeline/index.vue'
import useProfile from "@/hooks/profile";
import { calendarOutline, locationOutline } from 'ionicons/icons';
import useFirebaseAuth from "@/hooks/firebase";
import friendlyNumber from '@/utils/friendlyNumber'

export default  {
  components: {
    IonPage, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonButton, IonAvatar, Timeline,
    IonLabel, IonSegment, IonSegmentButton,
    IonIcon, IonSkeletonText
  },
  setup() {
    const includeReplies = ref(false)
    const isMentionsTimeline = ref(false)
    const showHeader = ref(true)
    const isScrollTop = ref(true)
    const lastScrollPosition = ref(0)
    const route = useRoute()
    const screenName = computed(() => route.params.name || null)
    const { user } = useFirebaseAuth()
    const currentUserId = computed(() => view(lensPath(['providerData', 0, 'uid']), user.value || {}))
    
    const {
      profile,
      isLoadingProfile,
      currentProfile,
      isFollowing,
      isAuthenticatedUser,
    } = useProfile(screenName.value)

    const friendsCount = computed(() => friendlyNumber(profile.value ? profile.value.friends_count : 0))
    const followersCount = computed(() => friendlyNumber(profile.value ? profile.value.followers_count : 0))

    const isLoading = computed(() => isLoadingProfile.value || !profile.value)
    return {
      user,
      isAuthenticatedUser,
      currentUserId,
      calendarOutline,
      locationOutline,
      friendsCount,
      followersCount,

      screenName,
      onScroll: (e) => {
        if (e.target.tagName !== 'ION-CONTENT') return
        const currentScrollPosition = e.detail.scrollTop
        if (currentScrollPosition < 0) {
          return
        }
        // Stop executing this function if the difference between
        // current scroll position and last scroll position is less than some offset
        if (Math.abs(currentScrollPosition - lastScrollPosition.value) < 60) {
          return
        }
        showHeader.value = currentScrollPosition < lastScrollPosition.value
        lastScrollPosition.value = currentScrollPosition
      },

      profile,
      currentProfile,
      isLoading,
      isFollowing,
      includeReplies,
      isMentionsTimeline,
      showHeader,
      isScrollTop,
      lastScrollPosition,
      onTimelineTypeChange(e) {
        includeReplies.value = e.detail.value === 'true'
        isMentionsTimeline.value = e.detail.value === 'mentions'
      }
    }
  }
}
</script>
<style lang="css" scoped>
.type-segment {
  background: #fff;
  box-shadow: 0 0 5px rgba(#000, 0.2);
}
.profile-timeline {
  position: relative;
}
.profile-header {
	height: auto;
	transform: translate3d(0, 0, 0);
	transition: 0.4s all ease-out;
	visibility: visible;
	position: relative;
}
 .profile-header .profile-details {
	padding: 20px;
	display: flex;
	flex-direction: column;
	margin-top: 44px;
	background: #fff;
	color: #000;
	font-size: 1rem;
	box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
	position: relative;
}
 .profile-header .profile-details-avatar {
	position: absolute;
	right: 20px;
	top: 0;
	transform: translateY(-50%);
  box-shadow: 0 0 0 5px #fff;
  background: #fff;
}
 .profile-header .profile-details-name {
	font-size: 1.6rem;
	font-weight: 500;
	margin-bottom: 5px;
	padding-right: 60px;
	line-height: 1.2;
}
 .profile-header .profile-details-screen_name {
	color: #aaa;
	margin-bottom: 10px;
}
 .profile-header .profile-details-verified {
	height: 1.6rem;
	width: 1.6rem;
	display: inline-block;
	margin-left: 5px;
	transform: translateY(5px);
}
 .profile-header .profile-details-location, .profile-header .profile-details-joined {
	display: flex;
	flex-direction: row;
	align-items: center;
}
 .profile-header .profile-details-location img, .profile-header .profile-details-joined img {
	margin-right: 5px;
}
 .profile-header .profile-details-stat:not(:first-child) {
	margin-left: 20px;
}
 .profile-header .profile-details-stats {
	margin-top: 10px;
	display: flex;
}
 .profile-header .profile-background {
	background-size: cover;
  background-position: 50% 50%;
  background-color: #eee;
	height: 100px;
	position: absolute;
	width: 100%;
	transition: 0.4s all ease-out;
	z-index: -1;
}
 .profile-header ion-toolbar {
	--background: transparent;
  --border-width: 0;
	filter: invert(100%);
}
.profile-details-description {
  font-size: 0.8rem;
  margin-bottom: 10px;
}
 .profile-header ion-toolbar ion-title, .profile-header ion-toolbar .follow-button {
	display: none;
}
 .profile-header.profile-header--scrolling {
	background: #f2f2f2;
	height: auto;
}
 .profile-header.profile-header--scrolling .profile-background {
   height: 44px;
 }
 .profile-header.profile-header--scrolling .profile-details {
	height: 0;
	overflow: hidden;
	margin: 0;
	display: none;
}
 .profile-header.profile-header--scrolling ion-toolbar {
	filter: none;
	box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
}
 .profile-header.profile-header--scrolling ion-toolbar ion-title {
	display: flex;
}
 .profile-header.profile-header--scrolling ion-toolbar .follow-button {
	display: flex;
	visibility: visible;
}
 .profile-header.profile-header--hidden {
	transform: translate3d(0, -100%, 0);
	height: 0;
	overflow: hidden;
}
 
</style>