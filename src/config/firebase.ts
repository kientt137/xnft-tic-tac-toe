import app from './index'

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
    board: Player[] & (Player | null)[]; // Update the type of board
    xIsNext: boolean;
  }

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

  await app.database().ref(`/games/${newGameId}`).set(gameData);

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
  await app.database().ref(`/games/${gameId}`).update(data);
};

export const subscribeToGameChanges = (gameId: string, callback: (data: GameData | null) => void) => {
  const gameRef = app.database().ref(`/games/${gameId}`);
  gameRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      console.log('Received game data from Firebase:', data);
      callback(data as GameData);
    } else {
      console.log('Game data is null.');
      callback(null); // Call the callback with null if data is not available
    }
  });

  return () => gameRef.off('value');
};

export const removeGameListener = (gameId: string) => {
  const gameRef = app.database().ref(`/games/${gameId}`);
  gameRef.off('value');
};
