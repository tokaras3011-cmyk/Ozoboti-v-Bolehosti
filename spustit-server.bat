@echo off
cd /d "%~dp0"
echo Spoustim server hry Ozoboti z Bolehoste (PIN ucitele: 1234)
echo Pri prvnim spusteni povolte Pythonu pristup v siti ve Windows.
python server.py 8000 1234
pause
