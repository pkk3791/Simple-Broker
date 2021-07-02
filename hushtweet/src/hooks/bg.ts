
// TODO
export default function() {
    let t: any = null
    const nextFetch = async () => {}
    const scheduleFetch = () => {
      clearTimeout(t)
      t = setTimeout(async () => {
        // tasks... 
        await nextFetch()
        scheduleFetch()
      }, 5000)
    }
    const startForegroundFetch = () => {
      scheduleFetch()
    }
    const stopForegroundFetch = () => {
      clearTimeout(t)
    }
    return {
      startForegroundFetch,
      stopForegroundFetch,
      nextFetch
    }
  }