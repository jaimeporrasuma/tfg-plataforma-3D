@echo off
setlocal enabledelayedexpansion
title  Logs - Server 3D

echo.
echo  ======================================================
echo     PUENTE API PARA COMFYUI - MODO DOCKER
echo  ======================================================
echo.

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

:: -------------------------------------------------
:: 0. Comprobar que existe el archivo .env
:: -------------------------------------------------
if not exist ".env" (
    echo  [ERROR] Faltan las variables de entorno.
    echo.
    echo  1. Haz una copia del archivo ".env.example".
    echo  2. Renombra la copia a ".env".
    echo  3. Edita el archivo ".env" para poner tu ruta de ComfyUI.
    echo.
    echo  Vuelve a ejecutar este script cuando lo hayas hecho.
    echo.
    pause
    exit /b 1
)

:: -------------------------------------------------
:: 1. Comprobar que Docker esta corriendo
:: -------------------------------------------------
where docker >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Docker no esta instalado en este equipo.
    pause
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo  [AVISO] Docker esta instalado pero NO esta arrancado.
    echo  Abre Docker Desktop, espera a que cargue y vuelve a intentarlo.
    pause
    exit /b 1
)

echo  [OK] Entorno .env y Docker detectados correctamente.
echo.

:: -------------------------------------------------
:: 2. Construir y arrancar el servidor
:: -------------------------------------------------
echo  Levantando el servidor GPU puente...
docker compose up --build -d

if errorlevel 1 (
    echo.
    echo  [ERROR] Fallo al iniciar el contenedor.
    pause
    exit /b 1
)

echo.
echo  ======================================================
echo     [OK] SERVIDOR PUENTE INICIADO
echo  ======================================================
echo.
echo  Escuchando peticiones en: http://localhost:3001
echo.
echo  Mostrando logs en tiempo real (Puedes minimizar esta ventana)
echo  ------------------------------------------------------

:: Mostrar logs en esta misma ventana para que el tutor vea cuando llega la imagen
docker compose logs -f

:: Si el usuario cierra con Ctrl+C, limpiamos la casa
echo.
echo  Apagando contenedor del Servidor GPU...
docker compose down
timeout /t 2 /nobreak >nul