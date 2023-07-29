import firebase from 'firebase/app'
import 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyDnwGa-J9sxuYX3ruhwxxLSzrspT4RpzrA",
  authDomain: "xnft-tic-tac-toe.firebaseapp.com",
  databaseURL: "https://xnft-tic-tac-toe-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "xnft-tic-tac-toe",
  storageBucket: "xnft-tic-tac-toe.appspot.com",
  messagingSenderId: "106096001346",
  appId: "1:106096001346:web:b5acbd338ab9be9d2b08db"
}

export default !firebase.apps.length
  ? firebase.initializeApp(firebaseConfig)
  : firebase.app()

