import { useState } from 'react';

const CATEGORIES = [
  { id: 'animals', name: 'Animals', icon: '🐾' },
  { id: 'food', name: 'Food', icon: '🍕' },
  { id: 'movies', name: 'Movies', icon: '🎬' },
  { id: 'countries', name: 'Countries', icon: '🌍' },
  { id: 'occupations', name: 'Occupations', icon: '👔' },
  { id: 'sports', name: 'Sports', icon: '⚽' }
];

const WORDS = {
  animals: ['elephant', 'giraffe', 'penguin', 'dolphin', 'kangaroo', 'octopus', 'butterfly', 'crocodile', 'peacock', 'koala'],
  food: ['pizza', 'sushi', 'hamburger', 'tacos', 'pasta', 'chocolate', 'pancakes', 'ice cream', 'sandwich', 'curry'],
  movies: ['titanic', 'avatar', 'inception', 'frozen', 'jaws', 'matrix', 'gladiator', 'shrek', 'joker', 'coco'],
  countries: ['japan', 'brazil', 'egypt', 'australia', 'canada', 'italy', 'mexico', 'india', 'france', 'germany'],
  occupations: ['firefighter', 'astronaut', 'chef', 'doctor', 'pilot', 'teacher', 'detective', 'architect', 'photographer', 'scientist'],
  sports: ['basketball', 'tennis', 'swimming', 'skateboarding', 'golf', 'boxing', 'surfing', 'volleyball', 'gymnastics', 'skiing']
};

