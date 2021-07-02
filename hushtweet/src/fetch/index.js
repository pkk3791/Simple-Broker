
import Fetch from 'cross-fetch';
import '@capacitor-community/http';
import { Plugins } from '@capacitor/core';
import { isPlatform } from '@ionic/vue';

const { Http } = Plugins;

export default async (url, params) => {
  console.log(params)
  // if (isPlatform('capacitor')) {
  //   console.log({
  //     ...params,
  //     data: params.body,
  //     url: url
  //   })
  //   const result = await Http.request({
  //     method: 'GET',
  //     ...params,
  //     ...(params.headers['Content-Type'] == 'application/x-www-form-urlencoded' ? {
  //       params: params.body.split('&').map(_ => {
  //         const t = _.split('=')
  //         return { [t[0]]: t[1] }
  //       }).reduce((a, c) => ({...a, ...c}), {})
  //     } : {
  //       data: params.body
  //     }),
  //     url: url
  //   });
  //   const ok = result.status >= 200 && result.status < 300
  //   return {
  //     ...result,
  //     ok,
  //     headers: new Map(Object.entries(result.headers.reduce((a, c) => ({ ...a, ...c }), {}))),
  //     statusText: ok ? '' : result.data,
  //     json() {
  //       return new Promise((resolve) => resolve(this.data))
  //     },
  //     text() {
  //       return new Promise((resolve) => resolve(this.data))
  //     }
  //   }
  // } else {
    const p = params || {}
    return await Fetch(`https://hushtweet-cors.herokuapp.com/${url}`, {
      ...p,
      headers: {
        ...p.headers,
        'x-requested-with': 'HushTweet'
      }
    })
  // }
}