import { getRandomWord } from './words.js';
import { getConnectedPlayers, updateRoom } from './rooms.js';

export function startGame(room) {
  const players = getConnectedPlayers(room);

  if (players.length < 3) {
    return { error: 'Need at least 3 players to start' };
  }

  room.currentRound = 1;
  room.players.forEach(p => p.score = 0);

  return startRound(room);
}

export function startRound(room) {
  const players = getConnectedPlayers(room);

  const imposterIndex = Math.floor(Math.random() * players.length);
  const imposter = players[imposterIndex];

  const word = getRandomWord(room.category);

  room.state = 'hints';
  room.currentWord = word;
  room.imposterId = imposter.id;
  room.currentTurnIndex = 0;
  room.hints = [];
  room.votes = [];
  room.messages = [];

  return {
    word,
    imposterId: imposter.id,
    players: players.map(p => ({
      id: p.id,
      name: p.name,
      isImposter: p.id === imposter.id
    }))
  };
}

export function submitHint(room, playerId, hint) {
  const players = getConnectedPlayers(room);
  const currentPlayer = players[room.currentTurnIndex];

  if (currentPlayer.id !== playerId) {
    return { error: 'Not your turn' };
  }

  room.hints.push({
    playerId,
    playerName: currentPlayer.name,
    hint: hint.trim()
  });

  room.currentTurnIndex++;

  if (room.currentTurnIndex >= players.length) {
    room.state = 'discussion';
    return { allHintsComplete: true, hints: room.hints };
  }

  return {
    hint: { playerId, playerName: currentPlayer.name, hint: hint.trim() },
    nextPlayerId: players[room.currentTurnIndex].id
  };
}

export function startVoting(room) {
  room.state = 'voting';
  room.votes = [];
  return { state: 'voting' };
}

export function submitVote(room, voterId, votedId) {
  const existingVote = room.votes.find(v => v.voterId === voterId);
  if (existingVote) {
    return { error: 'Already voted' };
  }

  const players = getConnectedPlayers(room);
  const votedPlayer = players.find(p => p.id === votedId);

  if (!votedPlayer) {
    return { error: 'Invalid player' };
  }

  room.votes.push({ voterId, votedId });

  if (room.votes.length >= players.length) {
    return { allVotesIn: true };
  }

  return { voteCount: room.votes.length, totalPlayers: players.length };
}

export function calculateResults(room) {
  const players = getConnectedPlayers(room);
  const voteCounts = {};

  room.votes.forEach(v => {
    voteCounts[v.votedId] = (voteCounts[v.votedId] || 0) + 1;
  });

  let maxVotes = 0;
  let votedOut = null;

  Object.entries(voteCounts).forEach(([playerId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      votedOut = playerId;
    }
  });

  const imposterCaught = votedOut === room.imposterId;

  players.forEach(p => {
    if (p.id === room.imposterId) {
      if (!imposterCaught) {
        p.score += 15;
      }
    } else {
      const vote = room.votes.find(v => v.voterId === p.id);
      if (vote && vote.votedId === room.imposterId) {
        p.score += 10;
      }
    }
  });

  room.state = 'reveal';

  return {
    voteCounts,
    votedOut,
    imposterId: room.imposterId,
    imposterName: players.find(p => p.id === room.imposterId)?.name,
    imposterCaught,
    word: room.currentWord,
    scores: players.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score
    }))
  };
}

export function imposterGuess(room, playerId, guess) {
  if (playerId !== room.imposterId) {
    return { error: 'Only the imposter can guess' };
  }

  const correct = guess.toLowerCase().trim() === room.currentWord.toLowerCase();

  if (correct) {
    const imposter = room.players.find(p => p.id === room.imposterId);
    if (imposter) {
      imposter.score += 25;
    }
  }

  return { correct, actualWord: room.currentWord };
}

export function nextRound(room) {
  if (room.currentRound >= room.totalRounds) {
    return endGame(room);
  }

  room.currentRound++;
  return { ...startRound(room), round: room.currentRound };
}

export function endGame(room) {
  room.state = 'ended';

  const players = getConnectedPlayers(room);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return {
    gameOver: true,
    finalScores: sortedPlayers.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score
    })),
    winner: sortedPlayers[0]
  };
}

export function addMessage(room, playerId, message) {
  const player = room.players.find(p => p.id === playerId);
  if (!player) return null;

  const msg = {
    id: Date.now(),
    playerId,
    playerName: player.name,
    message: message.trim(),
    timestamp: Date.now()
  };

  room.messages.push(msg);
  return msg;
}
