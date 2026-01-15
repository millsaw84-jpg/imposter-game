import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export default function Game({ socket }) {
  const { gameState, updateState } = useGame();
  const navigate = useNavigate();
  const [hint, setHint] = useState('');
  const [message, setMessage] = useState('');
  const [selectedVote, setSelectedVote] = useState(null);
  const [imposterGuess, setImposterGuess] = useState('');
  const [timer, setTimer] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!gameState.roomCode) {
      navigate('/');
    }
  }, [gameState.roomCode, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.messages]);

  const isMyTurn = gameState.currentTurnId === gameState.playerId;
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentTurnId);

  const submitHint = () => {
    if (!hint.trim()) return;
    socket.emit('submit-hint', { hint: hint.trim() });
    setHint('');
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    socket.emit('send-message', { message: message.trim() });
    setMessage('');
  };

  const startVoting = () => {
    socket.emit('start-voting');
  };

  const submitVote = () => {
    if (!selectedVote) return;
    socket.emit('submit-vote', { votedId: selectedVote });
  };

  const submitImposterGuess = () => {
    if (!imposterGuess.trim()) return;
    socket.emit('imposter-guess', { guess: imposterGuess.trim() });
    setImposterGuess('');
  };

  const nextRound = () => {
    socket.emit('next-round');
  };

  const playAgain = () => {
    socket.emit('play-again');
  };

  // Hints phase
  if (gameState.state === 'playing') {
    return (
      <div className="flex flex-col min-h-screen p-4">
        <Header gameState={gameState} />

        <div className="flex-1 max-w-2xl mx-auto w-full">
          {/* Role reveal */}
          <div className={`text-center p-6 rounded-xl mb-6 ${
            gameState.isImposter
              ? 'bg-red-600/30 border-2 border-red-500'
              : 'bg-green-600/30 border-2 border-green-500'
          }`}>
            {gameState.isImposter ? (
              <>
                <h2 className="text-2xl font-bold text-red-400 mb-2">You are the IMPOSTER!</h2>
                <p className="text-gray-300">Try to blend in without knowing the word</p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-green-400 mb-2">The word is:</h2>
                <p className="text-4xl font-bold text-white">{gameState.word}</p>
              </>
            )}
          </div>

          {/* Hints list */}
          <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
            <h3 className="font-semibold mb-3 text-gray-300">Hints</h3>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {gameState.hints.map((h, i) => (
                <div key={i} className="flex gap-2 p-2 bg-gray-700/50 rounded">
                  <span className="text-purple-400 font-medium">{h.playerName}:</span>
                  <span>{h.hint}</span>
                </div>
              ))}
              {gameState.hints.length === 0 && (
                <p className="text-gray-500 text-center py-4">No hints yet</p>
              )}
            </div>

            {/* Current turn */}
            {isMyTurn ? (
              <div className="space-y-3">
                <p className="text-center text-yellow-400 font-medium">Your turn! Give a one-word hint</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hint}
                    onChange={(e) => setHint(e.target.value)}
                    placeholder="Enter your hint..."
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    maxLength={30}
                    onKeyDown={(e) => e.key === 'Enter' && submitHint()}
                  />
                  <button
                    onClick={submitHint}
                    disabled={!hint.trim()}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium disabled:opacity-50"
                  >
                    Submit
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-400">
                Waiting for <span className="text-white font-medium">{currentPlayer?.name}</span> to give a hint...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Discussion phase
  if (gameState.state === 'discussion') {
    return (
      <div className="flex flex-col min-h-screen p-4">
        <Header gameState={gameState} />

        <div className="flex-1 max-w-2xl mx-auto w-full flex flex-col">
          {/* All hints summary */}
          <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
            <h3 className="font-semibold mb-3 text-gray-300">All Hints</h3>
            <div className="grid grid-cols-2 gap-2">
              {gameState.hints.map((h, i) => (
                <div key={i} className="p-2 bg-gray-700/50 rounded text-sm">
                  <span className="text-purple-400">{h.playerName}:</span> {h.hint}
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 bg-gray-800/50 rounded-xl p-4 mb-4 flex flex-col min-h-[300px]">
            <h3 className="font-semibold mb-3 text-gray-300">Discussion</h3>
            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
              {gameState.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded ${
                    msg.playerId === gameState.playerId
                      ? 'bg-purple-600/30 ml-8'
                      : 'bg-gray-700/50 mr-8'
                  }`}
                >
                  <span className="text-purple-400 text-sm font-medium">{msg.playerName}</span>
                  <p>{msg.message}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>

          {gameState.isHost && (
            <button
              onClick={startVoting}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-xl font-bold"
            >
              Start Voting
            </button>
          )}
        </div>
      </div>
    );
  }

  // Voting phase
  if (gameState.state === 'voting') {
    return (
      <div className="flex flex-col min-h-screen p-4">
        <Header gameState={gameState} />

        <div className="flex-1 max-w-lg mx-auto w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Who is the Imposter?</h2>
            <p className="text-gray-400">Vote for who you think is faking it</p>
          </div>

          <div className="space-y-3 mb-6">
            {gameState.players
              .filter(p => p.id !== gameState.playerId)
              .map(player => (
                <button
                  key={player.id}
                  onClick={() => setSelectedVote(player.id)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedVote === player.id
                      ? 'bg-red-600/50 border-2 border-red-500'
                      : 'bg-gray-700/50 hover:bg-gray-600/50 border-2 border-transparent'
                  }`}
                >
                  <span className="font-medium">{player.name}</span>
                </button>
              ))}
          </div>

          <button
            onClick={submitVote}
            disabled={!selectedVote}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 rounded-xl font-bold disabled:opacity-50"
          >
            Confirm Vote
          </button>

          {gameState.voteCount !== undefined && (
            <p className="text-center mt-4 text-gray-400">
              Votes: {gameState.voteCount} / {gameState.totalPlayers}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Reveal phase
  if (gameState.state === 'reveal') {
    const results = gameState.voteResults;

    return (
      <div className="flex flex-col min-h-screen p-4">
        <Header gameState={gameState} />

        <div className="flex-1 max-w-lg mx-auto w-full">
          <div className={`text-center p-6 rounded-xl mb-6 ${
            results.imposterCaught
              ? 'bg-green-600/30 border-2 border-green-500'
              : 'bg-red-600/30 border-2 border-red-500'
          }`}>
            <h2 className="text-2xl font-bold mb-2">
              {results.imposterCaught ? 'Imposter Caught!' : 'Imposter Got Away!'}
            </h2>
            <p className="text-xl mb-4">
              {results.imposterNames?.length > 1 ? 'The imposters were: ' : 'The imposter was: '}
              <span className="font-bold text-purple-400">
                {results.imposterNames?.join(', ') || results.imposterName}
              </span>
            </p>
            <p className="text-lg">
              The word was: <span className="font-bold">{results.word}</span>
            </p>
          </div>

          {/* Imposter guess option */}
          {results.imposterCaught && gameState.isImposter && !gameState.imposterGuessResult && (
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold mb-3">Guess the word for bonus points!</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imposterGuess}
                  onChange={(e) => setImposterGuess(e.target.value)}
                  placeholder="What was the word?"
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                />
                <button
                  onClick={submitImposterGuess}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg"
                >
                  Guess
                </button>
              </div>
            </div>
          )}

          {gameState.imposterGuessResult && (
            <div className={`text-center p-4 rounded-xl mb-6 ${
              gameState.imposterGuessResult.correct
                ? 'bg-green-600/30'
                : 'bg-red-600/30'
            }`}>
              {gameState.imposterGuessResult.correct
                ? 'Correct guess! +25 points!'
                : `Wrong! The word was "${gameState.imposterGuessResult.actualWord}"`}
            </div>
          )}

          {/* Scores */}
          <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold mb-3 text-gray-300">Scores</h3>
            <div className="space-y-2">
              {[...gameState.scores].sort((a, b) => b.score - a.score).map((player, i) => (
                <div
                  key={player.id}
                  className={`flex justify-between p-3 rounded-lg ${
                    player.id === gameState.playerId
                      ? 'bg-purple-600/30'
                      : 'bg-gray-700/50'
                  }`}
                >
                  <span>
                    {i === 0 && '👑 '}{player.name}
                    {results.imposterIds?.includes(player.id) && ' (Imposter)'}
                  </span>
                  <span className="font-bold">{player.score}</span>
                </div>
              ))}
            </div>
          </div>

          {gameState.isHost && (
            <button
              onClick={nextRound}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold"
            >
              {gameState.round >= gameState.totalRounds ? 'See Final Results' : 'Next Round'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Game ended
  if (gameState.state === 'ended') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-lg w-full text-center">
          <h1 className="text-4xl font-bold mb-2">Game Over!</h1>
          <p className="text-xl text-purple-400 mb-8">
            Winner: {gameState.winner?.name}
          </p>

          <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold mb-4 text-gray-300">Final Scores</h3>
            <div className="space-y-3">
              {gameState.finalScores?.map((player, i) => (
                <div
                  key={player.id}
                  className={`flex justify-between p-4 rounded-lg ${
                    i === 0
                      ? 'bg-yellow-600/30 border border-yellow-500'
                      : 'bg-gray-700/50'
                  }`}
                >
                  <span className="font-medium">
                    {i === 0 && '🏆 '}
                    {i === 1 && '🥈 '}
                    {i === 2 && '🥉 '}
                    {player.name}
                  </span>
                  <span className="font-bold text-xl">{player.score}</span>
                </div>
              ))}
            </div>
          </div>

          {gameState.isHost && (
            <button
              onClick={playAgain}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold"
            >
              Play Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

function Header({ gameState }) {
  return (
    <div className="flex justify-between items-center mb-6 max-w-2xl mx-auto w-full">
      <div className="text-sm text-gray-400">
        Round {gameState.round}/{gameState.totalRounds}
      </div>
      <div className="text-sm text-gray-400">
        Room: {gameState.roomCode}
      </div>
    </div>
  );
}
