import { modalController, toastController } from '@ionic/vue';
import CreateTweetPage from '@/views/tweet/create.vue'
export default () => {
  return {
    writeTweet: async (replyTo = null, quote = null) => {
      const modal = await modalController
        .create({
          component: CreateTweetPage,
          componentProps: {
            replyTo,
            quote,
            closeHandler: () => {
              modal.dismiss()
            }
          }
        })
      return modal.present();
    }
  }
}

export const handleError = async (e) => {
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
}