import Storage from '@/utils/storage'
import * as openpgp from 'openpgp';
import useFirebaseAuth from '@/hooks/firebase'
const hkp = new openpgp.HKP('https://hushtweet-cors.herokuapp.com/https://keys.openpgp.org/');
let pk: any[] = [];
const passphrase = "passphrase";

export default () => {

  const { getEmail } = useFirebaseAuth()

  const generateKey = async (email) => {
    const options = {
      userIds: [{ email: email }], // multiple user IDs
      curve: "ed25519",// ECC curve name
      passphrase
    };
    return await openpgp.generateKey(options);
  }

  const publishPubKey = async (pubkey) => {
    await hkp.upload(pubkey)
  }

  const lookupKeys = async (email: string) => {
    let pubkey;
    const myEmail = await getEmail();
    if(email === myEmail){
      pubkey = await Storage.getItem("publicKey");
      const ampubkey = (await openpgp.key.readArmored(pubkey)).keys[0];
      pk.push(ampubkey);
    }
    else {
      try {
        const armoredPubkey = await hkp.lookup({
          query: email
        });
        pubkey = (await openpgp.key.readArmored(armoredPubkey)).keys[0];
        pk.push(pubkey);  
        return pubkey;
      } catch (err) {
        console.log("Error: key not found");
      }
    }
  }

  const encrypt = async (plainText) => {
    if (!pk) { console.log("this.pk is empty"); return; }
    console.log("this.pk",  pk);
    pk = pk.filter(pk => pk != undefined);
    console.log("sanitized this.pk", pk);
    const options = {
      message: openpgp.message.fromText(plainText), // input as Message object
      publicKeys: await Promise.all(pk), // for encryption
    }
    const ciphertext = await openpgp.encrypt(options);
    return ciphertext.data;
  }

  const decrypt = async (encrypted: string, privKeyObj) => {
    const options2 = {
      message: await openpgp.message.readArmored(encrypted.replace(/\\r\\n/g, '\r\n').replace(/"/, '')), // parse armored message
      privateKeys: [privKeyObj] // for decryption
    }
    console.log(options2)
    try {
      const plaintext = await openpgp.decrypt(options2);
      return plaintext.data
    } catch (err) {
      console.log('Error thrown:', err);
    }
    return null;
  }

  const revokeKey = async () => {
    //using revocation certificate
    const pubkey = await Storage.getItem("publicKey");
    const atest = (await openpgp.key.readArmored(pubkey)).keys[0];
    const revocatnCert = Storage.getItem("revocationCert");
    try {
      const options = {
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

  const getArmoredPrivateKey = async (key: string) => {
    const privKeyObj = (await openpgp.key.readArmored(key)).keys[0];

    if(privKeyObj){
      await privKeyObj.decrypt(passphrase);
      return privKeyObj;
    }
    else
      return key;
  }

  const clearStoredKeys = async () => {
    pk = [];
  }

  return {
    generateKey,
    publishPubKey,
    lookupKeys,
    encrypt,
    decrypt,
    revokeKey,
    getArmoredPrivateKey,
    clearStoredKeys
  }
}