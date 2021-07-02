/* eslint-disable @typescript-eslint/camelcase */
import { watch, computed, ref, Ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { parse, format } from 'date-fns'
import useFirebaseAuth from "@/hooks/firebase";
import { view, lensPath } from 'ramda'
import useTwitter from './twitter'

export default (screenName: any = null) => {

  console.log(screenName)

  const { user, getProfile } = useFirebaseAuth()
  const { client } = useTwitter()

  const currentUserId = computed(() => view(lensPath(['providerData', 0, 'uid']), user.value || {}))

  const { state: profile, ready: isProfileReady } = useAsyncState((async () => {
    let tmp: any = null
    if (screenName) {
      try {
        tmp = await client.get('users/show', {
          screen_name: screenName.replace('@', '')
        })
      } catch (ex) {
        return null
      }
    } else {
      tmp = await getProfile()
    }
    return tmp ? {
      ...tmp,
      formattedCreatedAt: format(
        parse(tmp.created_at, 'EEE MMM dd HH:mm:ss XXXX yyyy', new Date()),
        'MMMM yyyy'
      )
    } : null
  })(), null)

  const isLoadingProfile = computed(() => !isProfileReady)
  const currentProfile = computed((): any => isProfileReady ? profile : {})
  
  const isAuthenticatedUser = computed(() => {
    return isProfileReady && profile.value ? currentUserId.value == profile.value.id_str : false
  })
  const isFollowing = computed(() => {
    return !!currentProfile.value.following
  })

  console.log(profile.value)

  return {
    profile,
    currentProfile,
    isLoadingProfile,
    isFollowing,
    isAuthenticatedUser
  }

}