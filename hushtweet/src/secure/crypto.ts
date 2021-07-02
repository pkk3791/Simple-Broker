import Storage from '@/utils/storage'
import useIPFS from './ipfs'
import useGUN from './gun.js'
import usePGP from './pgp'
import useFirebaseAuth from '@/hooks/firebase'

export default () => {
  const ipfs = useIPFS()
  const { getEmail, getUserId } = useFirebaseAuth()
  const gun = useGUN()
  const pgp = usePGP()

  const getKeyHistory = async (userId: string) => {
    //get private key history from gun
    const link = await gun.getPvtKeyHistory(userId);
    console.log(link)
    // Fetch Private key history
    if (link && link.key) {
      const encryptedKeyHistory = await ipfs.fetchJson(link.key);
      console.log('encryptedKeyHistory')
      console.log(encryptedKeyHistory)
      // Decrypt key history
      return JSON.parse(encryptedKeyHistory.toString());
      // return null;
    } else {
      return null;
    }
  }

  const isIpfsLink = (word: string): boolean => {
    return /ipfs:\/\/Qm[a-zA-Z0-9]+/.test(word);
  }

  const isTweetId = (word: string): boolean => {
    return /tweet:\/\/[0-9]+/.test(word);
  }

  /**
   * checks if the latest published key is the same as the one saved in app settings
   */
  const isPublicKeyPublished = async (): Promise < boolean > => {
    const publicKey = await Storage.getItem("publicKey");
    return publicKey ? true : false;

  }

  /**
   * checks if a private key is already set
   */
  const isPrivateKeySet = async (): Promise < boolean > => {
    const privateKey = await Storage.getItem("privateKey");
    return privateKey ? true : false;
  }


  /**
   * Fetches the private key history for a given user id
   * @param userId user id
   */
  const fetchPrivateKeyHistoryForUser = async (userId: string): Promise < object[] | null > => {
    const keyHistory = await getKeyHistory(userId);
    if (keyHistory)
      return keyHistory["keys"].reverse();
    return null;
  }

  const publishPrivateKey = async (key: string) => {
    const userId = getUserId()
    const email = await getEmail()
    let privateKeyHistory = await getKeyHistory(userId);
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
      const res = await ipfs.storePrivateKey(encryptedPrivateKeyHistory);

      // store ipfs link Of private tweet in gundb

      await gun.storePrivateKeyHistory(userId, email, res["Hash"]);
    }
  }

  const ensureKeys = async () => {
    const hasPrivateKey = await isPrivateKeySet()
    const publicKeyPublished = await isPublicKeyPublished()
    console.log(`hasPrivateKey: ${hasPrivateKey}, publicKeyPublished: ${publicKeyPublished}`)
    if (!hasPrivateKey || !publicKeyPublished) {

      const userId = getUserId()
      const email = await getEmail()
      console.log(userId)
      console.log(email)
      const keys = await pgp.generateKey(email)

      await pgp.publishPubKey(keys.publicKeyArmored);
      await gun.setEmail(userId, email);

      await publishPrivateKey(keys.privateKeyArmored);

      Storage.setItem("publicKey", keys.publicKeyArmored);
      Storage.setItem("privateKey", keys.privateKeyArmored);
      Storage.setItem("keyid", keys.key.primaryKey.keyid);
      Storage.setItem("revocationCert", keys.revocationCertificate);
    }
  }

  return {
    publishPrivateKey,
    fetchPrivateKeyHistoryForUser,
    isPrivateKeySet,
    isPublicKeyPublished,
    ensureKeys
  }
}