# Script para rodar a sincronização localmente
# Configure suas variáveis antes de rodar

$env:FRESHDESK_DOMAIN = "suportetryvia"
$env:FRESHDESK_API_KEY = "s9GQtphoZqeRNz7Enl"

# SUBSTITUA PELOS SEUS VALORES DO SUPABASE:
$env:SUPABASE_URL = "SUA_SUPABASE_URL"
$env:SUPABASE_SERVICE_KEY = "SUA_SUPABASE_SERVICE_KEY"

# Executar
node sync-freshdesk/sync-tickets-v2.js
