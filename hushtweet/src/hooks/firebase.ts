import { toRefs, reactive } from "vue";
import firebase from 'firebase/app';
import "firebase/firestore";
import {cfaSignInTwitter, cfaSignOut, TwitterSignInResult} from 'capacitor-firebase-auth/alternative'; 
import Storage from '@/utils/storage'
import FIREBASE_CONFIG from "./.env.firebase";
import useTwitter from './twitter'

// import useCrypto from '@/secure/crypto'
const state = reactive<{ user: any; profile: any; accessToken: string | null; accessTokenSecret: string | null; initialized: boolean; error: any; email: string | null }>({
  user: null,
  profile: null,
  accessToken: null,
  accessTokenSecret: null,
  initialized: false,
  error: null,
  email: null,
});

// initialize firebase, this is directly from the firebase documentation
// regarding getting started for the web
if (firebase.apps.length === 0) {
  firebase.initializeApp(FIREBASE_CONFIG);
  firebase.auth().useDeviceLanguage();
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
}

export default function() {
  // const crypto = useCrypto()
  const login = () => {
    return new Promise((resolve, reject) => {
      cfaSignInTwitter().subscribe(
        ({userCredential, result}: {userCredential: firebase.auth.UserCredential; result: TwitterSignInResult}) => {
          const credential: any = userCredential.credential
          state.accessToken = credential.accessToken
          state.accessTokenSecret = credential.secret
          state.user = userCredential.user
          state.email = state.user.providerData[0].email
          console.log('login')
          console.log(userCredential)

          Storage.setItem('accessToken', state.accessToken)
          Storage.setItem('accessTokenSecret', state.accessTokenSecret)

          // TODO
          //startForegroundFetch()

          resolve(!!(state.accessToken && state.accessTokenSecret && state.user))
        },
        (error: any) => {
          reject(error)
        }
      )
    })
    
  };

  const resetSession = async () => {
    state.accessToken = null;
    state.accessTokenSecret = null;
    state.user = null;
    state.profile = null;

    const { resetApi } = useTwitter()
    resetApi()
    
    await Storage.setItem('accessToken', state.accessToken)
    await Storage.setItem('accessTokenSecret', state.accessTokenSecret)
  }

  const logout = () => {
    return new Promise((resolve) => {
      cfaSignOut()
      .subscribe(async () => {
        await resetSession()
        resolve()
      }, 
      async () => {
        await resetSession()
        resolve()
      })
    })
  };

  const getProfile = async () => {
    if (!state.user) return null
    if (state.profile) return {
      ...state.profile
    }
    try {
      const { client } = useTwitter()
      state.profile = await client.get('account/verify_credentials')
      return {
        ...state.profile
      }
    } catch {
      state.profile = null
    }
  }

  const getEmail = async () => {
    return state.email
  }

  const getUserId = () => {
    return state.user.providerData[0].uid
  }

  // RUN AT STARTUP
  const authCheck = () => {
    return new Promise((resolve) => {
      if (!state.initialized) {
        firebase.auth().onIdTokenChanged(async (user: any) => {
          state.user = user
          console.log('authCheck')
          console.log(user)
          if (user) {
            state.email = user.providerData[0].email
          }
          state.accessToken = await Storage.getItem('accessToken')
          state.accessTokenSecret = await Storage.getItem('accessTokenSecret')
          console.log(state)

          const { initApi } = useTwitter()
          initApi(String(state.accessToken), String(state.accessTokenSecret))

          // TODO
          //startForegroundFetch()

          resolve(true);
        });
      } else {
        resolve(false);
      }
    });
  };

  return {
    ...toRefs(state),
    // FUNCTIONS
    login,
    logout,
    authCheck,
    getProfile,
    getEmail,
    getUserId
  };
}
