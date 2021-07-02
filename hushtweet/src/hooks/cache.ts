import Cache from 'cache'

let stc: Cache = null;

export default () => {
  stc = stc || new Cache(15 * 60 * 1000)
  return {
    put: (key, value) => {
      stc.put(key, value)
    },
    get: (key): any => {
      stc.get(key)
    }
  }
}
