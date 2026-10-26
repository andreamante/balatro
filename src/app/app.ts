import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  QueryList,
  ViewChild,
  ViewChildren,
  signal,
} from '@angular/core';
import {
  GameState,
  Joker,
  PlayingCard,
  TARGETS,
  SUIT_SYMBOLS,
  buyJoker,
  cardLabel,
  cardName,
  createGame,
  discardSelected,
  playSelected,
  sortByRank,
  sortBySuit,
  startNextRound,
} from './game';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit {
  @ViewChildren('cardButton') private cardButtons!: QueryList<ElementRef<HTMLButtonElement>>;
  @ViewChild('helpDialog') private helpDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('closeHelpButtonRef') private closeHelpButton!: ElementRef<HTMLButtonElement>;

  protected readonly game = signal(this.restoreGame());
  protected readonly selectedIds = signal<string[]>([]);
  protected readonly helpOpen = signal(false);
  protected readonly storageWarning = signal('');
  protected readonly suitSymbols = SUIT_SYMBOLS;
  protected readonly roundTargets = TARGETS;
  protected readonly cardLabel = cardLabel;
  protected readonly cardName = cardName;

  ngAfterViewInit(): void {
    this.persist(this.game());
  }

  protected isSelected(card: PlayingCard): boolean {
    return this.selectedIds().includes(card.id);
  }

  protected isScoringCard(card: PlayingCard): boolean {
    return this.game().lastResult?.scoringCardIds.includes(card.id) ?? false;
  }

  protected progress(): number {
    return Math.min(100, (this.game().score / this.game().target) * 100);
  }

  protected toggleCard(card: PlayingCard): void {
    if (this.game().phase !== 'playing') return;
    const selected = this.selectedIds();
    if (selected.includes(card.id)) {
      this.selectedIds.set(selected.filter((id) => id !== card.id));
    } else if (selected.length < 5) {
      this.selectedIds.set([...selected, card.id]);
    } else {
      this.game.update((state) => ({
        ...state,
        message: 'Puoi selezionare al massimo cinque carte.',
      }));
      this.persist(this.game());
    }
  }

  protected playHand(): void {
    const selected = this.selectedIds();
    if (selected.length === 0 || selected.length > 5) {
      this.announce('Scegli da una a cinque carte prima di giocare.');
      return;
    }
    const oldIndex = this.focusedCardIndex();
    const previous = this.game();
    const next = playSelected(previous, selected);
    if (next === previous) return;
    this.selectedIds.set([]);
    this.setGame(next);
    this.restoreCardFocus(oldIndex);
  }

  protected discardHand(): void {
    const selected = this.selectedIds();
    if (selected.length === 0 || selected.length > 5) {
      this.announce('Scegli da una a cinque carte da scartare.');
      return;
    }
    if (this.game().discardsLeft === 0) {
      this.announce('Non hai più scarti in questa orbita.');
      return;
    }
    const oldIndex = this.focusedCardIndex();
    const previous = this.game();
    const next = discardSelected(previous, selected);
    if (next === previous) return;
    this.selectedIds.set([]);
    this.setGame(next);
    this.restoreCardFocus(oldIndex);
  }

  protected sortHand(order: 'rank' | 'suit'): void {
    const current = this.game();
    if (current.phase !== 'playing') return;
    this.setGame({
      ...current,
      hand: order === 'rank' ? sortByRank(current.hand) : sortBySuit(current.hand),
      message: order === 'rank' ? 'Carte ordinate per valore.' : 'Carte ordinate per seme.',
    });
  }

  protected startNewGame(): void {
    this.selectedIds.set([]);
    this.storageWarning.set('');
    this.setGame(createGame());
    this.restoreCardFocus(0);
  }

  protected buy(offerId: GameState['offers'][number]['id']): void {
    const previous = this.game();
    const next = buyJoker(previous, offerId);
    if (next !== previous) this.setGame(next);
  }

  protected continueToNextRound(): void {
    this.selectedIds.set([]);
    const next = startNextRound(this.game());
    if (next !== this.game()) this.setGame(next);
    this.restoreCardFocus(0);
  }

  protected jokerName(joker: Joker): string {
    return {
      comet: 'Cometa',
      pulsar: 'Pulsar',
      eclipse: 'Eclissi',
    }[joker.type];
  }

  protected jokerIcon(joker: Joker): string {
    return {
      comet: '✦',
      pulsar: '✧',
      eclipse: '◐',
    }[joker.type];
  }

  protected openHelp(): void {
    if (this.helpOpen()) return;
    this.helpOpen.set(true);
    this.helpDialog.nativeElement.showModal();
    queueMicrotask(() => this.closeHelpButton.nativeElement.focus());
  }

  protected closeHelp(): void {
    if (!this.helpOpen()) return;
    this.helpDialog.nativeElement.close();
    this.helpOpen.set(false);
    this.cardButtons.first?.nativeElement.focus();
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === '?') {
      event.preventDefault();
      this.openHelp();
      return;
    }
    if (event.key === 'Escape' && this.helpOpen()) {
      event.preventDefault();
      this.closeHelp();
      return;
    }
    if (this.helpOpen()) return;

    const target = event.target;
    const cardIndex =
      target instanceof Element && target.closest('.playing-card')
        ? this.cardButtons
            .toArray()
            .findIndex((button) => button.nativeElement === target.closest('.playing-card'))
        : -1;

    if (cardIndex >= 0 && ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      const delta = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
      const nextIndex = (cardIndex + delta + this.cardButtons.length) % this.cardButtons.length;
      this.cardButtons.get(nextIndex)?.nativeElement.focus();
      return;
    }

    const isButton = target instanceof HTMLButtonElement;
    if (isButton && cardIndex < 0) return;

    if (event.key === ' ' && cardIndex >= 0) {
      event.preventDefault();
      const card = this.game().hand[cardIndex];
      if (card) this.toggleCard(card);
    } else if (event.key === 'Enter' || event.key.toLowerCase() === 'p') {
      event.preventDefault();
      this.playHand();
    } else if (event.key.toLowerCase() === 'x') {
      event.preventDefault();
      this.discardHand();
    } else if (event.key.toLowerCase() === 'r') {
      event.preventDefault();
      this.sortHand('rank');
    } else if (event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.sortHand('suit');
    }
  }

  private focusedCardIndex(): number {
    return this.cardButtons
      .toArray()
      .findIndex((button) => button.nativeElement === document.activeElement);
  }

  private restoreCardFocus(index: number): void {
    setTimeout(() => {
      const buttons = this.cardButtons.toArray();
      buttons[Math.min(Math.max(index, 0), buttons.length - 1)]?.nativeElement.focus();
    });
  }

  private announce(message: string): void {
    this.game.update((state) => ({ ...state, message }));
    this.persist(this.game());
  }

  private setGame(state: GameState): void {
    this.game.set(state);
    this.persist(state);
  }

  private persist(state: GameState): void {
    try {
      localStorage.setItem('nebula-deck-save', JSON.stringify(state));
      this.storageWarning.update((warning) =>
        warning.startsWith('Il browser non ha potuto salvare') ? '' : warning,
      );
    } catch {
      this.storageWarning.set(
        'Il browser non ha potuto salvare la partita: i progressi potrebbero non restare dopo la chiusura.',
      );
    }
  }

  private restoreGame(): GameState {
    try {
      const saved = localStorage.getItem('nebula-deck-save');
      if (!saved) return createGame();
      const candidate: unknown = JSON.parse(saved);
      if (this.isGameState(candidate)) {
        return { ...candidate, message: `Partita ripresa. ${candidate.message}` };
      }
      this.storageWarning.set('Il salvataggio non è valido: è iniziata una nuova partita.');
    } catch {
      this.storageWarning.set('Salvataggio illeggibile: è iniziata una nuova partita.');
    }
    return createGame();
  }

  private isGameState(value: unknown): value is GameState {
    if (typeof value !== 'object' || value === null) return false;
    const state = value as Partial<GameState>;
    const isCard = (card: unknown): card is PlayingCard => {
      if (typeof card !== 'object' || card === null) return false;
      const candidate = card as Record<string, unknown>;
      return (
        typeof candidate['id'] === 'string' &&
        typeof candidate['rank'] === 'number' &&
        Number.isInteger(candidate['rank']) &&
        candidate['rank'] >= 2 &&
        candidate['rank'] <= 14 &&
        ['hearts', 'diamonds', 'clubs', 'spades'].includes(String(candidate['suit']))
      );
    };
    return (
      ['playing', 'shop', 'won', 'lost'].includes(String(state.phase)) &&
      typeof state.round === 'number' &&
      state.round >= 1 &&
      state.round <= TARGETS.length &&
      typeof state.score === 'number' &&
      state.score >= 0 &&
      typeof state.target === 'number' &&
      typeof state.handsLeft === 'number' &&
      state.handsLeft >= 0 &&
      state.handsLeft <= 4 &&
      typeof state.discardsLeft === 'number' &&
      state.discardsLeft >= 0 &&
      state.discardsLeft <= 3 &&
      typeof state.money === 'number' &&
      state.money >= 0 &&
      typeof state.message === 'string' &&
      Array.isArray(state.deck) &&
      state.deck.every(isCard) &&
      Array.isArray(state.hand) &&
      state.hand.every(isCard) &&
      Array.isArray(state.discardPile) &&
      state.discardPile.every(isCard) &&
      Array.isArray(state.jokers) &&
      state.jokers.every(
        (joker) =>
          typeof joker === 'object' &&
          joker !== null &&
          typeof joker.id === 'string' &&
          ['comet', 'pulsar', 'eclipse'].includes(joker.type),
      ) &&
      Array.isArray(state.offers) &&
      state.offers.every(
        (offer) =>
          typeof offer === 'object' &&
          offer !== null &&
          ['comet', 'pulsar', 'eclipse'].includes(offer.id) &&
          typeof offer.name === 'string' &&
          typeof offer.description === 'string' &&
          typeof offer.price === 'number',
      )
    );
  }
}
