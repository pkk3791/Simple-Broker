import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Storage } from "@ionic/storage";
import firebase from "firebase";
import { TwitterApiProvider } from "../twitter-api/twitter-api";
import { PgpKeyServerProvider } from "../../providers/pgp-key-server/pgp-key-server";

@Injectable()
export class AuthProvider {
  authProvider: any;
  constructor(
    public http: HttpClient,
    private storage: Storage,
    private twitter: TwitterApiProvider,
     private openpgp: PgpKeyServerProvider
  ) {
    const config = {
      apiKey: "AIzaSyDRb5IVPCjdKld_5ubsGuP9tEPTRG0kgQ4",
      authDomain: "twitter-hosn.firebaseapp.com",
      databaseURL: "https://twitter-hosn.firebaseio.com",
      projectId: "twitter-hosn",
      storageBucket: "twitter-hosn.appspot.com",
      messagingSenderId: "502393136960",
      appId: "1:502393136960:web:886faa1155c38a37087ca5",
      measurementId: "G-XPXJQF3LWV"
    };
    firebase.initializeApp(config);
    this.authProvider = new firebase.auth.TwitterAuthProvider();
    this.authProvider.setCustomParameters({
      lang: "de"
    });

  }

  /**
   * Performs the login to Twitter
   */
  login() {
    return firebase
      .auth()
      .signInWithRedirect(this.authProvider)
      .then(() => firebase.auth().getRedirectResult())
      .then(this.setKeys)
      .then(() => this.twitter.initApi());

  }

  getCurrentUser(){
    return firebase.auth().currentUser;
  }

  /**
   * Logs the user out by deleting session data
   */
  logout() {
     this.storage.clear();
     this.openpgp.clearStoredKeys();
     firebase.auth().signOut().then(function() {
  // Sign-out successful.
    console.log("user signed out successful");

    }, function(error) {
      // An error happened.
        console.log("UNABLE TO sign user out:",error);
    });
    
 
  }

  /**
   * Checks if a user is currently logged in
   */
  async isLoggedIn() {
    let accessToken = await this.storage.get("accessTokenKey");
    let accessTokenKey = await this.storage.get("accessTokenSecret");
    console.log("userid is:",this.storage.get( "userId"));
    return accessToken && accessTokenKey;
  }

  /**
   * Saves acces token and user id to locale storage
   */
  setKeys = async result => {
    console.log("SETTING KEYS HERE NOW",result);
    await this.storage.set(
      "accessTokenKey",
      result["credential"]["accessToken"]
    );
    await this.storage.set("accessTokenSecret", result["credential"]["secret"]);
    await this.storage.set(
      "userId",
      result["additionalUserInfo"]["profile"]["id_str"]
    );
  };
}
