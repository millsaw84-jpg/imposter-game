export const wordCategories = {
  animals: [
    'elephant', 'giraffe', 'penguin', 'dolphin', 'kangaroo',
    'octopus', 'butterfly', 'crocodile', 'peacock', 'koala',
    'flamingo', 'cheetah', 'panda', 'gorilla', 'hedgehog'
  ],
  food: [
    'pizza', 'sushi', 'hamburger', 'tacos', 'pasta',
    'chocolate', 'pancakes', 'ice cream', 'sandwich', 'curry',
    'lasagna', 'burrito', 'ramen', 'croissant', 'cheesecake'
  ],
  movies: [
    'titanic', 'avatar', 'inception', 'frozen', 'jaws',
    'matrix', 'gladiator', 'up', 'psycho', 'alien',
    'rocky', 'coco', 'shrek', 'joker', 'parasite'
  ],
  countries: [
    'japan', 'brazil', 'egypt', 'australia', 'canada',
    'italy', 'mexico', 'india', 'france', 'germany',
    'spain', 'china', 'greece', 'sweden', 'argentina'
  ],
  occupations: [
    'firefighter', 'astronaut', 'chef', 'doctor', 'pilot',
    'teacher', 'detective', 'architect', 'photographer', 'scientist',
    'musician', 'journalist', 'veterinarian', 'lawyer', 'programmer'
  ],
  sports: [
    'basketball', 'tennis', 'swimming', 'skateboarding', 'golf',
    'boxing', 'surfing', 'volleyball', 'gymnastics', 'skiing',
    'cricket', 'rugby', 'cycling', 'archery', 'fencing'
  ]
};

export function getRandomWord(category) {
  const words = wordCategories[category];
  if (!words) return null;
  return words[Math.floor(Math.random() * words.length)];
}

export function getCategories() {
  return Object.keys(wordCategories);
}
