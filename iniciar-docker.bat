@echo off
setlocal
title TFG Plataforma 3D - Docker

:: ============================================================
::  Lanzador Docker de la plataforma 3D
::  Doble clic para construir, arrancar y abrir el navegador
:: ============================================================

echo.
echo  ================================================
echo     PLATAFORMA 3D  -  MODO DOCKER
echo  ================================================
echo.

:: Guardar la ruta del proyecto (donde esta este .bat)
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

:: -------------------------------------------------
:: 0. Comprobar que Docker esta instalado y corriendo
:: -------------------------------------------------
where docker >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [ERROR] Docker no esta instalado en este equipo.
    echo.
    echo  Descargalo de: https://www.docker.com/products/docker-desktop/
    echo  Instalalo, reinicia el PC, y vuelve a hacer doble clic aqui.
    echo.
    pause
    exit /b 1
)

echo  Comprobando que Docker Desktop este arrancado...
docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [AVISO] Docker esta instalado pero NO esta arrancado.
    echo.
    echo  Abre Docker Desktop, espera a que aparezca "Engine running"
    echo  y vuelve a hacer doble clic en este archivo.
    echo.
    pause
    exit /b 1
)

echo  [OK] Docker detectado y funcionando
echo.

:: -------------------------------------------------
:: 1. Construir y arrancar los contenedores
:: -------------------------------------------------
echo  Construyendo y arrancando contenedores...
echo  (La primera vez puede tardar varios minutos)
echo.

docker compose up --build -d
if errorlevel 1 (
    echo.
    echo  =============================================================
    echo   [ERROR] Fallo al construir o arrancar los contenedores.
    echo  =============================================================
    echo   Revisa los mensajes de error arriba.
    echo.
    echo   Si el error indica "Ports are not available" o problemas de
    echo   permisos al vincular puertos ^(forbidden by its access permissions^):
    echo.
    echo   El servicio Windows NAT ^(winnat^) suele reservar estos puertos.
    echo   Para solucionarlo:
    echo     1. Abre el Simbolo del sistema ^(CMD^) como Administrador.
    echo     2. Ejecuta los siguientes comandos:
    echo.
    echo          net stop winnat
    echo          net start winnat
    echo.
    echo     3. Vuelve a ejecutar este script ^(iniciar-docker.bat^).
    echo  =============================================================
    echo.
    pause
    exit /b 1
)

:: Abrir ventana con los logs del backend en tiempo real
start "Logs Backend" cmd /c "cd /d "%PROJECT_DIR%" && title Logs - Backend && docker compose logs -f backend"

echo.

:: -------------------------------------------------
:: 2. Esperar a que el frontend este listo
:: -------------------------------------------------
echo  Esperando a que la aplicacion este lista...
echo.

set "READY=0"
set "RETRIES=0"
set "MAX_RETRIES=30"

:wait_loop
if %RETRIES% geq %MAX_RETRIES% (
    echo  [AVISO] Tiempo de espera agotado. Abriendo el navegador de todas formas...
    goto open_browser
)

powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:5173' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    set "READY=1"
    goto open_browser
)

set /a RETRIES+=1
timeout /t 2 /nobreak >nul
goto wait_loop

:open_browser
echo.
if %READY% equ 1 (
    echo  ================================================
    echo     [OK] TODO LISTO - ABRIENDO NAVEGADOR
    echo  ================================================
) else (
    echo  ================================================
    echo     Abriendo navegador (puede tardar un poco)
    echo  ================================================
)
echo.

start "" "http://localhost:5173"

echo.
echo  -------------------------------------------------
echo   App:     http://localhost:5173
echo   Backend: http://localhost:8080
echo  -------------------------------------------------
echo.
echo  NO cierres esta ventana mientras uses la app.
echo  Pulsa cualquier tecla para APAGAR los contenedores...
echo.
pause >nul

:: -------------------------------------------------
:: 3. Apagar contenedores
:: -------------------------------------------------
echo.
echo  Apagando contenedores...
docker compose down
echo  Todo cerrado.
timeout /t 3 /nobreak >nul
