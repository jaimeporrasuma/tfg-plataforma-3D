@echo off
setlocal enabledelayedexpansion
title TFG Plataforma 3D - Servidor 3D

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
    echo  =============================================================
    echo   [ERROR] Fallo al iniciar el contenedor.
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
    echo     3. Vuelve a ejecutar este script.
    echo  =============================================================
    echo.
    pause
    exit /b 1
)

echo.
echo  ======================================================
echo     [OK] SERVIDOR PUENTE INICIADO
echo  ======================================================
echo.
echo  Servidor GPU en ejecucion y listo para recibir peticiones del backend.
echo.
:: Abrir ventana con los logs del servidor 3D en tiempo real
start "Logs Server 3D" cmd /c "cd /d "%PROJECT_DIR%" && title Logs - Server 3D && docker compose logs -f"

echo.
echo  ------------------------------------------------------
echo   Servidor 3D (GPU Bridge): http://localhost:3001
echo   Logs en tiempo real abiertos en una ventana separada.
echo  ------------------------------------------------------
echo.
echo  NO cierres esta ventana mientras uses el Servidor 3D.
echo  Pulsa cualquier tecla para APAGAR el servidor...
echo.
pause >nul

:: -------------------------------------------------
:: 3. Apagar contenedor
:: -------------------------------------------------
echo.
echo  Apagando contenedor del Servidor GPU...
docker compose down
echo  Todo cerrado.
timeout /t 2 /nobreak >nul