import { Component } from "@angular/core";
import {
  NavController,
  ToastController,
  LoadingController,
  AlertController
} from "ionic-angular";
import { Storage } from "@ionic/storage";
import { CryptoProvider } from "../../providers/crypto/crypto";
import { SocialSharing } from "@ionic-native/social-sharing";
import { P2pDatabaseGunProvider } from "../../providers/p2p-database-gun/p2p-database-gun";
import { PgpKeyServerProvider } from "../../providers/pgp-key-server/pgp-key-server";

@Component({
  selector: "page-settings",
  templateUrl: "settings.html"
})
export class SettingsPage {
  keywords: string;
  privateKey: string;
  publicKey: string;
  revocationCertificate: string;
  email: string;
  keyid;

  constructor(
    public navCtrl: NavController,
    public toastCtrl: ToastController,
    private cryptoUtils: CryptoProvider,
    private storage: Storage,
    private loadingCtrl: LoadingController,
    private sharing: SocialSharing,
    private alertCtrl: AlertController,
    private openpgp: PgpKeyServerProvider,
    private gun: P2pDatabaseGunProvider,
  ) {
    this.loadValuesFromStorage();

  }

  async loadValuesFromStorage() {
    this.privateKey = await this.storage.get("privateKey");
    this.publicKey = await this.storage.get("publicKey");
    this.keywords = await this.storage.get("keywords");
    this.email = await this.storage.get("email");

  }

  generateKeys() {
    if (!this.email) {
      this.createAlert("Blank email address", "Please enter a valid email address to generate key pair");
      return;
    } else {
      this.storage.set("email", this.email);
      if (this.publicKey || this.privateKey) {
        const alert = this.alertCtrl.create({
          title: "Are you sure?",
          subTitle: "You already have keys entered. Do you want to overwrite them?",
          buttons: [{
              text: "No",
              role: "cancel"
            },
            {
              text: "Yes",
              handler: () => {
                this.startKeyGeneration();
              }
            }
          ]
        });

        alert.present();
      } else {
        this.startKeyGeneration();
      }
    }
  }

  private async startKeyGeneration() {
    const keys = await this.openpgp.generateKey("passphrase", this.email);

    this.privateKey = keys.privateKeyArmored;
    this.publicKey = keys.publicKeyArmored;
    this.revocationCertificate = keys.revocationCertificate;
    this.keyid = keys.key.primaryKey.keyid;
  }


  save() {
    if (this.publicKey || this.privateKey) {
      this.storage.set("publicKey", this.publicKey);
      this.storage.set("privateKey", this.privateKey);
      this.storage.set("keyid", this.keyid);
      this.storage.set("revocationCert", this.revocationCertificate);
      this.storage.set("keywords", this.keywords ? this.keywords.trim() : "");
      this.showToast("Successfully saved!");
      this.publishPrivateKey();
    }
    else{
      this.createAlert("No Keys","Please generate the keypair before saving!");
    }
  }

  async publishPublicKey() {
     if (!this.publicKey || !this.privateKey) {
       this.createAlert("No Keypair to Publish","Please generate the keypair before trying to publish!");
     }
    await this.openpgp.publishPubKey(this.publicKey);
    this.showToast("Publc key published");

    const userId = await this.storage.get("userId");
    await this.gun.setEmail(userId, this.email);
    //test if stored in gun
    const email = await this.gun.getEmail(userId);
    await this.publishPrivateKey();
    
  }

  async publishPrivateKey() {
    await this.cryptoUtils.publishPrivateKey(this.privateKey);
  }

  exportPrivateKey() {
    if (this.privateKey.length) {
      this.sharing
        .share(this.privateKey, null, null, null)
        .then(() => console.log("Private key was exported"))
        .catch(() =>
          this.showToast(
            "Sorry! Something went wrong trying to export the private key :("
          )
        );
    } else {
      this.showToast("There is nothing to share.");
    }
  }

  private showToast(message: string) {
    const toast = this.toastCtrl.create({
      message: message,
      position: "bottom",
      duration: 3000
    });
    toast.present();
  }

  private createAlert(title,subtitle){
            const newAlert = this.alertCtrl.create({
          title: title,
          subTitle: subtitle,
          buttons: [{
              text: "No",
              role: "cancel"
            },
            {
              text: "ok",
            }
          ]
        });

        newAlert.present();
        return newAlert;
  }
}
