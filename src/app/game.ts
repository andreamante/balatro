export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Phase = 'playing' | 'shop' | 'won' | 'lost';
export type JokerId = 'comet' | 'pulsar' | 'eclipse';

export interface PlayingCard {
  id: string;
  rank: number;
  suit: Suit;
}

export interface Joker {
  id: string;
  type: JokerId;
}

export interface ShopOffer {
  id: JokerId;
  name: string;
  description: string;
  price: number;
}

export interface HandResult {
  name: string;
  chips: number;
  multiplier: number;
  cardPoints: number;
  points: number;
  scoringCardIds: string[];
}

export interface GameState {
  phase: Phase;
  round: number;
  score: number;
  target: number;
  handsLeft: number;
  discardsLeft: number;
  money: number;
  deck: PlayingCard[];
  hand: PlayingCard[];
  discardPile: PlayingCard[];
  jokers: Joker[];
  offers: ShopOffer[];
  lastResult: HandResult | null;
  message: string;
}

export const TARGETS = [300, 600, 1000];
export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export const SUIT_NAMES: Record<Suit, string> = {
  hearts: 'cuori',
  diamonds: 'quadri',
  clubs: 'fiori',
  spades: 'picche',
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const OFFERS: ShopOffer[] = [
  {
    id: 'comet',
    name: 'Cometa',
    description: '+30 fiches a ogni mano giocata.',
    price: 5,
  },
  {
    id: 'pulsar',
    name: 'Pulsar',
    description: '+1 al moltiplicatore a ogni mano giocata.',
    price: 7,
  },
  {
    id: 'eclipse',
    name: 'Eclissi',
    description: '+20 fiches e +1 al moltiplicatore.',
    price: 8,
  },
];

const HAND_SCORES = {
  'Scala colore': { chips: 100, multiplier: 8 },
  'Poker': { chips: 60, multiplier: 7 },
  'Full': { chips: 40, multiplier: 4 },
  'Colore': { chips: 35, multiplier: 4 },
  'Scala': { chips: 30, multiplier: 4 },
  'Tris': { chips: 30, multiplier: 3 },
  'Doppia coppia': { chips: 20, multiplier: 2 },
  'Coppia': { chips: 10, multiplier: 2 },
  'Carta alta': { chips: 5, multiplier: 1 },
} satisfies Record<string, { chips: number; multiplier: number }>;

const RANK_NAMES: Record<number, string> = {
  11: 'fante',
  12: 'donna',
  13: 're',
  14: 'asso',
};

export function rankName(rank: number): string {
  return RANK_NAMES[rank] ?? String(rank);
}

export function cardName(card: PlayingCard): string {
  return `${rankName(card.rank)} di ${SUIT_NAMES[card.suit]}`;
}

export function cardLabel(card: PlayingCard): string {
  if (card.rank > 10) {
    return ({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A' } as const)[
      card.rank as 11 | 12 | 13 | 14
    ];
  }
  return String(card.rank);
}

function makeDeck(): PlayingCard[] {
  return SUITS.flatMap((suit) =>
    Array.from({ length: 13 }, (_, index) => ({
      id: `${suit}-${index + 2}`,
      rank: index + 2,
      suit,
    })),
  );
}

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function createGame(): GameState {
  const deck = shuffled(makeDeck());
  return {
    phase: 'playing',
    round: 1,
    score: 0,
    target: TARGETS[0],
    handsLeft: 4,
    discardsLeft: 3,
    money: 8,
    deck: deck.slice(8),
    hand: deck.slice(0, 8),
    discardPile: [],
    jokers: [],
    offers: OFFERS,
    lastResult: null,
    message: 'Partita iniziata. Scegli da una a cinque carte da giocare.',
  };
}

function straightRanks(ranks: number[]): number[] | null {
  const unique = [...new Set(ranks)].sort((a, b) => a - b);
  if (unique.length !== 5) return null;
  if (unique[4] - unique[0] === 4) return unique;
  if (unique.join(',') === '2,3,4,5,14') return [14, 2, 3, 4, 5];
  return null;
}

export function evaluateHand(cards: PlayingCard[], jokers: Joker[] = []): HandResult {
  if (cards.length < 1 || cards.length > 5) {
    throw new RangeError('Una mano deve contenere da una a cinque carte.');
  }

  const counts = new Map<number, number>();
  for (const card of cards) counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const isFlush = cards.length === 5 && cards.every((card) => card.suit === cards[0].suit);
  const run = cards.length === 5 ? straightRanks(cards.map((card) => card.rank)) : null;
  const isStraight = run !== null;
  let name: keyof typeof HAND_SCORES;
  let scoringRanks: number[];

  if (isStraight && isFlush) {
    name = 'Scala colore';
    scoringRanks = run;
  } else if (groups[0][1] === 4) {
    name = 'Poker';
    scoringRanks = [groups[0][0]];
  } else if (groups[0][1] === 3 && groups[1]?.[1] === 2) {
    name = 'Full';
    scoringRanks = [groups[0][0], groups[1][0]];
  } else if (isFlush) {
    name = 'Colore';
    scoringRanks = cards.map((card) => card.rank);
  } else if (isStraight) {
    name = 'Scala';
    scoringRanks = run;
  } else if (groups[0][1] === 3) {
    name = 'Tris';
    scoringRanks = [groups[0][0]];
  } else if (groups.filter(([, count]) => count === 2).length === 2) {
    name = 'Doppia coppia';
    scoringRanks = groups.filter(([, count]) => count === 2).map(([rank]) => rank);
  } else if (groups[0][1] === 2) {
    name = 'Coppia';
    scoringRanks = [groups[0][0]];
  } else {
    name = 'Carta alta';
    scoringRanks = [Math.max(...cards.map((card) => card.rank))];
  }

  const scoringCards = cards.filter((card) => scoringRanks.includes(card.rank));
  const cardPoints = scoringCards.reduce(
    (total, card) => total + (card.rank <= 10 ? card.rank : card.rank === 14 ? 11 : 10),
    0,
  );
  const jokerChips = jokers.reduce(
    (total, joker) => total + (joker.type === 'comet' ? 30 : joker.type === 'eclipse' ? 20 : 0),
    0,
  );
  const chips = HAND_SCORES[name].chips + jokerChips;
  const multiplier =
    HAND_SCORES[name].multiplier +
    jokers.filter((joker) => joker.type === 'pulsar' || joker.type === 'eclipse').length;

  return {
    name,
    chips,
    multiplier,
    cardPoints,
    points: (chips + cardPoints) * multiplier,
    scoringCardIds: scoringCards.map((card) => card.id),
  };
}

function drawCards(state: GameState, amount: number): Pick<GameState, 'deck' | 'discardPile' | 'hand'> {
  let deck = [...state.deck];
  let discardPile = [...state.discardPile];
  const hand = [...state.hand];

  while (hand.length < 8 && amount > 0) {
    if (deck.length === 0 && discardPile.length > 0) {
      deck = shuffled(discardPile);
      discardPile = [];
    }
    if (deck.length === 0) break;
    const nextCard = deck.shift();
    if (!nextCard) break;
    hand.push(nextCard);
    amount -= 1;
  }

  return { deck, discardPile, hand };
}

export function playSelected(state: GameState, selectedIds: string[]): GameState {
  if (state.phase !== 'playing' || selectedIds.length < 1 || selectedIds.length > 5) {
    return state;
  }

  const played = state.hand.filter((card) => selectedIds.includes(card.id));
  if (played.length !== selectedIds.length) return state;

  const result = evaluateHand(played, state.jokers);
  const remainingHand = state.hand.filter((card) => !selectedIds.includes(card.id));
  const updated = drawCards(
    { ...state, hand: remainingHand, discardPile: [...state.discardPile, ...played] },
    played.length,
  );
  const score = state.score + result.points;
  const handsLeft = state.handsLeft - 1;
  const message = `${result.name}: ${result.points} punti. ${
    state.target - score > 0 ? `Ne mancano ${state.target - score} all'obiettivo.` : 'Obiettivo superato!'
  }`;

  if (score >= state.target) {
    const money = state.money + 5 + handsLeft;
    if (state.round === TARGETS.length) {
      return {
        ...state,
        ...updated,
        phase: 'won',
        score,
        handsLeft,
        money,
        lastResult: result,
        message: `${message} Hai completato tutte le orbite!`,
      };
    }
    return {
      ...state,
      ...updated,
      phase: 'shop',
      score,
      handsLeft,
      money,
      lastResult: result,
      message: `${message} Hai guadagnato ${5 + handsLeft} crediti: il negozio è aperto.`,
    };
  }

  if (handsLeft === 0) {
    return {
      ...state,
      ...updated,
      phase: 'lost',
      score,
      handsLeft,
      lastResult: result,
      message: `${message} Le mani sono terminate: partita conclusa.`,
    };
  }

  return { ...state, ...updated, score, handsLeft, lastResult: result, message };
}

export function discardSelected(state: GameState, selectedIds: string[]): GameState {
  if (
    state.phase !== 'playing' ||
    state.discardsLeft === 0 ||
    selectedIds.length < 1 ||
    selectedIds.length > 5
  ) {
    return state;
  }

  const discarded = state.hand.filter((card) => selectedIds.includes(card.id));
  if (discarded.length !== selectedIds.length) return state;

  const updated = drawCards(
    {
      ...state,
      hand: state.hand.filter((card) => !selectedIds.includes(card.id)),
      discardPile: [...state.discardPile, ...discarded],
    },
    discarded.length,
  );
  return {
    ...state,
    ...updated,
    discardsLeft: state.discardsLeft - 1,
    lastResult: null,
    message: `${discarded.length} carte scartate e sostituite.`,
  };
}

export function buyJoker(state: GameState, offerId: JokerId): GameState {
  const offer = state.offers.find((item) => item.id === offerId);
  if (state.phase !== 'shop' || !offer || state.money < offer.price || state.jokers.length >= 5) {
    return state;
  }
  return {
    ...state,
    money: state.money - offer.price,
    jokers: [...state.jokers, { id: `${offer.id}-${Date.now()}-${state.jokers.length}`, type: offer.id }],
    offers: state.offers.filter((item) => item.id !== offerId),
    message: `${offer.name} aggiunto alla tua costellazione.`,
  };
}

export function startNextRound(state: GameState): GameState {
  if (state.phase !== 'shop' || state.round >= TARGETS.length) return state;
  const deck = shuffled(makeDeck());
  return {
    ...state,
    phase: 'playing',
    round: state.round + 1,
    score: 0,
    target: TARGETS[state.round],
    handsLeft: 4,
    discardsLeft: 3,
    deck: deck.slice(8),
    hand: deck.slice(0, 8),
    discardPile: [],
    offers: OFFERS,
    lastResult: null,
    message: `Orbita ${state.round + 1}: supera ${TARGETS[state.round]} punti.`,
  };
}

export function sortByRank(hand: PlayingCard[]): PlayingCard[] {
  return [...hand].sort((a, b) => b.rank - a.rank || SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit));
}

export function sortBySuit(hand: PlayingCard[]): PlayingCard[] {
  return [...hand].sort((a, b) => SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit) || b.rank - a.rank);
}
