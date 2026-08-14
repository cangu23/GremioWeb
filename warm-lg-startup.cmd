@echo off
rem Aplica el balance de color del LG al iniciar sesion (verde 90%, azul 74%)
timeout /t 8 /nobreak > nul
powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\Users\sebas\OneDrive\Escritorio\Gremioweb\warm-lg.ps1" -GreenScale 0.90 -BlueScale 0.74
