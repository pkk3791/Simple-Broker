import * as openpgp from 'openpgp';
import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

import { IonicVue } from '@ionic/vue';
import VuePlyr from 'vue-plyr'

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/* Theme variables */
import './theme/variables.css';

/* Additional styles */
import './theme/styles.css';
import 'animate.css';
import 'vue-plyr/dist/vue-plyr.css';

import useFirebaseAuth from "@/hooks/firebase";
import { Plugins } from '@capacitor/core';

// TODO
import useBG from "@/hooks/bg"

// TODO
const { App: IonicApp, BackgroundTask } = Plugins;
const { authCheck  } = useFirebaseAuth();

import Tweet from '@/components/tweet/index.vue'

const app = createApp(App)
  .use(VuePlyr, {
    plyr: {}
  })
  .use(IonicVue)

app.component('Tweet', Tweet)

authCheck()
  .then(() => {
    app.use(router);
    return router.isReady();
  })
  .then(() => {
    app.mount("#app");
  });

  
// TODO
const { startForegroundFetch, stopForegroundFetch, nextFetch } = useBG()
  
IonicApp.addListener('appStateChange', state => {
  if (!state.isActive) {
    // The app has become inactive. We should check if we have some work left to do, and, if so,
    // execute a background task that will allow us to finish that work before the OS
    // suspends or terminates our app:

    stopForegroundFetch()

    let taskId = BackgroundTask.beforeExit(async () => {
      // In this function We might finish an upload, let a network request
      // finish, persist some data, or perform some other task

      // Example of long task
      for (let i = 0; i < 5; i++) {
        await nextFetch()
      }


      // Must call in order to end our task otherwise
      // we risk our app being terminated, and possibly
      // being labeled as impacting battery life
      BackgroundTask.finish({
        taskId,
      });
    });
  } else {
    const state = useFirebaseAuth();
    const isAuthenticated = !!(state.accessToken.value && state.accessTokenSecret.value && state.user.value)
    if (isAuthenticated) {
      startForegroundFetch()
    }
  }
});