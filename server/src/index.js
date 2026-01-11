import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  createRoom,
  joinRoom,
  getRoom,
  getRoomByShareId,
  getRoomByPlayerId,
  removePlayer,
  getConnectedPlayers
} from './rooms.js';
import {
  startGame,
  startRound,
  submitHint,
  startVoting,
  submitVote,
  calculateResults,
  imposterGuess,
  nextRound,
  addMessage
} from './game.js';
import { getCategories } from './words.js';

const app = express();
const server = createServer(app);
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/categories', (req, res) => {
  res.json({ categories: getCategories() });
});

app.get('/api/room/:shareId', (req, res) => {
  const room = getRoomByShareId(req.params.shareId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({ code: room.code, state: room.state });
});

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('create-room', ({ playerName, category }, callback) => {
    const room = createRoom(socket.id, playerName);
    if (category) room.category = category;

    socket.join(room.code);

    callback({
      success: true,
      code: room.code,
      shareId: room.shareId,
      playerId: socket.id,
      isHost: true
    });
  });

  socket.on('join-room', ({ code, playerName }, callback) => {
    const result = joinRoom(code, socket.id, playerName);

    if (result.error) {
      return callback({ success: false, error: result.error });
    }

    const room = result.room;
    socket.join(room.code);

    socket.to(room.code).emit('player-joined', {
      players: getConnectedPlayers(room).map(p => ({
        id: p.id,
        name: p.name,
        score: p.score
      }))
    });

    callback({
      success: true,
      code: room.code,
      shareId: room.shareId,
      playerId: socket.id,
      isHost: room.hostId === socket.id,
      players: getConnectedPlayers(room).map(p => ({
        id: p.id,
        name: p.name,
        score: p.score
      })),
      category: room.category
    });
  });

  socket.on('set-category', ({ category }, callback) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room || room.hostId !== socket.id) {
      return callback?.({ success: false, error: 'Not authorized' });
    }

    room.category = category;
    io.to(room.code).emit('category-changed', { category });
    callback?.({ success: true });
  });

  socket.on('start-game', (callback) => {
    const room = getRoomByPlayerId(socket.id);

    if (!room) {
      return callback({ success: false, error: 'Room not found' });
    }

    if (room.hostId !== socket.id) {
      return callback({ success: false, error: 'Only host can start game' });
    }

    const result = startGame(room);

    if (result.error) {
      return callback({ success: false, error: result.error });
    }

    const players = getConnectedPlayers(room);
    players.forEach(player => {
      const playerSocket = io.sockets.sockets.get(player.id);
      if (playerSocket) {
        playerSocket.emit('game-started', {
          isImposter: player.id === room.imposterId,
          word: player.id === room.imposterId ? null : room.currentWord,
          players: players.map(p => ({ id: p.id, name: p.name })),
          currentTurnId: players[0].id,
          round: room.currentRound,
          totalRounds: room.totalRounds,
          category: room.category
        });
      }
    });

    callback({ success: true });
  });

  socket.on('submit-hint', ({ hint }, callback) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room || room.state !== 'hints') {
      return callback?.({ success: false, error: 'Cannot submit hint now' });
    }

    const result = submitHint(room, socket.id, hint);

    if (result.error) {
      return callback?.({ success: false, error: result.error });
    }

    if (result.allHintsComplete) {
      io.to(room.code).emit('all-hints-complete', {
        hints: result.hints
      });
      io.to(room.code).emit('discussion-started', {
        duration: room.settings.discussionTime
      });
    } else {
      io.to(room.code).emit('hint-submitted', {
        playerId: result.hint.playerId,
        playerName: result.hint.playerName,
        hint: result.hint.hint,
        nextPlayerId: result.nextPlayerId
      });
    }

    callback?.({ success: true });
  });

  socket.on('send-message', ({ message }, callback) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room) {
      return callback?.({ success: false, error: 'Room not found' });
    }

    const msg = addMessage(room, socket.id, message);
    if (msg) {
      io.to(room.code).emit('new-message', msg);
    }

    callback?.({ success: true });
  });

  socket.on('start-voting', (callback) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room || room.hostId !== socket.id) {
      return callback?.({ success: false, error: 'Not authorized' });
    }

    startVoting(room);
    io.to(room.code).emit('voting-started', {
      duration: room.settings.voteTime,
      players: getConnectedPlayers(room).map(p => ({ id: p.id, name: p.name }))
    });

    callback?.({ success: true });
  });

  socket.on('submit-vote', ({ votedId }, callback) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room || room.state !== 'voting') {
      return callback?.({ success: false, error: 'Cannot vote now' });
    }

    const result = submitVote(room, socket.id, votedId);

    if (result.error) {
      return callback?.({ success: false, error: result.error });
    }

    io.to(room.code).emit('vote-submitted', {
      voteCount: room.votes.length,
      totalPlayers: getConnectedPlayers(room).length
    });

    if (result.allVotesIn) {
      const results = calculateResults(room);
      io.to(room.code).emit('vote-results', results);
    }

    callback?.({ success: true });
  });

  socket.on('imposter-guess', ({ guess }, callback) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room) {
      return callback?.({ success: false, error: 'Room not found' });
    }

    const result = imposterGuess(room, socket.id, guess);

    if (result.error) {
      return callback?.({ success: false, error: result.error });
    }

    io.to(room.code).emit('imposter-guessed', {
      correct: result.correct,
      guess,
      actualWord: result.actualWord,
      scores: getConnectedPlayers(room).map(p => ({
        id: p.id,
        name: p.name,
        score: p.score
      }))
    });

    callback?.({ success: true, correct: result.correct });
  });

  socket.on('next-round', (callback) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room || room.hostId !== socket.id) {
      return callback?.({ success: false, error: 'Not authorized' });
    }

    const result = nextRound(room);

    if (result.gameOver) {
      io.to(room.code).emit('game-ended', result);
    } else {
      const players = getConnectedPlayers(room);
      players.forEach(player => {
        const playerSocket = io.sockets.sockets.get(player.id);
        if (playerSocket) {
          playerSocket.emit('round-started', {
            isImposter: player.id === room.imposterId,
            word: player.id === room.imposterId ? null : room.currentWord,
            currentTurnId: players[0].id,
            round: room.currentRound,
            totalRounds: room.totalRounds
          });
        }
      });
    }

    callback?.({ success: true });
  });

  socket.on('play-again', (callback) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room || room.hostId !== socket.id) {
      return callback?.({ success: false, error: 'Not authorized' });
    }

    room.state = 'waiting';
    room.currentRound = 0;
    room.players.forEach(p => p.score = 0);

    io.to(room.code).emit('game-reset', {
      players: getConnectedPlayers(room).map(p => ({
        id: p.id,
        name: p.name,
        score: 0
      }))
    });

    callback?.({ success: true });
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    const room = removePlayer(socket.id);

    if (room) {
      io.to(room.code).emit('player-left', {
        playerId: socket.id,
        players: getConnectedPlayers(room).map(p => ({
          id: p.id,
          name: p.name,
          score: p.score
        })),
        newHostId: room.hostId
      });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
