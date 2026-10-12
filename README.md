# 🤖 Ozoboti z Bolehoště

3D hra v prohlížeči pro děti z kroužku: po skutečné mapě obce **Bolehošť** (okres Rychnov nad Kněžnou) se rozutekli Ozoboti a je potřeba je chytat. Hra je v češtině, běží bez instalace (HTML + JavaScript, Three.js) a má **režim kola**, ve kterém se děti mohou poměřovat na více počítačích najednou.

## Rychlý start – hra jednoho hráče

Stáhněte celou složku a otevřete `index.html` (dvojklik). Soubory `mapdata.js` a `extras.js` musí zůstat vedle něj. Potřebuje internet (knihovna Three.js se načítá z CDN).

> Postup hráče se ukládá v prohlížeči podle jména, na každém počítači zvlášť.

## Společné hraní na více počítačích (režim kola)

Soutěž potřebuje malý server, který běží na **jednom** počítači (učitel). Stačí **Python 3**, nic se neinstaluje.

1. Na počítači učitele spusťte `spustit-server.bat` (Windows) nebo v této složce příkaz  
   `python server.py 8000 1234`  (port a PIN učitele).
2. Server vypíše dvě adresy, například  
   `http://192.168.1.20:8000/` – tu otevřou **děti** (ve stejné Wi‑Fi / školní síti),  
   `http://192.168.1.20:8000/ucitel.html` – tu otevře **učitel** (PIN `1234`).
3. Děti se přihlásí jménem a zvolí postavu. Nahoře na úvodní obrazovce vidí, že je režim kola dostupný.
4. Učitel na stránce `ucitel.html` zvolí délku kola a dá **Spustit kolo**. Všem se spustí odpočet, mají **stejné rozmístění Ozobotů i stejné události** a vidí živé pořadí.
5. Na konci je tabule výsledků a **diplom k tisku** (učitel může vytisknout všechny nebo první tři).

Poznámky:
- Při prvním spuštění Windows zobrazí upozornění brány firewall – povolte Pythonu přístup v soukromé síti, jinak se děti nepřipojí.
- Všechny počítače musí být ve stejné síti jako počítač učitele. Přes internet to bez dalšího nastavení nefunguje.
- V kole se začíná od nuly (bez vylepšení z běžné hry), body se počítají za chycené Ozoboty.
- PIN učitele se mění posledním parametrem `server.py`; výchozí je `1234`.

### Hra z GitHub Pages (volitelně)

Po zapnutí GitHub Pages (Settings → Pages → větev `main`, složka `/`) poběží **hra jednoho hráče** z odkazu. **Režim kola z GitHub Pages nefunguje** – tam nemůže běžet `server.py`. Pro soutěž pusťte server na počítači učitele.

## Ovládání

| Klávesa | Akce |
|---|---|
| W A S D / šipky | pohyb |
| Mezerník | skok |
| Shift | sprint (dobíjí se) |
| 1 2 3 | posilovače (magnet, zmražení psa, past) |
| V | vozidlo (po koupi v obchodě) |
| E | použít (výkup, obchod, dílna, starosta, závitek…) |
| Q | album, mise, odznaky |
| N nebo klik na minimapu | velká mapa |
| M | hudba zap/vyp |
| tažení myší | kamera |

## Obsah hry

- Skutečná mapa Bolehoště a **výšky terénu** v lego stylu, den a noc, déšť a mlha.
- 7 druhů Ozobotů s různým chováním, denní mise, album a odznaky.
- Posilovače a vozidla (kolo, koloběžka, vozatajský povoz, traktor, hasičská Tatra 138, hutní válec).
- Místní prvky: obecní hostinec, zelárna a zelné pole, hasiči, hřiště, pomník… a zajímavosti o obci.
- Starosta a **Mega-Ozobot** jako boss, události (hejno, Gulášová slavnost, noční hon).
- Postavy včetně maskota **Dráčka Zelnáčka**.

## Soubory

| Soubor | K čemu |
|---|---|
| `index.html` | hra |
| `extras.js` | místní prvky, události, boss, hudba, klient režimu kola |
| `mapdata.js` | mapa (budovy, silnice, voda, výšky, místa) |
| `server.py` | server režimu kola (jen standardní knihovna Pythonu) |
| `ucitel.html` | ovládání kola pro učitele |
| `spustit-server.bat` | spuštění serveru ve Windows |

Poloha **hospody a zvoničky** v `mapdata.js` (`MAP.PLACES`, označeno `approx`) je odhad – dá se upravit podle skutečnosti.

## Zdroje a uvedení autorství

- Mapová data: © přispěvatelé [OpenStreetMap](https://www.openstreetmap.org/copyright) (licence ODbL).
- Výšky terénu: EU‑DEM přes [OpenTopoData](https://www.opentopodata.org/).
- Zajímavosti o obci: web obce Bolehošť (obecbolehost.cz), Agrospol Bolehošť.
- 3D knihovna: [Three.js](https://threejs.org/) (MIT).
- Ozobot je ochranná známka firmy Evollve; tato hra je neoficiální a s firmou nijak nesouvisí.
