# Změny

## 2026-10-15

### Uspořádání hry

Hra už není jeden velký skript uvnitř `index.html`. Prohlížeč načte moduly ze složky `js/` a styly ze složky `css/`. Data mapy v `mapdata.js` jsou stejná, soubor se jen importuje.

- `js/main.js` skládá hru a pouští smyčku.
- `js/world.js` je terén, obloha, stavby, domov, stromy a den s počasím.
- `js/player.js` je postava, pohyb, vozidla a klávesy.
- `js/robots.js` jsou druhy Ozobotů a jejich chování.
- `js/collision.js` jsou překážky.
- `js/hud.js` je obrazovka, minimapa, velká mapa a úvod.
- `js/game.js` je stav, ukládání, mise, album, odznaky a posilovače.
- `js/extras.js` jsou místa, starosta, boss, události a hudba.
- `js/round.js` je klient režimu kola. Volá pořád `api/state`, `api/score` a `api/teacher`.
- Učitel má vzhled v `css/teacher.css`. Přihlášení PINem se nemění.

### Hraní

- Ovládání je ikona klávesnice vpravo dole. Kliknutí otevře tabulku.
- Kamera se přibližuje a oddaluje klávesami **+** a **−** i kolečkem myši.
- Jméno je hned nad hlavou postavy, i když sedí ve vozidle.
- Chycení Ozoboti jsou řada barevných puntíků na zemi pod postavou.
- Z mapy jsou pryč malé barevné kostičky, které stály místo květin.
- Kolem vesnice je větší louka, kam se dá dojít. Konec označuje červeno-bílý plot, nápis **KONEC MAPY** a červený okraj na minimapě i na velké mapě. U plotu se objeví hláška, že tady mapa končí.
