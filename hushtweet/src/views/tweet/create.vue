<template>
  <ion-header translucent>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button style="display: block; background: rgba(255, 255, 255, 0.5); border-radius: 50%; width: 32px" @click="closePopup">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2.01429L17.9857 0L10 7.98571L2.01429 0L0 2.01429L7.98571 10L0 17.9857L2.01429 20L10 12.0143L17.9857 20L20 17.9857L12.0143 10L20 2.01429Z" fill="black"/>
          </svg>
        </ion-button>
      </ion-buttons>
      <ion-title>
        <template v-if="quote">Quote</template>
        <template v-else-if="replyTo">Reply to</template>
        <template v-else>Write a tweet</template>
      </ion-title>
      <ion-buttons v-if="usedCharacterLimit > 0 && usedCharacterLimit <= 1" slot="end" style="margin-right: 20px">
        <ion-button :disbabled="isSubmitting" color="primary" fill="solid" @click="submit">
          <template v-if="quote">Quote</template>
          <template v-else-if="replyTo">Reply</template>
          <template v-else>Tweet</template>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content :class="{ 'create-tweet-page': true, 'is-private': isPrivateTweet }">
    <div><tweet v-if="!!replyTo" :value="replyTo" :hideActions="true" /></div>
    <prism-editor :maxlength="250" :tabSize="1" :placeholder="placeholder" class="tweet-editor" v-model="text" :highlight="highlighter"></prism-editor>
    <tweet v-if="!!quote" :value="quote" :hideActions="true" :isQuote="true" style="margin: 1rem"/>
  </ion-content>
  <ion-footer>
    <div class="tweet-chars" :style="{ 'color': charactersLeft < 0 ? 'var(--ion-color-danger)' : 'inherit' }">
      <template v-if="charactersLeft > 0">
        {{charactersLeft}} character{{charactersLeft == 1 ? '' : 's'}} left
      </template>
      <template v-else>
        {{charactersLeft}} characters too much
      </template>
    </div>
    <ion-progress-bar :color="parsedTweet.valid ? 'primary' : 'danger'" :value="usedCharacterLimit"></ion-progress-bar>
    <ion-toolbar>
      <div class="state-toggle">
        <span @click="isPrivateTweet = false" :class="{ disabled: isPrivateTweet }">public tweet</span>
        <ion-toggle v-model="isPrivateTweet" />
        <span @click="isPrivateTweet = true" :class="{ disabled: !isPrivateTweet }">private tweet</span>
      </div>
    </ion-toolbar>
  </ion-footer>
</template>
<style scoped>
.tweet-chars  {
  color: #999;
  text-align: center;
  font-size: 0.8rem;
  margin: 5px;
}
.create-tweet-page.is-private {
  --background: #eee;
  position: relative;
}
.tweet-editor {
  border-top: solid 1px #eee;
}
.create-tweet-page.is-private .tweet-editor {
  border-top: solid 1px #999;
}
.create-tweet-page.is-private:after {
  pointer-events: none;
  background-image: url(/assets/lock.svg);
  width: 20%;
  height: 20%;
  display: block;
  right: 30px;
  bottom: 30px;
  background-repeat: no-repeat;
  background-size: 100% auto;
  content: '';
  position: absolute;
  opacity: 0.1;
}
  