export default function PassAndPlay({ onBack }) {
  const [phase, setPhase] = useState('setup'); // setup, names, reveal, playing, results
  const [playerCount, setPlayerCount] = useState(3);
  const [imposterCount, setImposterCount] = useState(1);
  const [category, setCategory] = useState('animals');
  const [players, setPlayers] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [showRole, setShowRole] = useState(false);
  const [word, setWord] = useState('');
  const [imposterIds, setImposterIds] = useState([]);
  const [round, setRound] = useState(1);

  const maxImposters = Math.max(1, Math.floor(playerCount / 2));

  // Setup phase - choose player count, imposters, category
  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <button
            onClick={onBack}
            className="mb-6 text-gray-400 hover:text-white"
          >
            ← Back
          </button>

          <h1 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Pass & Play
          </h1>

          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-300">Number of Players</h3>
              <div className="flex gap-2 justify-center flex-wrap">
                {[3, 4, 5, 6, 7, 8].map(n => (
                  <button
                    key={n}
                    onClick={() => {
                      setPlayerCount(n);
                      if (imposterCount > Math.floor(n / 2)) {
                        setImposterCount(Math.floor(n / 2));
                      }
                    }}
                    className={`w-12 h-12 rounded-lg text-lg font-bold transition-all ${
                      playerCount === n
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-300">Number of Imposters</h3>
              <div className="flex gap-2 justify-center">
                {[...Array(maxImposters)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setImposterCount(i + 1)}
                    className={`w-12 h-12 rounded-lg text-lg font-bold transition-all ${
                      imposterCount === i + 1
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-300">Category</h3>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                      category === cat.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <div>{cat.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setPlayers(Array(playerCount).fill('').map((_, i) => ({ id: i, name: '' })));
                setPhase('names');
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-lg"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Names phase - enter player names
  if (phase === 'names') {
    const allNamesEntered = players.every(p => p.name.trim());

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-6">Enter Player Names</h2>

          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 shadow-2xl space-y-3 mb-4">
            {players.map((player, i) => (
              <input
                key={i}
                type="text"
                value={player.name}
                onChange={(e) => {
                  const newPlayers = [...players];
                  newPlayers[i] = { ...newPlayers[i], name: e.target.value };
                  setPlayers(newPlayers);
                }}
                placeholder={`Player ${i + 1}`}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                maxLength={15}
              />
            ))}
          </div>

          <button
            onClick={() => {
              // Pick random word
              const words = WORDS[category];
              const selectedWord = words[Math.floor(Math.random() * words.length)];
              setWord(selectedWord);

              // Pick random imposters
              const shuffled = [...Array(playerCount).keys()].sort(() => Math.random() - 0.5);
              const imposters = shuffled.slice(0, imposterCount);
              setImposterIds(imposters);

              setCurrentPlayerIndex(0);
              setShowRole(false);
              setPhase('reveal');
            }}
            disabled={!allNamesEntered}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl font-bold text-lg disabled:opacity-50"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  // Reveal phase - each player sees their role privately
  if (phase === 'reveal') {
    const currentPlayer = players[currentPlayerIndex];
    const isImposter = imposterIds.includes(currentPlayerIndex);

    if (!showRole) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="max-w-md w-full text-center">
            <h2 className="text-3xl font-bold mb-4">{currentPlayer.name}</h2>
            <p className="text-gray-400 mb-8">Pass the device to {currentPlayer.name}</p>
            <p className="text-gray-500 mb-8 text-sm">Make sure no one else is looking!</p>

            <button
              onClick={() => setShowRole(true)}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-xl"
            >
              Tap to See Your Role
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-6">{currentPlayer.name}</h2>

          <div className={`p-8 rounded-xl mb-8 ${
            isImposter
              ? 'bg-red-600/30 border-2 border-red-500'
              : 'bg-green-600/30 border-2 border-green-500'
          }`}>
            {isImposter ? (
              <>
                <h3 className="text-3xl font-bold text-red-400 mb-2">You are the IMPOSTER!</h3>
                <p className="text-gray-300">Try to blend in without knowing the word</p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-green-400 mb-2">The word is:</h3>
                <p className="text-5xl font-bold text-white">{word}</p>
              </>
            )}
          </div>

          <button
            onClick={() => {
              if (currentPlayerIndex < players.length - 1) {
                setCurrentPlayerIndex(currentPlayerIndex + 1);
                setShowRole(false);
              } else {
                setPhase('playing');
              }
            }}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold"
          >
            {currentPlayerIndex < players.length - 1 ? 'Next Player' : 'Start Game'}
          </button>
        </div>
      </div>
    );
  }

  // Playing phase - give verbal clues and discuss in person
  if (phase === 'playing') {
    const categoryInfo = CATEGORIES.find(c => c.id === category);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <p className="text-gray-400 mb-2">Round {round}</p>
            <h2 className="text-3xl font-bold mb-2">Time to Play!</h2>
            <p className="text-xl text-gray-300">
              Category: {categoryInfo?.icon} {categoryInfo?.name}
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 shadow-2xl mb-6">
            <h3 className="font-semibold mb-4 text-purple-400 text-center text-lg">How to Play</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">1.</span>
                <span>Go around the circle - each player gives a one-word clue</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">2.</span>
                <span>Imposters must bluff - they don't know the word!</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">3.</span>
                <span>Discuss and debate who seems suspicious</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 font-bold">4.</span>
                <span>Vote out loud who you think the imposter is</span>
              </li>
            </ul>
          </div>

          <div className="bg-purple-600/20 border border-purple-500/50 rounded-xl p-4 mb-6 text-center">
            <p className="text-purple-300">
              {imposterCount === 1
                ? `There is 1 imposter among ${playerCount} players`
                : `There are ${imposterCount} imposters among ${playerCount} players`}
            </p>
          </div>

          <button
            onClick={() => setPhase('results')}
            className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-xl font-bold text-lg"
          >
            Reveal Imposters
          </button>
        </div>
      </div>
    );
  }

  // Results phase
  if (phase === 'results') {
    const imposterNames = imposterIds.map(id => players[id].name);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <div className="text-center p-8 rounded-xl mb-6 bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-2 border-purple-500">
            <h2 className="text-2xl font-bold mb-4 text-gray-200">The Reveal</h2>

            <div className="mb-6">
              <p className="text-gray-400 mb-2">
                {imposterNames.length > 1 ? 'The imposters were:' : 'The imposter was:'}
              </p>
              <p className="text-3xl font-bold text-red-400">
                {imposterNames.join(' & ')}
              </p>
            </div>

            <div>
              <p className="text-gray-400 mb-2">The secret word was:</p>
              <p className="text-4xl font-bold text-white">{word}</p>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold mb-3 text-gray-300 text-center">Players</h3>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`flex justify-between items-center p-3 rounded-lg ${
                    imposterIds.includes(player.id)
                      ? 'bg-red-600/20 border border-red-500/50'
                      : 'bg-green-600/20 border border-green-500/50'
                  }`}
                >
                  <span className="font-medium">{player.name}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    imposterIds.includes(player.id)
                      ? 'bg-red-500/30 text-red-300'
                      : 'bg-green-500/30 text-green-300'
                  }`}>
                    {imposterIds.includes(player.id) ? 'Imposter' : 'Crewmate'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                // New round - new word and imposters
                const words = WORDS[category];
                const selectedWord = words[Math.floor(Math.random() * words.length)];
                setWord(selectedWord);

                const shuffled = [...Array(playerCount).keys()].sort(() => Math.random() - 0.5);
                const imposters = shuffled.slice(0, imposterCount);
                setImposterIds(imposters);

                setRound(round + 1);
                setCurrentPlayerIndex(0);
                setShowRole(false);
                setPhase('reveal');
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold"
            >
              Next Round
            </button>

            <button
              onClick={onBack}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
