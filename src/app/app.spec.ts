import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.removeItem('nebula-deck-save');
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create a new accessible game table', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Orbita');
    expect(element.querySelectorAll('.playing-card').length).toBe(8);
    expect(element.querySelector('[aria-live="polite"]')).toBeTruthy();
    expect(element.querySelector('button.playing-card[aria-label]')).toBeTruthy();
  });
});
