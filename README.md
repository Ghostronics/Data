# Agente GG — Gamma Trading System

Bot de Telegram para análisis pre-sesión institucional con GEX/DEX, mecánica de opciones y order flow.

---

## Qué hace

- Analiza capturas de **MenthorQ** (NQ, ES, VIX GEX) enviadas desde el móvil
- Interpreta **GEX + DEX** para determinar régimen gamma y sesgo direccional
- Aplica filtros **VVIX y SKEW** para ajustar parámetros
- Genera plan del día con **Setup A + B**, entrada, stop, target y R:R
- Responde preguntas sobre mecánica gamma y order flow
- Mantiene historial de conversación por sesión

---

## Requisitos

- Python 3.11+
- Cuenta en [Anthropic Console](https://console.anthropic.com/) (API key)
- Bot de Telegram creado con [@BotFather](https://t.me/BotFather)

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd Data

# 2. Crear entorno virtual
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus claves
```

---

## Configuración

Edita el archivo `.env`:

| Variable | Descripción |
|---|---|
| `TELEGRAM_TOKEN` | Token del bot (obtenlo con @BotFather → `/newbot`) |
| `ANTHROPIC_API_KEY` | API key de Anthropic |
| `ALLOWED_USER_IDS` | IDs de Telegram autorizados (vacío = sin restricción) |

Para obtener tu ID de Telegram: habla con [@userinfobot](https://t.me/userinfobot).

---

## Ejecutar

```bash
python bot.py
```

El bot queda corriendo. Ábrelo en Telegram y usa `/start`.

---

## Comandos

| Comando | Acción |
|---|---|
| `/start` | Inicia el bot y muestra instrucciones |
| `/reset` | Limpia el historial de la sesión actual |

---

## Uso desde el móvil

1. Abre Telegram y busca tu bot
2. **Captura de MenthorQ** → Comparte la imagen directamente en el chat
   - Puedes añadir un pie de foto con contexto extra (ej: `"VVIX=115, SKEW=138"`)
3. **Texto** → Escribe los niveles manualmente o haz preguntas conceptuales
4. El agente responde con el análisis completo o la consulta resuelta

---

## Despliegue 24/7 (opcional)

Para mantener el bot activo permanentemente, puedes desplegarlo en:

- **Railway** — gratis, conecta el repo de GitHub directamente
- **Render** — free tier con worker service
- **VPS / servidor propio** — corre `python bot.py` con `screen` o `systemd`

---

## Estructura

```
Data/
├── bot.py           # Bot de Telegram + agente GG
├── requirements.txt # Dependencias Python
├── .env.example     # Plantilla de variables de entorno
└── README.md
```
