import { registerRootComponent } from "expo";

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createGame, joinGame, subscribeToGameChanges, updateGame, removeGameListener, GameData, Player } from './config/firebase';
import { usePublicKeys, useSolanaConnection } from "./hooks/xnft-hooks";
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import axios, { AxiosRequestConfig } from 'axios';

const abc :string = "4QMM9fYDDidp7LP9SzDtDZYvCazH4eahFhxLULAvyqFC";

const INITIAL_STATE: Player[] = Array(9).fill(null);

interface User {
  id: string;
  username: string;
}

interface APIResponse {
  user: User;
}

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [gameId, setGameId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [nft, setNFT] = useState<string>();
  const [error, setError] = useState<string>(''); // Set the initial state as an empty string
  const pks: any = usePublicKeys()
  let pk = pks ? new PublicKey(pks?.solana) : undefined

  useEffect(() => {
        if(nft != abc){
            setError("You don't have required NFT!");
        }else{
            setError(null);
        }
     }, [nft]);
     useEffect(() => {
        if(pk) {
       fetchData1();
       fetchData2();
       }
     }, [pk]);

     const fetchData1 = async () => {
         try {
           const response = await axios.get( "https://api.shyft.to/sol/v1/wallet/collections?network=devnet&wallet_address=" + pk?.toBase58(), {
             headers: {
               'Content-Type': 'application/json', // Add your custom headers here
               'x-api-key': 'sWutk90MOMuQwvRJ',
             },
           });
           setNFT(response.data.result.collections[0].nfts[0].creators[0].address);
         } catch (error) {
         }
       };

       const fetchData2 = async () => {
           try {
                      const response = await axios.get( "https://xnft-api-server.xnfts.dev/v1/users/fromPubkey?blockchain=solana&publicKey=" + pk?.toBase58(), {
                        headers: {
                          'Content-Type': 'application/json', // Add your custom headers here
                        },
                      });
                      setName(response.data.user.username);
                    } catch (error) {
                    }
         };

  const handleCreateGame = async () => {

    try {
      const gameData = await createGame(name);
      navigation.navigate('Game', { gameId: gameData.id, playerMark: 'X' });
    } catch (error) {
      setError(error.message as string); // Use type assertion here
    }
  };

  const handleJoinGame = async () => {
    if (!name.trim() || !gameId.trim()) {
      setError('Please enter game ID');
      return;
    }

    try {
      const gameData = await joinGame(gameId, name);
      const playerMark = 'O';
      navigation.navigate('Game', { gameId: gameData.id, playerMark });
    } catch (error) {
      setError(error.message as string); // Use type assertion here
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tic-Tac-Toe Multiplayer</Text>
      <Text style={styles.error}>{error}</Text>
     <Text style={styles.label}>Name: {name}</Text>
      <TouchableOpacity style={styles.button} onPress={handleCreateGame}>
        <Text style={styles.buttonText}>Create Game</Text>
      </TouchableOpacity>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Enter Game ID:</Text>
        <TextInput
          style={styles.input}
          value={gameId}
          onChangeText={setGameId}
          placeholder="Game ID"
          autoCapitalize="none"
        />
      </View>
      <TouchableOpacity style={styles.button} onPress={handleJoinGame}>
        <Text style={styles.buttonText}>Join Game</Text>
      </TouchableOpacity>
    </View>
  );
};

const GameScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { gameId, playerMark } = route.params;
  const [gameData, setGameData] = useState<GameData | null>(null);

  const isPlayerTurn = gameData && (gameData.xIsNext ? playerMark === 'X' : playerMark === 'O');

  let winner: Player | null = null;
  if (gameData && gameData.board) {
    winner = calculateWinner(gameData.board);
  }
  let status: string;
  if (winner) {
    status = winner === playerMark ? 'You Win!' : 'You Lose!';
  } else {
    status = isPlayerTurn ? 'Your Turn' : 'Please Wait';
  }

  if (gameData && gameData.players.length === 1) {
    status = "Wait for other player to join";
  }

  useEffect(() => {
    const unsubscribe = subscribeToGameChanges(gameId, (data) => {
      setGameData(data);
    });

    return () => {
      unsubscribe();
      removeGameListener(gameId);
    };
  }, [gameId]);

  console.log('Rendering GameScreen with gameData:', gameData);

  if (!gameData || !gameData.board) {
    return <Text>Loading...</Text>; // or any other loading indicator you prefer
  }

  const handleSquareClick = (index: number) => {
    if (!gameData || gameData.board[index] || calculateWinner(gameData.board)) {
      return;
    }

    if (playerMark !== 'X' && gameData.xIsNext) {
      // Player can only play if it's their turn
      return;
    }

    if (gameData && gameData.players.length === 1) {
      return;
    }

    const newBoard = [...gameData.board];
    newBoard[index] = playerMark;

    updateGame(gameId, {
      board: newBoard,
      xIsNext: !gameData.xIsNext,
    });
  };

  function calculateWinner(board: Player[]): Player | null {
    if (!Array.isArray(board) || board.length !== 9) {
      return null; // Invalid board, cannot determine the winner
    }

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

    return null; // No winner
  }


  const renderCellText = (mark: Player | null) => {
    if (mark === null) {
      return ''; // Display an empty string for null cells
    } else {
      return mark;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tic-Tac-Toe Game</Text>
      <Text sytle={styles.title}>Room ID: {gameData.id}</Text>
      <View style={styles.boardContainer}>
        {gameData.board.map((mark, index) => (
          <TouchableOpacity
            key={index}
            style={styles.boardCell}
            onPress={() => handleSquareClick(index)}
            disabled={!!mark || !!calculateWinner(gameData.board)}
          >
            <Text style={styles.boardCellText}>{renderCellText(mark)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text>{status}</Text>
    </View>
  );
};
const Stack = createStackNavigator();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Tic-Tac-Toe Multiplayer' }} />
        <Stack.Screen name="Game" component={GameScreen} options={{ title: 'Tic-Tac-Toe Game' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    width: 150,
  },
  boardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
  },
  boardCell: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boardCellText: {
    fontSize: 36,
  },
});

export default registerRootComponent(App);
