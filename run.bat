@echo off
setlocal enabledelayedexpansion
title Learnzzy - Local Runner
color 0B

:: =========================================================
:: Learnzzy - Play. Think. Learn.
:: run.bat - One-click local runner for Windows
:: Usage:
::   run.bat           -> interactive menu
::   run.bat dev       -> npm run dev  (hot reload, http://localhost:3000)
::   run.bat prod      -> npm run build + npm start (production)
::   run.bat docker    -> docker compose up --build
::   run.bat seed      -> seed MongoDB content pools
:: =========================================================

if /I "%~1"=="dev" goto :DEV
if /I "%~1"=="prod" goto :PROD
if /I "%~1"=="docker" goto :DOCKER
if /I "%~1"=="seed" goto :SEED
if /I "%~1"=="help" goto :HELP
if /I "%~1"=="--help" goto :HELP
if /I "%~1"=="-h" goto :HELP

:MENU
cls
echo ========================================================
echo   Learnzzy - Play. Think. Learn.  (v0.1.0)
echo ========================================================
echo   1) Dev mode     - npm run dev   (fast, hot reload)
echo   2) Prod mode    - npm run build + npm start
echo   3) Docker       - docker compose up --build
echo   4) Seed DB      - node scripts/seed.mjs
echo   5) Setup Admin  - create .env.local admin credentials
echo   6) Typecheck + Tests + Build verification
echo   7) Exit
echo ========================================================
echo   Current dir: %CD%
echo   Node: 
call node --version 2>nul || echo   [NOT FOUND]
echo   NPM:
call npm --version 2>nul || echo   [NOT FOUND]
echo ========================================================
set /p CHOICE=Select option [1-7]: 
if "%CHOICE%"=="1" goto :DEV
if "%CHOICE%"=="2" goto :PROD
if "%CHOICE%"=="3" goto :DOCKER
if "%CHOICE%"=="4" goto :SEED
if "%CHOICE%"=="5" goto :ADMIN
if "%CHOICE%"=="6" goto :VERIFY
if "%CHOICE%"=="7" exit /b 0
echo Invalid choice.
pause
goto :MENU

:HELP
echo Usage: run.bat [dev^|prod^|docker^|seed^|help]
echo.
echo   dev     Run Next.js dev server (http://localhost:3000)
echo   prod    Build and run production server
echo   docker  Run via Docker Compose (needs Docker Desktop)
echo   seed    Seed MongoDB content pools (needs MONGODB_URI)
echo.
echo No argument - opens interactive menu.
exit /b 0

:CHECK_NODE
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install Node 18+ from https://nodejs.org
  pause
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm not found. Reinstall Node.js.
  pause
  exit /b 1
)
exit /b 0

:ENSURE_DEPS
if not exist "node_modules\" (
  echo [INFO] Installing dependencies - this may take a minute...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
) else (
  echo [OK] Dependencies present.
)
exit /b 0

:ENSURE_ENV
if not exist ".env.local" (
  echo [WARN] .env.local not found - creating from .env.example
  if exist ".env.example" (
    copy /Y ".env.example" ".env.local" >nul
    echo [INFO] Created .env.local from .env.example:
    echo   - MONGODB_URI=mongodb://127.0.0.1:27018/learnzzy_dev  ^(host -^> Docker mongo via 27018:27017)
    echo   - REDIS_URL=redis://127.0.0.1:6379                     ^(host -^> Docker redis via 6379:6379)
    echo   - Inside Docker, web/worker use mongo:27017 / redis:6379 automatically ^(see docker-compose.yml)
    echo   - ADMIN_* credentials - run: run.bat and choose 5 or run node scripts/admin-setup.mjs YourPassword123
  ) else (
    echo MONGODB_URI=mongodb://127.0.0.1:27018/learnzzy_dev> ".env.local"
    echo MONGODB_DB_NAME=learnzzy_dev>> ".env.local"
    echo REDIS_URL=redis://127.0.0.1:6379>> ".env.local"
    echo [INFO] Created minimal .env.local with Docker-mapped ports
  )
  echo [INFO] You can still run without MongoDB/Redis - gameplay falls back to deterministic local content.
) else (
  echo [OK] .env.local present - MONGODB_URI and REDIS_URL point to Docker via 127.0.0.1 when Docker is running.
)
exit /b 0

:ENSURE_DOCKER_ENV
if not exist ".env" (
  echo [INFO] Creating local .env for Docker Compose interpolation...
  call node scripts/docker-env.mjs
  if errorlevel 1 (
    echo [ERROR] Could not create .env for Docker Compose.
    pause
    exit /b 1
  )
) else (
  echo [OK] .env present for Docker Compose.
)
exit /b 0

:DEV
call :CHECK_NODE || exit /b 1
call :ENSURE_DEPS || exit /b 1
call :ENSURE_ENV
echo.
echo ========================================================
echo  Starting DEV server - http://localhost:3000
echo  Play: http://localhost:3000/play
echo  Admin: http://localhost:3000/admin
echo  Press Ctrl+C to stop.
echo ========================================================
call npm run dev
goto :END

:PROD
call :CHECK_NODE || exit /b 1
call :ENSURE_DEPS || exit /b 1
call :ENSURE_ENV
echo.
echo [INFO] Building production bundle...
call npm run build
if errorlevel 1 (
  echo [ERROR] Build failed. Check errors above.
  pause
  exit /b 1
)
echo.
echo ========================================================
echo  Starting PROD server - http://localhost:3000
echo  Play: http://localhost:3000/play
echo  Admin: http://localhost:3000/admin
echo  Press Ctrl+C to stop.
echo ========================================================
call npm start
goto :END

