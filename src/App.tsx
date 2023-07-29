import { registerRootComponent } from "expo";

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createGame, joinGame, subscribeToGameChanges, updateGame, removeGameListener, GameData, Player } from './config/firebase';

const INITIAL_STATE: Player[] = Array(9).fill(null);

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [gameId, setGameId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string>(''); // Set the initial state as an empty string

  const handleCreateGame = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      const gameData = await createGame(name);
      navigation.navigate('Game', { gameId: gameData.id, playerMark: 'X' });
    } catch (error) {
      setError(error.message as string); // Use type assertion here
    }
  };

  const handleJoinGame = async () => {
    if (!name.trim() || !gameId.trim()) {
      setError('Please enter your name and game ID');
      return;
    }

    try {
      const gameData = await joinGame(gameId, name);
      const playerMark = gameData.players.length === 1 ? 'O' : 'X';
      navigation.navigate('Game', { gameId: gameData.id, playerMark });
    } catch (error) {
      setError(error.message as string); // Use type assertion here
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tic-Tac-Toe Multiplayer</Text>
      <Text style={styles.error}>{error}</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Enter Your Name:</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your Name"
          autoCapitalize="none"
        />
      </View>
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
  

  if (!gameData) {
    return (
      <View style={styles.container}>
        <Text style={styles.status}>Loading...</Text>
      </View>
    );
  }

  // Now, the Tic-Tac-Toe board will only be rendered if the gameData is available.
  const { players, board, xIsNext } = gameData;
  const winner = calculateWinner(board);
  const status = winner ? `Winner: ${winner}` : `Next player: ${xIsNext ? 'X' : 'O'}`;

  return (
    <View>
      <Text>Tic-Tac-Toe Game</Text>
      {/* Render the board here */}
      <View style={styles.boardContainer}>
        {gameData.board.map((mark, index) => (
          <TouchableOpacity
            key={index}
            style={styles.boardCell}
            onPress={() => handleSquareClick(index)}
            disabled={!!mark || !!calculateWinner(gameData.board)}
          >
            <Text style={styles.boardCellText}>{mark}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  status: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
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

export default registerRootComponent(App);
