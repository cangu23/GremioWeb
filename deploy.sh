#!/usr/bin/env bash

# ==============================================================================
# GremioWeb - Automated Production Deployment Script
# Designed for Ubuntu Server / CasaOS with Docker & Cloudflare Tunnel
# ==============================================================================

set -euo pipefail

# --- Visual Colors and Styling ---
BOLD='\033[1m'
RESET='\033[0m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'

# Track total execution time
START_TIME=$(date +%s)

log_step() {
    echo -e "\n${BOLD}${CYAN}[PASO] $1${RESET}"
}

log_info() {
    echo -e "${PURPLE}ℹ️  $1${RESET}"
}

log_success() {
    echo -e "${GREEN}✅ $1${RESET}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${RESET}"
}

log_error() {
    echo -e "${RED}❌ $1${RESET}"
}

# Banner
echo -e "${BOLD}${CYAN}"
echo "========================================================"
echo "    🚀 GREMIOWEB - SISTEMA DE DESPLIEGUE AUTOMÁTICO 🚀"
echo "========================================================"
echo -e "${RESET}"

# 1. Verificación y Lectura Segura de Variables de Entorno
log_step "1. Cargando variables de entorno desde .env de forma segura..."

if [ ! -f ".env" ]; then
    log_error "¡El archivo '.env' no existe en $(pwd)!"
    if [ -f ".env.example" ]; then
        log_info "Creando .env a partir de .env.example. Por favor configura tus llaves y contraseñas."
        cp .env.example .env
    fi
    exit 1
fi

# Cargar variables de forma silenciosa sin imprimirlas en consola
set -a
{ set +x; } 2>/dev/null
source .env
set +a
log_success "Variables de entorno cargadas correctamente sin exponer credenciales."

# Verificación de variables obligatorias
MISSING_VARS=()
if [ -z "${TUNNEL_TOKEN:-}" ]; then MISSING_VARS+=("TUNNEL_TOKEN"); fi
if [ -z "${POSTGRES_PASSWORD:-}" ]; then MISSING_VARS+=("POSTGRES_PASSWORD"); fi

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    log_error "Faltan las siguientes variables obligatorias en el archivo .env: ${MISSING_VARS[*]}"
    log_warning "Edita el archivo .env y vuelve a ejecutar este script."
    exit 1
fi

# 2. Compilación y Levantamiento de Contenedores
log_step "2. Compilando y levantando contenedores Docker..."
log_info "Ejecutando 'docker compose up -d --build' con límites de memoria aplicados..."

docker compose up -d --build --remove-orphans

log_success "¡Contenedores compilados y ejecutándose en segundo plano!"

# 3. Verificación de Estado y Healthcheck
log_step "3. Verificando el estado de salud de los servicios..."
sleep 5

docker compose ps

# 4. Autolimpieza Post-Despliegue
log_step "4. Ejecutando autolimpieza post-despliegue para liberar espacio en disco..."

log_info "Eliminando imágenes huérfanas/intermedias y caché de compilación Docker..."
docker image prune -f > /dev/null 2>&1 || true
docker builder prune -f > /dev/null 2>&1 || true

log_info "Limpiando carpetas de caché temporales de Next.js y Node..."
rm -rf frontend/.next/cache > /dev/null 2>&1 || true
rm -rf backend/dist/.cache > /dev/null 2>&1 || true
rm -rf .cache > /dev/null 2>&1 || true

log_success "Autolimpieza completada con éxito. Espacio de disco optimizado."

# 5. Resumen de Consumo de Recursos (RAM y CPU)
log_step "5. Resumen de recursos utilizados (Límites de RAM para no afectar Crafty/Minecraft):"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Cálculo del tiempo total transcurrido
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
MINUTES=$((ELAPSED / 60))
SECONDS=$((ELAPSED % 60))

echo -e "\n${BOLD}${GREEN}========================================================"
echo "    🎉 DESPLIEGUE COMPLETADO CON ÉXITO EN ${MINUTES}m ${SECONDS}s 🎉"
echo "========================================================${RESET}\n"
