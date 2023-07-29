# xnft-quickstart

Quickstart repo for building your own xNFT.

## Developing

Once you've installed Backpack, get started building your xNFT with these steps. Note that the packages here will always use the latest, which correspond to the latest tagged build of Backpack. If you have unexepected issues, make sure your package versions match the app version.

Further documentation: https://docs.xnfts.dev/getting-started/introduction

### Install

First, install dependencies.

```
yarn
```

### Run the dev server

Then, run the dev server with hot reloading

```
yarn dev
```

### Open the Simulator in Backpack

Now that you have your xNFT dev server running, open it in the Backpack simulator to see it run.

That's it!


## Build & Publish

Once you're done and ready to publish, build your xNFT:

```
yarn build
```

Test the newly created build in `dist/index.html` in the simulator:

```
yarn start
```

Once everything looks good head over to [xnft.gg](https://www.xnft.gg) to publish your xNFT!

npx react-native set-env FIREBASE_API_KEY "AIzaSyDnwGa-J9sxuYX3ruhwxxLSzrspT4RpzrA"
npx react-native set-env FIREBASE_AUTH_DOMAIN "xnft-tic-tac-toe.firebaseapp.com"
npx react-native set-env FIREBASE_DATABASE_URL "https://xnft-tic-tac-toe-default-rtdb.asia-southeast1.firebasedatabase.app"
npx react-native set-env FIREBASE_PROJECT_ID "xnft-tic-tac-toe"
npx react-native set-env FIREBASE_STORAGE_BUCKET "xnft-tic-tac-toe.appspot.com"
npx react-native set-env FIREBASE_MESSAGING_SENDER_ID "106096001346"
npx react-native set-env FIREBASE_APP_ID "1:106096001346:web:b5acbd338ab9be9d2b08db"
