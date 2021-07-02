import Fetch from 'cross-fetch';

const infuraUrl = "https://ipfs.infura.io:5001/api/v0/";

export default () => {

  const storeOnIPFS = async (json) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(json));

    return (await Fetch(`${infuraUrl}add`, {
      method: 'POST',
      body: formData,
    })).json()
  }

  const fetchJson = async (hash: string) => {
    return await (await Fetch(`${infuraUrl}cat?arg=${hash}`)).json();
  }

  /**
   * Store private tweet on ipfs
   * @param tweet tweet object
   */
  const storeTweet = async (tweet) => {
    return await storeOnIPFS(tweet);
  }

  /**
   * fetch tweet from ipfs for hash
   * @param hash address hash
   */
  const fetchTweet = async (hash: string): Promise < string > => {
    let tweet;

    try {
      tweet = await (await Fetch(`${infuraUrl}cat?arg=${hash}`)).text();
    } catch (err) {
      console.log("failed to resolve get promise", err);
    }

    return tweet;
  }

  /**
   * fetch multiple tweets from ipfs
   * @param hashs array of hashes
   */
  const fetchTweets = async (hashs: string[]): Promise < string[] > => {
    return await Promise.all(hashs.map(hash => fetchTweet(hash)));
  }

  /**
   * Store private key history on ipfs
   * @param privateKeyHistory private key history object
   */
  const storePrivateKey = async (privateKeyHistory) => {
    return await storeOnIPFS(privateKeyHistory);
  }

  return {
    fetchTweets,
    fetchTweet,
    storeTweet,
    storePrivateKey,
    fetchJson
  }
}