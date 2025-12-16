# Script de configuración automática para GitHub
Write-Host "Iniciando configuración de Git..." -ForegroundColor Cyan

# Configuración de Identidad (Necesario para corregir el error)
Write-Host "---- Configuración de Usuario ----" -ForegroundColor Yellow
$email = Read-Host "Introduce tu correo electrónico de GitHub"
$name = Read-Host "Introduce tu nombre de usuario de GitHub"

git config user.email "$email"
git config user.name "$name"
Write-Host "Identidad configurada correctamente." -ForegroundColor Green


# Inicializar
git init
if ($LASTEXITCODE -eq 0) { Write-Host "Repositorio inicializado." -ForegroundColor Green }

# Agregar archivos
git add .
Write-Host "Archivos agregados al área de preparación." -ForegroundColor Green

# Commit
git commit -m "Initial commit - Chatbot con Vite, Supabase y Gemini"
if ($LASTEXITCODE -eq 0) { Write-Host "Commit creado." -ForegroundColor Green }

# Rama main
git branch -M main

# Configurar remoto (limpiando anterior si existe)
git remote remove origin 2>$null
git remote add origin https://github.com/Dedoctor-DD/ChatbotDD.git
Write-Host "Repositorio remoto configurado: https://github.com/Dedoctor-DD/ChatbotDD.git" -ForegroundColor Green

# Push
Write-Host "Subiendo archivos a GitHub... (Puede pedirte credenciales)" -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "¡Éxito! Tu proyecto está en GitHub." -ForegroundColor Green
}
else {
    Write-Host "Hubo un error al subir. Verifica tus credenciales o si el repositorio ya existe." -ForegroundColor Red
}

Read-Host -Prompt "Presiona Enter para salir"
