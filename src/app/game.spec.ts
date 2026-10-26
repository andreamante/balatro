import { buyJoker, createGame, evaluateHand, playSelected, PlayingCard } from './game';

describe('game rules', () => {
  it('scores a pair of kings as (10 + 10 + 10) x 2', () => {
    const kings: PlayingCard[] = [
      { id: 'hearts-13', rank: 13, suit: 'hearts' },
      { id: 'spades-13', rank: 13, suit: 'spades' },
    ];

    expect(evaluateHand(kings)).toEqual({
      name: 'Coppia',
      chips: 10,
      multiplier: 2,
      cardPoints: 20,
      points: 60,
      scoringCardIds: ['hearts-13', 'spades-13'],
    });
  });

  it('scores a wheel straight as a five-high straight', () => {
    const wheel: PlayingCard[] = [
      { id: 'spades-14', rank: 14, suit: 'spades' },
      { id: 'hearts-2', rank: 2, suit: 'hearts' },
      { id: 'clubs-3', rank: 3, suit: 'clubs' },
      { id: 'diamonds-4', rank: 4, suit: 'diamonds' },
      { id: 'spades-5', rank: 5, suit: 'spades' },
    ];

    expect(evaluateHand(wheel).name).toBe('Scala');
    expect(evaluateHand(wheel).scoringCardIds.length).toBe(5);
  });

  it('scores only cards that contribute to the poker combination', () => {
    const cards: PlayingCard[] = [
      { id: 'hearts-13', rank: 13, suit: 'hearts' },
      { id: 'spades-13', rank: 13, suit: 'spades' },
      { id: 'clubs-8', rank: 8, suit: 'clubs' },
    ];

    expect(evaluateHand(cards).scoringCardIds).toEqual(['hearts-13', 'spades-13']);
  });

  it('applies joker effects to the score', () => {
    const pair: PlayingCard[] = [
      { id: 'hearts-13', rank: 13, suit: 'hearts' },
      { id: 'spades-13', rank: 13, suit: 'spades' },
    ];
    const state = createGame();
    state.hand = pair;
    state.target = 1000;
    state.jokers = [
      { id: 'comet-1', type: 'comet' },
      { id: 'pulsar-1', type: 'pulsar' },
    ];

    const next = playSelected(state, pair.map((card) => card.id));
    expect(next.lastResult?.points).toBe(180);
  });

  it('does not sell an unaffordable joker', () => {
    const state = createGame();
    state.phase = 'shop';
    state.money = 0;

    expect(buyJoker(state, 'comet')).toBe(state);
  });
});
