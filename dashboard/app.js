const gun = Gun("https://hybrid-osn.herokuapp.com/gun");
const gunId = "hybridOSN-v1.0.0";

const app = new Vue({
  el: "#app",
  data: {
    date: new Date().toISOString().slice(0, 10),
    keysByDate: {},
    done: 0,
    total: 0,
    showLoading: false,
    hashtags: []
  },
  computed: {
    hashtagKey() {
      if (this.date in this.keysByDate) {
        return this.keysByDate[this.date];
      } else {
        return null;
      }
    },
    hashtagRanking() {
      const ranking = _.countBy(this.hashtags, hashtag => hashtag);
      const sortableHelper = [];
      for (let entry in ranking) {
        sortableHelper.push({ hashtags: entry, counts: ranking[entry] });
      }
      const sortedRanking = sortableHelper.sort(
        (a, b) => b["counts"] - a["counts"]
      );
      return sortedRanking;
    }
  },
  async mounted() {
    // load data and group by date
    const data = await gun
      .get(gunId)
      .get("hashtags")
      .then();

    if (data === undefined) {
      console.error("Currently there is no data on Gun provided.");
    } else {
      const keys = Object.keys(data).filter(val => /^[0-9]+$/.test(val));
      this.createDateKeyMap(keys);
      this.loadHashtags();
    }
  },
  methods: {
    createDateKeyMap(keys) {
      const tzoffset = new Date().getTimezoneOffset() * 60000;
      this.keysByDate = keys.reduce((map, el) => {
        map[new Date(parseInt(el) - tzoffset).toISOString().slice(0, 10)] = el;
        return map;
      }, {});
    },
    async loadHashtags() {
      this.hashtags = [];

      // show loading
      this.showLoading = true;

      if (this.hashtagKey === null) {
        console.info("No hashtags posted on this day (" + this.date + ")");
      } else {
        let data = await gun
          .get(gunId)
          .get("hashtags")
          .get(this.hashtagKey)
          .then();

        const keys = Object.keys(data).filter(val => /^[0-9]+$/.test(val));

        // (re)set vars
        this.total = keys.length;

        // fetch hashtags
        for (let i = 0; i < this.total; i++) {
          this.done = i + 1;
          const hashtagEntry = await gun.get(keys[i]).then();
          if (hashtagEntry !== undefined && hashtagEntry["hashtags"]) {
            hashtagEntry["hashtags"]
              .split("|")
              .forEach(hashtag => this.hashtags.push(hashtag));
          }
        }
      }

      // finish loading
      this.showLoading = false;
    }
  }
});
