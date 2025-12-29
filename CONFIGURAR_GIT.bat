@echo off
echo ===========================================
echo   CONFIGURACION DE GIT - ChatbotDD
echo ===========================================
echo.

:: 1. Verificar si git esta instalado
set GIT_CMD=git
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Program Files\Git\cmd\git.exe" (
        echo [INFO] Git encontrado en C:\Program Files\Git\cmd\git.exe
        set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"
    ) else (
        echo [ERROR] Git no esta instalado o no esta en el PATH.
        echo Por favor instala Git desde: https://git-scm.com/download/win
        pause
        exit /b 1
    )
)

echo [OK] Git encontrado.
echo.

:: 2. Configurar el repositorio
echo Configurando repositorio remoto...
echo URL objetivo: https://github.com/Dedoctor-DD/ChatbotDD

:: Eliminar origin existente si existe para asegurar limpieza
"%GIT_CMD%" remote remove origin 2>nul
"%GIT_CMD%" remote remove upstream 2>nul

:: Agregar el nuevo origin correcto
"%GIT_CMD%" remote add origin https://github.com/Dedoctor-DD/ChatbotDD

:: Verificar configuracion
echo.
echo Verificando configuracion final:
"%GIT_CMD%" remote -v

echo.
echo ===========================================
echo   CONFIGURACION COMPLETADA
echo ===========================================
echo Ahora puedes intentar hacer push/pull normalmente.
pause
