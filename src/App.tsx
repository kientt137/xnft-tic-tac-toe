import { registerRootComponent } from "expo";

import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

type Player = 'X' | 'O';

const INITIAL_STATE: Player[] = Array(9).fill(null);

const App: React.FC = () => {
  const [board, setBoard] = useState<Player[]>(INITIAL_STATE);
  const [xIsNext, setXIsNext] = useState(true);

  const handleClick = (index: number) => {
    if (calculateWinner(board) || board[index]) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = xIsNext ? 'X' : 'O';

    setBoard(newBoard);
    setXIsNext(!xIsNext);
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
    setXIsNext(true);
  };

  const winner = calculateWinner(board);
  const status = winner ? winner : `Player ${xIsNext ? 'X' : 'O'} is move`;

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{status}</Text>
      <View style={styles.container_board}>
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
      {winner && (
        <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
          <Text style={styles.resetButtonText}>Restart Game</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

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
      return `The winner is ${board[a]}`;
    }
  }

  var isFull = true
  for(const item of board) {
    if(item == null) {
      isFull = false
    }
  }
  if (isFull) {
    return "The game ends in a tie"
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
  container_board: {
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  square: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  squareText: {
    fontSize: 50,
  },
  status: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
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
