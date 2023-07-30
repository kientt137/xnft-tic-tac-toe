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
      setError('Please enter room ID');
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
      <Text style={styles.title}>Hi, {name}</Text>
      <Text style={styles.space} />
      <TouchableOpacity style={styles.button} onPress={handleCreateGame}>
        <Text style={styles.buttonText}>Create Game</Text>
      </TouchableOpacity>
      <Text style={styles.status}>or</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={gameId}
          onChangeText={setGameId}
          placeholder="Input room ID"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleJoinGame}>
          <Text style={styles.buttonText}>Join Game</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.error}>{error}</Text>
    </View>
  );
};

const GameScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { gameId, playerMark } = route.params;
  const [gameData, setGameData] = useState<GameData | null>(null);

  const isPlayerTurn = gameData && (gameData.xIsNext ? playerMark === 'X' : playerMark === 'O');

  let winner: Player | null | String = null;
  if (gameData && gameData.board) {
    winner = calculateWinner(gameData.board);
  }
  let status: string;
  if (winner) {
    if (winner == "TIE") {
      status = 'The game ends in a tie'
    } else {
      status = winner === playerMark ? 'You Win!' : 'You Lose!';
    };
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

  function calculateWinner(board: Player[]): Player | null | String {
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
    var isFull = true
    for (const item of board) {
      if (item == null) {
        isFull = false
      }
    }
    if (isFull) {
      return 'TIE'
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

  const renderCell = (index: number) => {
    if (gameData.board[index] == "X") {
      return (<Text style={styles.boardCellText_X}>{renderCellText(gameData.board[index])}</Text>);
    } else if (gameData.board[index] == "O") {
      return (<Text style={styles.boardCellText_O}>{renderCellText(gameData.board[index])}</Text>);
    } else {
      return (<Text style={styles.boardCellText_X}>{renderCellText(gameData.board[index])}</Text>);
    }
  }

  const renderSquare = (index: number) => {
    return (
      <TouchableOpacity
        key={index}
        style={styles.boardCell}
        onPress={() => handleSquareClick(index)}
        disabled={!!gameData.board[index] || !!calculateWinner(gameData.board)}
      >
        {renderCell(index)}
      </TouchableOpacity>
    );
  };

  const renderStatus = () => {
    if (status == 'You Win!') {
      return (
        <Text style={styles.status_win}>{status}</Text>
      );
    } else if (status == 'You Lose!') {
      return (
        <Text style={styles.status_lose}>{status}</Text>
      );
    } else {
      return (
        <Text style={styles.status}>{status}</Text>
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.content}>Room ID: {gameData.id}</Text>
      {
        gameData.players.length == 2 ??
        (
          <Text style={styles.content}>{gameData.players[0].name} vs {gameData.players[1].name}</Text>
        )
      }
      <View style={styles.boardContainer}>
        <View style={styles.board}>
          {Array.from({ length: 3 }).map((_, index) => renderSquare(index))}
        </View>
        <View style={styles.board}>
          {Array.from({ length: 3 }).map((_, index) => renderSquare(index + 3))}
        </View>
        <View style={styles.board}>
          {Array.from({ length: 3 }).map((_, index) => renderSquare(index + 6))}
        </View>
      </View>
      {renderStatus()}
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
  space: {
    marginTop: 10,
    marginBottom: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  content: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
  },
  status_win: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: 'blue',
  },
  status_lose: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: 'red',
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
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
    marginStart: 20
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 20,
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
    fontSize: 18,
  },
  boardContainer: {
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  boardCell: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boardCellText: {
    fontSize: 48,
  },
  boardCellText_X: {
    fontSize: 48,
    color: 'green'
  },
  boardCellText_O: {
    fontSize: 48,
    color: 'red'
  },
});

export default registerRootComponent(App);
