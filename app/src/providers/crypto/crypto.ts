import { Injectable } from "@angular/core";
import { TwitterApiProvider } from "../twitter-api/twitter-api";
import { P2pStorageIpfsProvider } from "../p2p-storage-ipfs/p2p-storage-ipfs";
import { P2pDatabaseGunProvider } from "../p2p-database-gun/p2p-database-gun";
import { Storage } from "@ionic/storage";
import * as openpgp from 'openpgp';
@Injectable()
export class CryptoProvider {
  ownUserId: string;
  email: string;

  constructor(
    private twitter: TwitterApiProvider,
    private ipfs: P2pStorageIpfsProvider,
    private gun: P2pDatabaseGunProvider,
    private storage: Storage
  ) {
    this.init();
  }

  private async init() {
    this.ownUserId = await this.storage.get("userId");
    this.email = await this.storage.get("email");
  }

  /**
   * Publishs the private key history with the latest key
   * @param key key to publish
   */

  public async publishPrivateKey(key: string) {
    let privateKeyHistory = await this.getKeyHistory(this.ownUserId);
    // Todo: avoid publishing the same public key twice - check if new key equals newest key in history
    if ( privateKeyHistory && (key === privateKeyHistory.keys[0].key)) return;
    else
    {
      // Add new key to history
          const newKey = {
            key: key,
            validFrom: Date.now()
          };

        if (privateKeyHistory) {
          privateKeyHistory["keys"].push(newKey);
        } else {
          privateKeyHistory = {
            keys: [newKey]
          };
        }
    }

    if(privateKeyHistory){
      // Encrypt key history
      const encryptedPrivateKeyHistory = JSON.stringify(privateKeyHistory);

      // Publish updated key history...
      const res = await this.ipfs.storePrivateKey(encryptedPrivateKeyHistory);

      // store ipfs link Of private tweet in gundb

      await this.gun.storePrivateKeyHistory(this.ownUserId, this.email, res["Hash"]);
    }
  }


  private async getKeyHistory(userId: string) {
    //get private key history from gun
    let link = await this.gun.getPvtKeyHistory(userId);
    // Fetch Private key history
    if (link && link.key) {
      const encryptedKeyHistory = await this.ipfs.fetchJson(link.key);
      // Decrypt key history
      return JSON.parse(encryptedKeyHistory.toString());
      // return null;
    } else {
      return null;
    }
  }

  private extractTweetId(text: string): string {
    for (let word of text.split(" ")) {
      if (this.isTweetId(word)) {
        return word.substr(8);
      }
    }
    return "";
  }

  private extractLinkFromDescription(text: string): string {
    for (let word of text.split(" ")) {
      if (this.isIpfsLink(word)) {
        return word.substr(7);
      }
    }
    return "";
  }

  private isIpfsLink(word: string): boolean {
    return /ipfs:\/\/Qm[a-zA-Z0-9]+/.test(word);
  }

  private isTweetId(word: string): boolean {
    return /tweet:\/\/[0-9]+/.test(word);
  }

  /**
   * checks if the latest published key is the same as the one saved in app settings
   */
  public async isPublicKeyPublished(): Promise < boolean > {
    const publicKey = await this.storage.get("publicKey");
    return publicKey ? true : false;

  }

  /**
   * checks if a private key is already set
   */
  public async isPrivateKeySet(): Promise < boolean > {
    const privateKey = await this.storage.get("privateKey");
    return privateKey ? true : false;
  }


  /**
   * Fetches the private key history for a given user id
   * @param userId user id
   */
  public async fetchPrivateKeyHistoryForUser(userId: string): Promise < object[] > {
    const keyHistory = await this.getKeyHistory(userId);
    if (keyHistory)
      return keyHistory["keys"].reverse();
    else return null;
  }

}
