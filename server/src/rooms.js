import { nanoid } from 'nanoid';

const rooms = new Map();
const playerToRoom = new Map();

export function createRoom(hostId, hostName) {
  const code = nanoid(6).toUpperCase();
  const shareId = nanoid(10);

  const room = {
    code,
    shareId,
    hostId,
    players: [{
      id: hostId,
      name: hostName,
      score: 0,
      connected: true
    }],
    state: 'waiting',
    currentRound: 0,
    totalRounds: 5,
    currentWord: null,
    imposterId: null,
    currentTurnIndex: 0,
    hints: [],
    votes: [],
    messages: [],
    category: 'animals',
    settings: {
      hintTime: 15,
      discussionTime: 60,
      voteTime: 30
    }
  };

  rooms.set(code, room);
  rooms.set(shareId, room);
  playerToRoom.set(hostId, code);

  return room;
}

export function joinRoom(code, playerId, playerName) {
  const room = rooms.get(code) || rooms.get(code.toUpperCase());

  if (!room) {
    return { error: 'Room not found' };
  }

  if (room.state !== 'waiting') {
    return { error: 'Game already in progress' };
  }

  const existingPlayer = room.players.find(p => p.id === playerId);
  if (existingPlayer) {
    existingPlayer.connected = true;
    existingPlayer.name = playerName;
  } else {
    room.players.push({
      id: playerId,
      name: playerName,
      score: 0,
      connected: true
    });
  }

  playerToRoom.set(playerId, room.code);
  return { room };
}

export function getRoom(code) {
  return rooms.get(code) || rooms.get(code?.toUpperCase());
}

export function getRoomByShareId(shareId) {
  return rooms.get(shareId);
}

export function getRoomByPlayerId(playerId) {
  const code = playerToRoom.get(playerId);
  return code ? rooms.get(code) : null;
}

export function removePlayer(playerId) {
  const room = getRoomByPlayerId(playerId);
  if (!room) return null;

  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.connected = false;
  }

  playerToRoom.delete(playerId);

  const connectedPlayers = room.players.filter(p => p.connected);
  if (connectedPlayers.length === 0) {
    rooms.delete(room.code);
    rooms.delete(room.shareId);
    return null;
  }

  if (room.hostId === playerId && connectedPlayers.length > 0) {
    room.hostId = connectedPlayers[0].id;
  }

  return room;
}

export function updateRoom(code, updates) {
  const room = getRoom(code);
  if (!room) return null;

  Object.assign(room, updates);
  return room;
}

export function getConnectedPlayers(room) {
  return room.players.filter(p => p.connected);
}
