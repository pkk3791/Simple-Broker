# HybridOSN

HybridOSN is a [Twitter](https://www.twitter.com) client Android app allowing the user to exchange data not only via the official Twitter servers but also via a P2P network to protect his privacy. It is build using the [Ionic framework](https://ionicframework.com). With Ionic framework you can easily develop cross-platform hybrid mobile apps.

You can find a ready to install APK file in the folder _/apk_.

## Development

I highly recommend to develop the app using [Microsoft Visual Studio Code](https://code.visualstudio.com/). I also recommend to use the extensions [Prettier - Code formater](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) to format your code uniformly and [Gitlens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) to manage the git repository. Of course, you need to have git installed.

## Getting Started

- Install [NodeJS](https://nodejs.org/en/) LTS. If you have NodeJS installed on your computer but in a different version, I recommend [Node Version Manager (Windows)](https://github.com/coreybutler/nvm-windows) to handle different NodeJS installations.
- Install Ionic and Cordova globally `npm install -g ionic cordova`
- Clone this repository, change into the directory and install the dependencies `npm i`
- Install JDK
- Install [Android Studio](https://developer.android.com/studio/) and via the SDK Manager Android SDK Platform 26 (Android 8.0.0).

You can test whether everything was installed correctly by executing `ionic info` and `cordova requirements`.

## Build the App

- Run on Android emulator: `ionic cordova emulate android`
- Run on connected Android device: `ionic cordova run android`
- Publish the APK: `ionic cordova build --release android`

You may read in the Ionic docs, that you can view your app in the browser using `ionic serve`. **This doesn't work** because of the used Cordova plugins which force you to run the app on an Android device. As mentioned in the beginning, using Ionic cross-plattform applications can be developed. This still is valid, but since the goal was to develop an Android app, no time was spent on trying to remove this current restriction.

### Signing of the APK File

> Android requires that all APKs be digitally signed with a certificate before they are installed on a device or updated.
> [Sign your app | Android Developers](https://developer.android.com/studio/publish/app-signing)

By default the APK built by Ionic/Cordova is not signed. To sign the APK, a tool called [APK Signer](https://shatter-box.com/knowledgebase/android-apk-signing-tool-apk-signer/) is used best. Using this tool, signing the APK file is pretty straight forward.

For security reasons I don't want to share the keystore and passwords in this repository. Please write me an email and ask for them.

## Debugging

If you want to debug the app, you can do so by using the Google Chrome Developer Tools. After deploying the app on your device using the `ionic cordova run android`-command, open Google Chrome on the computer your device is connected to and press the F12-key to open the Developer Tools. Go to the tab "Remote devices" (maybe it is hidden and you need to press ESC to show it). Now you should see your connected device on the left and when selecting it the HybridOSN app. With a click on the button "Inspect" you can inspect and debug the app.

## Known Problems

In case the build process fails with the error:

```
Execution failed for task ':app:transformDexArchiveWithExternalLibsDexMergerForDebug'.
```

Run `cordova clean` to fix this problem. It appears randomly from time to time.