:DOCKER
echo [INFO] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker CLI not found or not runnable.
  echo   1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/
  echo   2. If Docker Desktop IS installed but this persists, a stray file
  echo      C:\windows\system32\docker may be shadowing docker.exe.
  echo      From an elevated prompt run: del C:\windows\system32\docker
  echo      Then restart your terminal and try again.
  pause
  exit /b 1
)
docker info >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker CLI works but the daemon is not reachable.
  echo   Start Docker Desktop and wait until it shows green/running,
  echo   then run this option again.
  pause
  exit /b 1
)
docker compose version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] 'docker compose' plugin not found. Update Docker Desktop to a
  echo   recent version ^(Compose v2 is bundled since 2021^), then retry.
  pause
  exit /b 1
)
echo [OK] Docker daemon reachable.
call :ENSURE_ENV
call :ENSURE_DOCKER_ENV
echo [INFO] MONGODB_URI and REDIS_URL are provided by Docker containers:
echo   - mongo:27017  -^> host 127.0.0.1:27018  ^(host port 27018 avoids clashes
echo     with other local MongoDB instances on default 27017^)
echo   - redis:6379   -^> host 127.0.0.1:6379   ^(exposed in docker-compose.yml)
echo   - Inside Docker: web uses mongodb://mongo:27017/learnzzy and redis://redis:6379
echo     ^(agent jobs run in-process in web; see docker-compose.yml note^)
echo   - Outside Docker: npm run dev uses mongodb://127.0.0.1:27018/learnzzy_dev and redis://127.0.0.1:6379
echo [INFO] Validating compose file...
docker compose config >nul 2>&1
if errorlevel 1 (
  echo [ERROR] docker-compose.yml failed validation. Run 'docker compose config'
  echo   manually to see details.
  pause
  exit /b 1
)
echo [INFO] Starting Docker Compose - http://localhost:3000
echo [INFO] This builds web + mongo + redis ^(first build downloads images, be patient^).
docker compose up --build
if errorlevel 1 (
  echo.
  echo [ERROR] Docker Compose exited with an error. Common causes:
  echo   - Port 3000/27018/6379 already in use ^(see container list below^)
  echo   - Image pull blocked by proxy/VPN ^(retry or pull manually^)
  echo   - Not enough disk for images ^(docker system prune frees space^)
  echo.
  echo [INFO] Running containers right now:
  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
  echo.
  echo [INFO] If another container owns a needed port, either stop it
  echo   ^(docker stop NAME^) or change our host port in docker-compose.yml
  echo   ^(and match MONGODB_URI/REDIS_URL in .env.local^).
  pause
  exit /b 1
)
goto :END

:SEED
call :CHECK_NODE || exit /b 1
if not exist ".env.local" (
  echo [ERROR] .env.local missing. Create it first with MONGODB_URI.
  pause
  exit /b 1
)
echo [INFO] Seeding MongoDB - MONGODB_URI from .env.local
call npm run seed
if errorlevel 1 (
  echo [ERROR] Seed failed. Is MongoDB running?
  echo  - Local: mongod --dbpath .dev/mongod  or  net start MongoDB
  echo  - Docker: docker compose up mongo -d
  echo  - Atlas: set MONGODB_URI to your cluster URI
)
pause
if "%~1"=="seed" exit /b 0
goto :MENU

:ADMIN
call :CHECK_NODE || exit /b 1
echo.
echo Admin setup - generates ADMIN_EMAIL / ADMIN_PASSWORD_HASH / ADMIN_AUTH_SECRET
echo  Password must be at least 12 characters.
echo.
set /p ADMINPW=Enter admin password (min 12 chars): 
if "%ADMINPW%"=="" (
  echo [ERROR] Password cannot be empty.
  pause
  goto :MENU
)
call node scripts/admin-setup.mjs "%ADMINPW%"
echo.
echo [INFO] Copy the 3 lines above into your .env.local (append, don't replace existing MONGODB_URI/REDIS_URL)
echo [INFO] Example .env.local after append:
echo   MONGODB_URI=mongodb://127.0.0.1:27018/learnzzy_dev
echo   MONGODB_DB_NAME=learnzzy_dev
echo   REDIS_URL=redis://127.0.0.1:6379
echo   ADMIN_EMAIL=admin@learnzzy.local
echo   ADMIN_PASSWORD_HASH=scrypt$...
echo   ADMIN_AUTH_SECRET=...
echo   ^(Docker web/worker will still use mongo:27017 / redis:6379 internally^)
echo.
pause
goto :MENU

:VERIFY
call :CHECK_NODE || exit /b 1
call :ENSURE_DEPS || exit /b 1
echo [INFO] Running typecheck...
call npm run typecheck
if errorlevel 1 goto :VERIFY_FAIL
echo [INFO] Running lint...
call npm run lint
if errorlevel 1 goto :VERIFY_FAIL
echo [INFO] Running tests...
call npm test
if errorlevel 1 goto :VERIFY_FAIL
echo [INFO] Building...
call npm run build
if errorlevel 1 goto :VERIFY_FAIL
echo.
echo [OK] All checks passed!
goto :VERIFY_END
:VERIFY_FAIL
echo [FAIL] Verification failed - see errors above.
:VERIFY_END
pause
if "%~1" neq "" exit /b 0
goto :MENU

:END
echo.
echo [INFO] Server stopped.
pause
endlocal
