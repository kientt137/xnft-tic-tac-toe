import app from './index';
import { nanoid } from 'nanoid/non-secure';

export type Player = 'X' | 'O';

export interface PlayerData {
  id: string;
  name: string;
  mark: Player;
}

export interface GameData {
  id: string;
  players: PlayerData[];
  board: Player[]; // Update the type of board to remove (Player | null)
  xIsNext: boolean;
}

// Serialize the board array before saving to Firebase
const serializeBoard = (board: Player[]): string[] => {
  return board.map((cell) => cell);
};

// Deserialize the board array after fetching from Firebase
const deserializeBoard = (serializedBoard?: { [key: string]: Player }): Player[] => {
  if (serializedBoard) {
    const boardArray: Player[] = Array(9).fill(null);
    Object.entries(serializedBoard).forEach(([key, value]) => {
      const index = parseInt(key, 10);
      if (!isNaN(index) && index >= 0 && index < 9) {
        boardArray[index] = value;
      }
    });
    return boardArray;
  }
  return Array(9).fill(null);
};

export const createGame = async (name: string): Promise<GameData> => {
  const newGameId = nanoid(8);
  const playerData: PlayerData = {
    id: nanoid(8),
    name,
    mark: 'X',
  };

  const gameData: GameData = {
    id: newGameId,
    players: [playerData],
    board: Array(9).fill(null),
    xIsNext: true,
  };

  await app.database().ref(`/games/${newGameId}`).set({
    ...gameData,
    board: serializeBoard(gameData.board),
  });

  return gameData;
};


export const joinGame = async (gameId: string, name: string): Promise<GameData> => {
  const snapshot = await app.database().ref(`/games/${gameId}`).once('value');
  const gameData = snapshot.val();

  if (!gameData) {
    throw new Error('Game not found');
  }

  if (gameData.players.length >= 2) {
    throw new Error('Game is already full');
  }

  const playerData: PlayerData = {
    id: nanoid(8),
    name,
    mark: gameData.players.length === 0 ? 'X' : 'O',
  };

  gameData.players.push(playerData);

  await app.database().ref(`/games/${gameId}`).set(gameData);

  return gameData;
};

export const updateGame = async (gameId: string, data: Partial<GameData>) => {
  await app.database().ref(`/games/${gameId}`).update({
    ...data,
    board: data.board ? serializeBoard(data.board) : null, // Only serialize the board if it exists
  });
};

export const subscribeToGameChanges = (gameId: string, callback: (data: GameData | null) => void) => {
  const gameRef = app.database().ref(`/games/${gameId}`);
  gameRef.on(
    'value',
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const deserializedGameData: GameData = {
          ...data,
          board: deserializeBoard(data.board),
        };
        callback(deserializedGameData);
      } else {
        callback(null); // Call the callback with null if data is not available
      }
    },
    (error) => {
      console.error('Error fetching game data:', error);
      callback(null); // Call the callback with null in case of an error
    }
  );

  return () => gameRef.off('value');
};

export const removeGameListener = (gameId: string) => {
  const gameRef = app.database().ref(`/games/${gameId}`);
  gameRef.off('value');
};
