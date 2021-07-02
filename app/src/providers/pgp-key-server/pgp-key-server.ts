import { Injectable } from "@angular/core";
import { Storage } from "@ionic/storage";
import * as openpgp from 'openpgp';

@Injectable()
export class PgpKeyServerProvider {

  hkp = new openpgp.HKP('https://keys.openpgp.org/');
  pk: any[] = [];
  passphrase = "passphrase";

  constructor(private storage: Storage) {}

  public async generateKey(passphrase, email) {
    let options = {
      userIds: [{ email: email }], // multiple user IDs
      curve: "ed25519",// ECC curve name
      passphrase: this.passphrase
    };
      // passphrase: this.passphrase // protects the private key

    let a = await openpgp.generateKey(options);
    return a;
  }

  public async publishPubKey(pubkey) {
    this.hkp.upload(pubkey).then(function(result) {
    });
  }

  public async lookupKeys(email: string) {
    let pubkey;
     let myEmail = await this.storage.get("email");
     if(email === myEmail){
        pubkey= await this.storage.get("publicKey");
        let ampubkey = (await openpgp.key.readArmored(pubkey)).keys[0];
        this.pk.push(ampubkey);
     }
    else{
        //lookup followers pubkey on server
            var options = {
            query: email
          };
        try {
          let armoredPubkey = await this.hkp.lookup(options);
          pubkey = (await openpgp.key.readArmored(armoredPubkey)).keys[0];
          this.pk.push(pubkey);  
          return pubkey;
        } catch (err) {
          console.log("Error: key not found");

          }
      }

    } 

  /**
   * Encrypt text with RSA
   * @param plainText plain text
   * @param privateKey private key
   */
  public async encrypt(plainText) {
    if (!this.pk) { console.log("this.pk is empty"); return; }
    console.log("this.pk",this.pk);
     this.pk = this.pk.filter(pk => pk != undefined);
     console.log("sanitized this.pk",this.pk);
    const options = {
      message: openpgp.message.fromText(plainText), // input as Message object
      publicKeys: await Promise.all(this.pk), // for encryption
    }
    const ciphertext = await openpgp.encrypt(options);
    return ciphertext.data;
  }

  public async decrypt(encrypted: string, privKeyObj) {
    const options2 = {
      message: await openpgp.message.readArmored(encrypted), // parse armored message
      privateKeys: [privKeyObj] // for decryption
    }
    try {
      let plaintext = await openpgp.decrypt(options2);
      return plaintext.data
    } catch (err) {
      console.log('Error thrown:', err);
    }
    return null;
  }

  public async revokeKey() {
    //using revocation certificate
    let pubkey = await this.storage.get("publicKey");
    let atest = (await openpgp.key.readArmored(pubkey)).keys[0];
    let revocatnCert = this.storage.get("revocationCert");
    try {
      var options = {
        key: atest,
        revocationCertificate: revocatnCert
      };

      openpgp.revokeKey(options).then(function(key) {
        console.log("public key revoked", key);
      });

    } catch (e) {
      console.log('revoke failed', e);
    }

  }

  async getArmoredPrivateKey(key:string){
    const privKeyObj = (await openpgp.key.readArmored(key)).keys[0];

    if(privKeyObj){
      await privKeyObj.decrypt(this.passphrase);
      return privKeyObj;
    }
    else
      return key;
  }

  async clearStoredKeys(){
    this.pk=[];
  }

}
