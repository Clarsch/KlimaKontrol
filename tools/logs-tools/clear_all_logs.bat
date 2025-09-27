@echo off
REM KlimaKontrol Log Clearing Script for Windows
REM This script clears all logs including PM2 logs and KlimaKontrol application logs

echo 🧹 KlimaKontrol Log Clearing Tool
echo =====================================

REM Configuration
set PM2_LOGS_DIR=%USERPROFILE%\.pm2\logs
set KLIMAKONTROL_LOGS_DIR=C:\klimakontrol\logs
set PROJECT_LOGS_DIR=%~dp0..\logs
set DATA_PROVIDER_LOGS_DIR=%~dp0..\tools-submodule\data_provider\logs

REM Check for command line arguments
if "%1"=="--help" goto :help
if "%1"=="-h" goto :help
if "%1"=="--force" goto :force
if "%1"=="-f" goto :force
if "%1"=="--dry-run" goto :dryrun
if "%1"=="-d" goto :dryrun

REM Normal execution
goto :main

:help
echo KlimaKontrol Log Clearing Tool
echo.
echo Usage: %0 [OPTIONS]
echo.
echo Options:
echo   --help, -h     Show this help message
echo   --force, -f    Skip confirmation prompt
echo   --dry-run, -d  Show what would be cleared without actually clearing
echo.
echo This script clears logs from:
echo   - PM2 logs (%%USERPROFILE%%\.pm2\logs\)
echo   - KlimaKontrol logs (C:\klimakontrol\logs\)
echo   - Project logs (project\logs\)
echo   - Data provider logs (tools-submodule\data_provider\logs\)
goto :end

:dryrun
echo ℹ️  Dry run mode: showing what would be cleared...
echo.
echo Would clear logs from:
echo   - PM2 logs: %PM2_LOGS_DIR%
echo   - KlimaKontrol logs: %KLIMAKONTROL_LOGS_DIR%
echo   - Project logs: %PROJECT_LOGS_DIR%
echo   - Data provider logs: %DATA_PROVIDER_LOGS_DIR%
echo.
goto :end

:force
echo ℹ️  Force mode: clearing all logs without confirmation...
goto :clear

:main
echo ℹ️  Current log sizes:
call :show_sizes
echo.
echo ⚠️  This will clear ALL log files. Continue? (y/N)
set /p response=
if /i not "%response%"=="y" (
    echo ℹ️  Log clearing cancelled
    goto :end
)

echo.
echo ℹ️  Starting log clearing process...

:clear
REM Clear PM2 logs
if exist "%PM2_LOGS_DIR%" (
    echo ℹ️  Clearing PM2 logs in: %PM2_LOGS_DIR%
    del /q "%PM2_LOGS_DIR%\*.log" 2>nul
    del /q "%PM2_LOGS_DIR%\*.out" 2>nul
    del /q "%PM2_LOGS_DIR%\*.err" 2>nul
    echo ✅ PM2 logs cleared
) else (
    echo ⚠️  PM2 logs directory does not exist: %PM2_LOGS_DIR%
)

REM Clear KlimaKontrol logs
if exist "%KLIMAKONTROL_LOGS_DIR%" (
    echo ℹ️  Clearing KlimaKontrol logs in: %KLIMAKONTROL_LOGS_DIR%
    del /q "%KLIMAKONTROL_LOGS_DIR%\*.log" 2>nul
    del /q "%KLIMAKONTROL_LOGS_DIR%\*.out" 2>nul
    del /q "%KLIMAKONTROL_LOGS_DIR%\*.err" 2>nul
    echo ✅ KlimaKontrol logs cleared
) else (
    echo ⚠️  KlimaKontrol logs directory does not exist: %KLIMAKONTROL_LOGS_DIR%
)

REM Clear project logs
if exist "%PROJECT_LOGS_DIR%" (
    echo ℹ️  Clearing project logs in: %PROJECT_LOGS_DIR%
    del /q "%PROJECT_LOGS_DIR%\*.log" 2>nul
    del /q "%PROJECT_LOGS_DIR%\*.out" 2>nul
    del /q "%PROJECT_LOGS_DIR%\*.err" 2>nul
    echo ✅ Project logs cleared
) else (
    echo ⚠️  Project logs directory does not exist: %PROJECT_LOGS_DIR%
)

REM Clear data provider logs
if exist "%DATA_PROVIDER_LOGS_DIR%" (
    echo ℹ️  Clearing data provider logs in: %DATA_PROVIDER_LOGS_DIR%
    del /q "%DATA_PROVIDER_LOGS_DIR%\*.log" 2>nul
    del /q "%DATA_PROVIDER_LOGS_DIR%\*.out" 2>nul
    del /q "%DATA_PROVIDER_LOGS_DIR%\*.err" 2>nul
    echo ✅ Data provider logs cleared
) else (
    echo ⚠️  Data provider logs directory does not exist: %DATA_PROVIDER_LOGS_DIR%
)

echo.
echo ✅ Log clearing completed!

REM Restart PM2 processes if available
where pm2 >nul 2>&1
if %errorlevel%==0 (
    echo ℹ️  Restarting PM2 processes for clean logs...
    pm2 restart all 2>nul || echo ⚠️  PM2 restart failed or no processes running
)

goto :end

:show_sizes
REM Show current log sizes (simplified for Windows)
if exist "%PM2_LOGS_DIR%" (
    echo   PM2 logs: %PM2_LOGS_DIR%
)
if exist "%KLIMAKONTROL_LOGS_DIR%" (
    echo   KlimaKontrol logs: %KLIMAKONTROL_LOGS_DIR%
)
if exist "%PROJECT_LOGS_DIR%" (
    echo   Project logs: %PROJECT_LOGS_DIR%
)
if exist "%DATA_PROVIDER_LOGS_DIR%" (
    echo   Data provider logs: %DATA_PROVIDER_LOGS_DIR%
)
goto :eof

:end
pause
