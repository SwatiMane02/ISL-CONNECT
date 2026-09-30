export interface ISLSign {
  letter: string;
  name: string;
  handForm: string;
  description: string;
  tips: string;
  category: 'Vowel' | 'Consonant';
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
}

export const ISL_ALPHABET: ISLSign[] = [
  {
    letter: 'A',
    name: 'Letter A',
    handForm: 'Closed fist with thumb extended upright',
    description: 'Form a upright fist with the thumb resting comfortably against the side of the index finger.',
    tips: 'Keep your wrist straight facing forward to the camera.',
    category: 'Vowel',
    difficulty: 'Basic'
  },
  {
    letter: 'B',
    name: 'Letter B',
    handForm: 'Open palm with four fingers flat and thumb folded across palm',
    description: 'Extend four fingers upright together while tucking the thumb across the palm.',
    tips: 'Ensure fingers are pressed closely together with palm facing outward.',
    category: 'Consonant',
    difficulty: 'Basic'
  },
  {
    letter: 'C',
    name: 'Letter C',
    handForm: 'Curved hand forming a C-shape',
    description: 'Curve your thumb and four fingers to form a distinct "C" crescent shape in profile.',
    tips: 'Angle your hand slightly so the side curve is clearly captured by the camera.',
    category: 'Consonant',
    difficulty: 'Basic'
  },
  {
    letter: 'D',
    name: 'Letter D',
    handForm: 'Index finger pointing straight up, thumb touching middle finger tip',
    description: 'Raise your index finger straight up while curving thumb and middle finger into a circle.',
    tips: 'Keep the index finger rigid and vertical for instant recognition.',
    category: 'Consonant',
    difficulty: 'Basic'
  },
  {
    letter: 'E',
    name: 'Letter E',
    handForm: 'Fingers curled down toward palm with thumb tucked underneath',
    description: 'Bend all four fingers down to rest near the upper palm, with thumb folded flat beneath fingers.',
    tips: 'Avoid curling fingers into a tight fist; keep tips resting flat near palm.',
    category: 'Vowel',
    difficulty: 'Basic'
  },
  {
    letter: 'F',
    name: 'Letter F',
    handForm: 'Index finger and thumb touching to form a loop, three fingers extended',
    description: 'Touch index tip to thumb tip forming an "O" shape, while extending middle, ring, and pinky upright.',
    tips: 'Fan out the three extended fingers slightly.',
    category: 'Consonant',
    difficulty: 'Intermediate'
  },
  {
    letter: 'G',
    name: 'Letter G',
    handForm: 'Index finger and thumb extended horizontally facing inward',
    description: 'Extend index finger and thumb horizontally parallel to each other like a small pinch gesture.',
    tips: 'Turn wrist sideways so the gap between index and thumb is visible.',
    category: 'Consonant',
    difficulty: 'Intermediate'
  },
  {
    letter: 'H',
    name: 'Letter H',
    handForm: 'Index and middle fingers extended together horizontally',
    description: 'Point index and middle fingers together horizontally across your torso, thumb tucked.',
    tips: 'Keep both active fingers touching each other horizontally.',
    category: 'Consonant',
    difficulty: 'Intermediate'
  },
  {
    letter: 'I',
    name: 'Letter I',
    handForm: 'Pinky finger extended upright, other fingers closed in fist',
    description: 'Make a fist with only the pinky (little finger) pointing straight up into the air.',
    tips: 'Ensure the thumb rests neatly across the index finger.',
    category: 'Vowel',
    difficulty: 'Basic'
  },
  {
    letter: 'J',
    name: 'Letter J',
    handForm: 'Pinky extended tracing a swoop curve',
    description: 'Extend the pinky finger like "I" and trace a small swooping J motion downwards and outward.',
    tips: 'Start high and curve inward towards your body.',
    category: 'Consonant',
    difficulty: 'Advanced'
  },
  {
    letter: 'K',
    name: 'Letter K',
    handForm: 'Index and middle fingers in V-shape with thumb resting between',
    description: 'Make a Victory "V" sign with index and middle fingers, placing thumb tip between their base.',
    tips: 'Point the index finger up and middle finger angled forward.',
    category: 'Consonant',
    difficulty: 'Intermediate'
  },
  {
    letter: 'L',
    name: 'Letter L',
    handForm: 'Index finger pointing up, thumb extended perpendicular',
    description: 'Form an "L" shape with index finger pointing straight up and thumb extending out horizontally.',
    tips: 'Keep the angle between thumb and index at a sharp 90 degrees.',
    category: 'Consonant',
    difficulty: 'Basic'
  },
  {
    letter: 'M',
    name: 'Letter M',
    handForm: 'Thumb tucked under three fingers (index, middle, ring)',
    description: 'Fold your thumb under your index, middle, and ring fingers with pinky resting to the side.',
    tips: 'Show the three knuckles resting over the thumb clearly.',
    category: 'Consonant',
    difficulty: 'Intermediate'
  },
  {
    letter: 'N',
    name: 'Letter N',
    handForm: 'Thumb tucked under two fingers (index and middle)',
    description: 'Fold thumb underneath index and middle fingers while ring and pinky fingers rest down.',
    tips: 'Distinct from "M" by showing only two finger knuckles over the thumb.',
    category: 'Consonant',
    difficulty: 'Intermediate'
  },
  {
    letter: 'O',
    name: 'Letter O',
    handForm: 'All fingers curved touching thumb tip forming a circle',
    description: 'Bring all four fingers down to touch the thumb tip, creating a full oval or circle.',
    tips: 'Hold the circular shape clear against a contrasting background.',
    category: 'Vowel',
    difficulty: 'Basic'
  },
  {
    letter: 'P',
    name: 'Letter P',
    handForm: 'Inverted K-shape pointing downwards',
    description: 'Form a "K" shape with index and middle fingers, pointing the hand downward toward the ground.',
    tips: 'Tilt palm toward the camera so keypoints capture both fingers.',
    category: 'Consonant',
    difficulty: 'Intermediate'
  },
  {
    letter: 'Q',
    name: 'Letter Q',
    handForm: 'Inverted G-shape pointing downwards',
    description: 'Point index finger and thumb downwards in a pinching angle like an inverted "G".',
    tips: 'Keep fingers parallel facing lower plane.',
    category: 'Consonant',
    difficulty: 'Intermediate'
  },
  {
    letter: 'R',
    name: 'Letter R',
    handForm: 'Index and middle fingers crossed together upright',
    description: 'Cross index finger over middle finger straight up while other fingers remain folded into fist.',
    tips: 'Ensure the twist in the crossed fingers is obvious.',
    category: 'Consonant',
    difficulty: 'Intermediate'
  },
  {
    letter: 'S',
    name: 'Letter S',
    handForm: 'Fist with thumb folded across front of all fingers',
    description: 'Clench your hand into a solid fist with your thumb wrapped horizontally across index and middle knuckles.',
    tips: 'Keep thumb rest firm across the fingers.',
    category: 'Consonant',
    difficulty: 'Basic'
  },
  {
    letter: 'T',
    name: 'Letter T',
    handForm: 'Thumb tucked under index finger knuckle',
    description: 'Fold thumb so its tip pokes out between the index and middle fingers of a fist.',
    tips: 'Keep the thumb tip clearly visible emerging above index knuckle.',
    category: 'Consonant',
    difficulty: 'Intermediate'
  },
  {
    letter: 'U',
    name: 'Letter U',
    handForm: 'Index and middle fingers extended together upright',
    description: 'Point index and middle fingers straight up held tightly together with palm facing front.',
    tips: 'Do not spread fingers apart; keep them pressed alongside each other.',
    category: 'Vowel',
    difficulty: 'Basic'
  },
  {
    letter: 'V',
    name: 'Letter V',
    handForm: 'Index and middle fingers extended in open V-shape',
    description: 'Extend index and middle fingers upright in a spread "V" peace sign.',
    tips: 'Maintain a clear gap between index and middle fingers.',
    category: 'Consonant',
    difficulty: 'Basic'
  },
  {
    letter: 'W',
    name: 'Letter W',
    handForm: 'Index, middle, and ring fingers spread upright',
    description: 'Raise index, middle, and ring fingers spread apart, with thumb holding pinky down.',
    tips: 'Form a distinct 3-finger trident shape.',
    category: 'Consonant',
    difficulty: 'Basic'
  },
  {
    letter: 'X',
    name: 'Letter X',
    handForm: 'Index finger bent into a hook shape, fist closed',
    description: 'Make a fist with only the index finger raised and bent into a hook or arc.',
    tips: 'Bend index finger at the middle joint distinctly.',
    category: 'Consonant',
    difficulty: 'Intermediate'
  },
  {
    letter: 'Y',
    name: 'Letter Y',
    handForm: 'Thumb and pinky extended, middle three fingers folded',
    description: 'Extend thumb and pinky outwards while holding index, middle, and ring fingers flat against palm.',
    tips: 'Resembles the classic "hang loose" or phone gesture.',
    category: 'Consonant',
    difficulty: 'Basic'
  },
  {
    letter: 'Z',
    name: 'Letter Z',
    handForm: 'Index finger tracing a Z pattern in air',
    description: 'Extend index finger alone and trace out the letter "Z" in 3 diagonal directional strokes.',
    tips: 'Perform strokes smoothly from upper left to right, down-left, then right.',
    category: 'Consonant',
    difficulty: 'Advanced'
  }
];
