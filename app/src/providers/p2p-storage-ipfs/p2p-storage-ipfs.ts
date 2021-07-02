import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable()
export class P2pStorageIpfsProvider {
  private infuraUrl = "https://ipfs.infura.io:5001/api/v0/";

  constructor(public http: HttpClient) {}

  /**
   * Store private tweet on ipfs
   * @param tweet tweet object
   */
  public storeTweet(tweet) {
    return this.storeOnIPFS(tweet);
  }

  /**
   * Store private key history on ipfs
   * @param privateKeyHistory private key history object
   */
  public storePrivateKey(privateKeyHistory) {
    return this.storeOnIPFS(privateKeyHistory);
  }

  private storeOnIPFS(json) {
    // console.log("json in ipfs.storeOnIPFS is:",json);
    const formData = new FormData();
    formData.append("data", JSON.stringify(json));

    return this.http.post(this.infuraUrl + "add", formData).toPromise();
  }

  /**
   * fetch data from ipfs for hash
   * @param hash address hash
   */
  public async fetchJson(hash: string) {
    // console.log("hash is:",hash)
    const options = {
      params: { arg: hash }
    };

    return await this.http.get(this.infuraUrl + "cat", options).toPromise();
  }

  /**
   * fetch tweet from ipfs for hash
   * @param hash address hash
   */
  public async fetchTweet(hash: string): Promise < string > {
    let tweet;
    const options = {
      params: { arg: hash }
    };

    try {
      tweet = await this.http.get < string > (this.infuraUrl + "cat", options).toPromise();
    } catch (err) {
      console.log("failed to resolve get promise", err);
    }

    return tweet;
  }

  /**
   * fetch multiple tweets from ipfs
   * @param hashs array of hashes
   */
  public async fetchTweets(hashs: string[]): Promise < string[] > {
    return await Promise.all(hashs.map(hash => this.fetchTweet(hash)));
  }
}