.state-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
}
.state-toggle span.disabled {
  color: #999;
}
.state-toggle ion-toggle {
  --handle-height: 10px;
  --handle-width: 10px;
  --handle-spacing: 5px;
  --background-checked: #333;
  height: 20px;
  width: 35px;
  margin-left: 1rem;
  margin-right: 1rem;
}
</style>
<style>
.prism-editor-wrapper {
  max-height: 100%;
  height: auto;
}
.prism-editor__container {
  max-height: 100%;
  outline: none;
}
.prism-editor-wrapper .prism-editor__container {
  overflow: auto;
}
.prism-editor-wrapper .prism-editor__editor, .prism-editor-wrapper .prism-editor__textarea {
  padding: 1rem;
  outline: none;
}
</style>
<script lang="ts">
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { PrismEditor } from 'vue-prism-editor';
import 'vue-prism-editor/dist/prismeditor.min.css';
import { IonButtons, IonToggle, IonButton, IonPage, IonFooter, IonProgressBar, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import { reactive, ref, computed, defineComponent, onMounted, onUpdated } from 'vue';
import Tweet from '@/components/tweet/index.vue'
import twttr from 'twitter-text'
import useTwitter from '@/hooks/twitter';
import useCrypto from '@/secure/crypto'
import useGUN from '@/secure/gun.js'
import useIPFS from '@/secure/ipfs'
import usePGP from '@/secure/pgp'
import * as openpgp from 'openpgp';
import Storage from '@/utils/storage'
import useFirebaseAuth from '@/hooks/firebase'
import activeMQ from "@/secure/activeMQ";

export default defineComponent({
  components: {
    IonHeader, IonToolbar, IonTitle,
    IonButtons, IonButton, IonContent,
    PrismEditor, IonToggle, Tweet,
    IonFooter, IonProgressBar
  },
  props: {
    closeHandler: {
      type: Function,
      default: null
    },
    replyTo: {
      type: Object,
      default: null
    },
    quote: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const text: any = ref(props.replyTo ? `@${props.replyTo.user.screen_name} ` : '')
    const isPrivateTweet = ref(false)
    const parsedTweet = computed(() => twttr.parseTweet(text.value || ''))
    const charactersLeft = computed(() => 280 - parsedTweet.value.weightedLength)
    const usedCharacterLimit = computed(() => parsedTweet.value.weightedLength / 250)
    const isSubmitting = ref(false)
    const placeholder = computed(() => {
      if (props.replyTo) return 'Write your reply...'
      if (props.quote) return 'Write your comment...'
      return 'Write your tweet...'
    })
    const { postTweet, client } = useTwitter()
    const { ensureKeys } = useCrypto()
    const gun = useGUN()
    const ipfs = useIPFS()
    const pgp = usePGP()
    const { getEmail, getUserId } = useFirebaseAuth()
    const useActiveMQ = activeMQ()
    
    const closePopup = async () => {
      if (props.closeHandler) props.closeHandler()
    }

    const getMentions = async (status: string) => {
      const entities = twttr.extractMentionsWithIndices(status);

      // add user_id
      const entitiesWithPromises = entities.map(async mention => {
        try {
          const user = await client.get('users/show', {
            screen_name: mention.screenName
          })
          mention.id_str = user.id_str
          mention.screen_name = mention.screenName;
          delete mention.screenName;
        } catch (err) {
          console.error(
            "There is no user signed up to twitter with username: " +
            mention.screenName
          );
        }
        return mention;
      });

      // filter for valid users and return
      return (await Promise.all(entitiesWithPromises)).filter((el: any) =>
        // eslint-disable-next-line no-prototype-builtins
        el.hasOwnProperty("id_str")
      );
    }

    const getEntities = async (status: string) => {
      return {
        hashtags: twttr.extractHashtagsWithIndices(status),
        urls: twttr.extractUrlsWithIndices(status),
        user_mentions: await getMentions(status)
      };
    }

    const buildPrivateTweet = async (text) => {
      const status = text.trim();
      const entities = await getEntities(status);

      return {
        full_text: status,
        user_id: getUserId(),
        created_at: Date.now(),
        private_tweet: true,
        in_reply_to_status_id: props.replyTo ? props.replyTo.id_str : null,
        quoted_status_id: props.quote ? props.quote.id_str : null,
        display_text_range: [0, status.length],
        entities: entities
      };
    }

    return {
      isSubmitting,
      parsedTweet,
      placeholder,
      charactersLeft,
      usedCharacterLimit,
      isPrivateTweet,
      highlighter(code) {
        return (code || '').replace(/([@#][\w\d]+)|(https?:\/\/[^\s]+)/g, (match, p1, p2) => {
          return `<span style="color: var(--ion-color-primary)">${p1 || p2}</span>`
        });
      },
      text,
      items: [
        {
          value: 'cat',
          label: 'Mr Cat',
        },
        {
          value: 'dog',
          label: 'Mr Dog',
        },
      ],
      closePopup,
      async submit() {
        isSubmitting.value = true
        let result: any = false
        if (isPrivateTweet.value) {
          try {
            await ensureKeys()

            const tweet = await buildPrivateTweet(text.value);
            console.log("This is the private tweet " + JSON.stringify(tweet))
    
            const email = await getEmail()
            await pgp.lookupKeys(String(email));
            const encryptedTweet = await pgp.encrypt(JSON.stringify(tweet));

            if(useActiveMQ.isClientActive()){
              console.log("The ActiveMQ broker is active");
              const preppedMessage = useActiveMQ.prepMessageForQueue(encryptedTweet,
              tweet.user_id, tweet.created_at, tweet.entities.hashtags);
              useActiveMQ.addToLocalQueue(JSON.stringify(preppedMessage));
            }
            else{
              console.log("The ActiveMQ broker is inactive");
              const res = await ipfs.storeTweet(encryptedTweet);
            console.log(res)
            await gun.storeLastTweetHashForUser(
              tweet.user_id,
              res["Hash"],
              tweet.created_at
            );

            await gun.publishHashtags(tweet.entities.hashtags);
            }
            result = true
          } catch (e) {
            // 
            console.log(e)
          }

        } else {
          result = await postTweet({
            status: text.value,
            ...(props.replyTo ? {
              in_reply_to_status_id: props.replyTo.id_str,
              auto_populate_reply_metadata: true
            } : {}),
            ...(props.quote ? {
              attachment_url: `https://twitter.com/${props.quote.user.screen_name}/status/${props.quote.id_str}`
            } : {})
          })
        }
        
        isSubmitting.value = false
        if (result) {
          await closePopup()
        }
      }
    }
  }
})
</script>