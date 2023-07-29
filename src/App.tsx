import {registerRootComponent} from "expo";

import React, {useEffect, useState} from 'react';
import {StyleSheet, View, Text, TouchableOpacity} from 'react-native';
//import firebase
import {FirebaseApp, initializeApp} from 'firebase/app';
import {getDatabase, onValue, ref, set} from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyDnwGa-J9sxuYX3ruhwxxLSzrspT4RpzrA",
    authDomain: "xnft-tic-tac-toe.firebaseapp.com",
    databaseURL: "https://xnft-tic-tac-toe-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "xnft-tic-tac-toe",
    storageBucket: "xnft-tic-tac-toe.appspot.com",
    messagingSenderId: "106096001346",
    appId: "1:106096001346:web:b5acbd338ab9be9d2b08db"
};
const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

type Player = 'X' | 'O';

const INITIAL_STATE: Player[] = Array(9).fill(null);
// Example of two players
const player1Sample: PlayerModel = {
    id: '1',
    name: 'John',
    mark: 'O',
};

const player2Sample: PlayerModel = {
    id: '2',
    name: 'Jane',
    mark: 'X',
};

const App: React.FC = () => {

    const [board, setBoard] = useState<Player[]>(INITIAL_STATE);
    const [currentTurn, setCurrentTurn] = useState<PlayerModel>(player1Sample);
    const [currentPlayer, setCurrentPlayer] = useState<PlayerModel>(player1Sample);
    const [otherPlayer, setOtherPlayer] = useState<PlayerModel>(player2Sample);
    useEffect(() => {
        // Get the query parameters from the URL
        const queryParams = new URLSearchParams(window.location.search);

        // Check if player1 is set to 'true'
        const isPlayer1 = queryParams.get('player1') === 'true';

        // Set the player objects based on the query parameter values
        setCurrentPlayer(isPlayer1?player1Sample:player2Sample);
        setOtherPlayer(isPlayer1?player2Sample:player1Sample);
    }, []);


    const handleClick = (index: number) => {
        if(currentTurn == currentPlayer){
        if (calculateWinner(board) || board[index]) {
            return;
        }
        const newBoard = [...board];
        newBoard[index] = currentTurn.mark === 'X' ? 'X' : 'O';
        console.log('new board: ' + newBoard);

        set(ref(db, 'hieu_game/' + '1'), JSON.parse( JSON.stringify({
            board: newBoard,
            currentTurn: getNextTurnPlayer(currentTurn, currentPlayer, otherPlayer)
        } ) )).then(r => {
        });
        }

    };

    const renderSquare = (index: number) => {
        return (
            <TouchableOpacity style={styles.square} onPress={() => handleClick(index)}>
                <Text style={styles.squareText}>{board[index]}</Text>
            </TouchableOpacity>
        );
    };

    const resetGame = () => {
        setBoard(INITIAL_STATE);
        setCurrentTurn(player1Sample);
        set(ref(db, 'hieu_game/' + '1'), {
            board: INITIAL_STATE,
            xIsNext: true
        }).then(r => console.log('reset game'));
    };

    const winner = calculateWinner(board);
    const status = winner ? `Winner: ${winner}` : `Next player: ${currentTurn ? 'X' : 'O'}`;
    // listen to changes in firebase db
    useEffect(() => {
        const dbRef = ref(db, 'hieu_game/' + '1');
        onValue(dbRef, (snapshot) => {
                const data = snapshot.val();
                console.log('onValue');

                // check if data != null then set state
                if (data.board != null) {
                    console.log('old board: ' + board);

                    const arr = Array(length).fill(null); // Initialize the array with null values

// Fill the array with values from the object
                    Object.entries(data.board).forEach(([key, value]) => {
                        arr[Number(key)] = value;
                    });
                    setBoard(arr);
                    console.log('new board: ' + arr);

                }
                setCurrentTurn(data.xIsNext);
            }
        )
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.status}>{status}</Text>
            <View style={styles.board}>
                {Array.from({length: 9}).map((_, index) => renderSquare(index))}
            </View>
            {winner && (
                <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
                    <Text style={styles.resetButtonText}>Restart Game</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};
// get next turn player
function getNextTurnPlayer(currentTurn: PlayerModel, player1: PlayerModel, player2: PlayerModel) {
    return currentTurn === player1 ? player2 : player1;
}
// Helper function to calculate the winner
function calculateWinner(board: Player[]) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }

    return null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    board: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 20,
    },
    square: {
        width: 100,
        height: 100,
        borderWidth: 1,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    squareText: {
        fontSize: 36,
    },
    status: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    resetButton: {
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginTop: 20,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 18,
    },
});

// const Tab = createBottomTabNavigator();

// function TabNavigator() {
//   return (
//     <Tab.Navigator
//       initialRouteName="Home"
//       screenOptions={{
//         tabBarActiveTintColor: "#e91e63",
//       }}
//     >
//       <Tab.Screen
//         name="Home"
//         component={HomeScreen}
//         options={{
//           tabBarLabel: "Home",
//           tabBarIcon: ({ color, size }) => (
//             <MaterialCommunityIcons name="account" color={color} size={size} />
//           ),
//         }}
//       />
//       <Tab.Screen
//         name="List"
//         component={TokenListNavigator}
//         options={{
//           headerShown: false,
//           tabBarLabel: "Tokens",
//           tabBarIcon: ({ color, size }) => (
//             <MaterialCommunityIcons name="bank" color={color} size={size} />
//           ),
//         }}
//       />
//       <Tab.Screen
//         name="Examples"
//         component={ExamplesScreens}
//         options={{
//           tabBarLabel: "Examples",
//           tabBarIcon: ({ color, size }) => (
//             <MaterialCommunityIcons name="home" color={color} size={size} />
//           ),
//         }}
//       />
//     </Tab.Navigator>
//   );
// }

// function App() {
//   let [fontsLoaded] = useFonts({
//     Inter_900Black,
//   });

//   if (!fontsLoaded) {
//     return (
//       <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//         <ActivityIndicator />
//       </View>
//     );
//   }

//   return (
//     <RecoilRoot>
//       <NavigationContainer>
//         <TabNavigator />
//       </NavigationContainer>
//     </RecoilRoot>
//   );
// }

export default registerRootComponent(App);

