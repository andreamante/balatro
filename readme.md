
# Nebula Deck

Un gioco di carte originale in italiano, costruito con Angular: combina il poker, supera tre obiettivi crescenti e raccogli jolly lungo il viaggio.

## Avvio

```bash
npm install
npm start
```

Apri `http://localhost:4200`. Per creare il pacchetto di produzione:

```bash
npm run build
```

L'output è in `dist/nebula-deck/browser`. Il service worker è attivo nella build di produzione; per provare l'installazione e la modalità offline, pubblica il sito su un host HTTPS e aprilo almeno una volta prima di scollegarti.

## Contesto del progetto

- **Stack:** Angular 20, TypeScript e SCSS; app standalone senza meta-framework.
- **Gioco:** mazzo francese, otto carte in mano, tre orbite con obiettivi di 300, 600 e 1000 punti.
- **Regole:** gioca o scarta da una a cinque carte; ogni orbita concede quattro mani e tre scarti.
- **Punteggio:** fiches della combinazione più valori delle sole carte che la compongono, moltiplicati per il moltiplicatore.
- **Estensioni:** tre jolly acquistabili, negozio tra le orbite, ordinamento per valore o seme e salvataggio automatico sul dispositivo.
- **Accessibilità:** tutte le azioni sono raggiungibili da tastiera, focus visibile, nomi delle carte per screen reader, annunci degli esiti, dialogo delle scorciatoie e rispetto di `prefers-reduced-motion`.
- **PWA:** manifest e service worker Angular per installazione e uso offline dopo il primo caricamento.
- **Dipendenze aggiunte:** `@angular/service-worker`, per manifest, cache offline e aggiornamento delle risorse; il resto dello stack è quello generato dal CLI Angular.

## Comandi da tastiera

| Tasto | Azione |
| --- | --- |
| Frecce | Spostarsi tra le carte |
| Spazio | Selezionare o deselezionare la carta |
| Enter oppure `P` | Giocare le carte selezionate |
| `X` | Scartare le carte selezionate |
| `R` / `S` | Ordinare per valore / seme |
| `?` / Esc | Aprire / chiudere la guida |

## Accessibilità e fonti

- [WAI-ARIA Authoring Practices: Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [WAI-ARIA Authoring Practices: Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/), in particolare contrasto, tastiera, focus e annunci di stato.
- Controllo consigliato prima della consegna: Lighthouse e axe DevTools, su desktop e su uno schermo largo 360 px.

## Pubblicazione

Collega il repository a Vercel e usa `npm run build` come comando di build, con `dist/nebula-deck/browser` come cartella di output. Verifica il deploy sia da computer sia da telefono; il service worker si registra solo nelle build di produzione e aggiorna i file quando è disponibile una nuova versione.

## Diario di lavoro con l'AI

Il codice e le regole di punteggio sono coperti da test unitari. Prima della consegna, aggiungi qui i prompt usati, gli errori incontrati e come sono stati verificati nel browser: il diario deve raccontare il lavoro effettivamente svolto, non un resoconto inventato.
