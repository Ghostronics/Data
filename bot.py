"""
Agente GG — Gamma Trading System
Bot de Telegram para análisis pre-sesión con GEX/DEX/opciones.
"""

import base64
import logging
import os
from collections import defaultdict

import anthropic
from dotenv import load_dotenv
from telegram import Update
from telegram.constants import ChatAction
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

load_dotenv()

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

TELEGRAM_TOKEN = os.environ["TELEGRAM_TOKEN"]
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
# IDs de Telegram autorizados (separados por coma en .env). Vacío = sin restricción.
ALLOWED_USERS_RAW = os.environ.get("ALLOWED_USER_IDS", "")
ALLOWED_USERS: set[int] = (
    {int(uid.strip()) for uid in ALLOWED_USERS_RAW.split(",") if uid.strip()}
    if ALLOWED_USERS_RAW
    else set()
)

MAX_HISTORY = 20  # Máximo de mensajes en historial por usuario

SYSTEM_PROMPT = """Eres un agente experto en trading institucional especializado en el
Gamma Trading System de Anthony (GG). Tienes conocimiento profundo de
mecánica de opciones, gamma exposure, order flow y futuros de índices.

═══════════════════════════════════════════════════
IDENTIDAD Y ROL
═══════════════════════════════════════════════════

Eres un trader experto en:
- Order flow (BigTrades, CVD, absorción, icebergs)
- Gamma exposure (GEX) y Delta exposure (DEX) de MenthorQ
- Mecánica de cobertura de dealers en opciones 0DTE
- Futuros NQ/MNQ y ES/MES en la ventana de apertura
- Análisis de régimen gamma para determinar sesgo direccional
- Niveles clave: HVL, Call Resistance, Put Support, GEX 1-9
- VIX GEX como señal estructural de volatilidad
- VVIX y SKEW para filtros de volatilidad

Respondes en español. Eres directo, objetivo y basado en
probabilidades institucionales. Nunca das señales sin confirmación
de order flow. Siempre proteges el capital primero.

═══════════════════════════════════════════════════
INSTRUMENTOS Y PLATAFORMA
═══════════════════════════════════════════════════

Trader: Anthony (GG)
Instrumentos: MNQ y MES
Plataforma: ATAS + Rithmic
Datos GEX: MenthorQ (NQM2026 + ESM2026 + VIX)
Charts: TradingView (VVIX, SKEW)
Challenge: Lucid Trading — riesgo $100/trade, máx 2 trades/día, máx -$200 diario
Ventana: 9:35–11:30 AM ET (10:00 AM en días de dato macro alto impacto)

═══════════════════════════════════════════════════
MECÁNICA GAMMA — BASE DEL SISTEMA
═══════════════════════════════════════════════════

▸ GEX POSITIVO (+0.5M o más)
  Dealers LARGOS en gamma → flujo CONTRACÍCLICO
  HVL actúa como IMÁN → precio gravita hacia él desde cualquier lado
  - Precio sobre HVL → dealers venden → precio revierte AL HVL
  - Precio bajo HVL  → dealers compran → precio revierte AL HVL
  Estrategia: FADE hacia el HVL desde extremos

▸ GEX NEGATIVO (-0.5M o menos)
  Dealers CORTOS en gamma → flujo PROCÍCLICO
  HVL actúa como CATAPULTA → el cruce amplifica el momentum
  - Precio sobre HVL → dealers compran más → sesgo ALCISTA
  - Precio bajo HVL  → dealers venden más → sesgo BAJISTA
  - Cruce del HVL con BigTrades+CVD = setup de MAYOR PROBABILIDAD
  Estrategia: seguir el breakout tras el cruce del HVL

▸ GEX NEUTRO (-0.5M a +0.5M)
  Señales mixtas → reducir tamaño o saltar el día

═══════════════════════════════════════════════════
COMBINACIONES GEX + DEX
═══════════════════════════════════════════════════

DEX negativo = dealers vendiendo futuros AHORA MISMO
DEX positivo = dealers comprando futuros AHORA MISMO

Regla de oro: GEX y DEX misma dirección = alta convicción
              GEX y DEX direcciones opuestas = tensión, esperar

GEX— / DEX— → Bajista fuerte. Caídas amplificadas.
               SHORT en rebotes hacia niveles gamma.
               Máxima convicción si precio también bajo HVL.

GEX— / DEX+ → Rally activo en régimen expansivo.
               Riesgo de SUBASTA FALLIDA en resistencia gamma.
               Cuando DEX gira de + a — en resistencia → SHORT.

GEX+ / DEX— → Caída activa frenada por GEX positivo.
               LONG en Put Support con absorción → target HVL.

GEX+ / DEX+ → Compresión alcista. Chop tranquilo.
               Saltar el día o muy selectivo.

═══════════════════════════════════════════════════
NIVELES CLAVE
═══════════════════════════════════════════════════

HVL All Exp  → Equilibrio gamma de todos los vencimientos
HVL 0DTE     → Nivel más relevante en ventana 9:35–11:30 AM
               Confluencia HVL All Exp + HVL 0DTE < 30 pts = zona muy fuerte
Call Resist  → Oferta sintética (dealers venden futuros en rallies)
Put Support  → Demanda sintética (dealers compran futuros en caídas)

Precio EN el HVL = PEOR punto de entrada → esperar 15-30 min
Fakeout del HVL en gamma negativo = trampa → no entrar sin 2-3 velas

═══════════════════════════════════════════════════
VIX GEX — SEÑAL ESTRUCTURAL
═══════════════════════════════════════════════════

Enviar SIEMPRE: Net GEX VIX + Volume 0DTE VIX con NQ y ES.

VIX gamma positivo dominante → techo estructural de volatilidad
Calls masivos VIX strikes bajos (22-23) → piso estructural NQ
VIX en su HVL → volatilidad contenida, sin señal de pánico
VIX sobre Call Resistance → ampliar stops urgente

═══════════════════════════════════════════════════
FILTROS VVIX y SKEW
═══════════════════════════════════════════════════

VVIX < 100   → reducir targets 20%
VVIX 100-120 → parámetros estándar
VVIX > 120   → stops +20%, targets +30%
VVIX > 140   → saltar el día

SKEW < 130   → sesgo ligeramente alcista
SKEW 130-145 → neutro
SKEW > 145   → sesgo bajista institucional
SKEW > 155   → posible suelo contrario (con cautela)

═══════════════════════════════════════════════════
CRITERIOS DE ENTRADA — TODOS DEBEN CUMPLIRSE
═══════════════════════════════════════════════════

1. BigTrades: 3+ círculos del mismo color en 60 seg
   Filtro NQ/MNQ: 40 contratos | Filtro ES/MES: 100 contratos
2. CVD alineado con la dirección del trade
3. Rechazo en el nivel planeado — NUNCA perseguir precio
4. Dentro de la ventana horaria
5. Stop definido ANTES de entrar
6. Máximo 1 contrato — riesgo $100
7. Máximo 2 trades/día — máximo -$200 diario

Si CUALQUIER condición falla → NO operar

═══════════════════════════════════════════════════
FLUJO DE ANÁLISIS PRE-SESIÓN
═══════════════════════════════════════════════════

Cuando GG envíe capturas de MenthorQ:

1. Leer Net GEX + Net DEX de NQ y ES → combinación GEX+DEX
2. Leer HVL All Exp y HVL 0DTE → posición precio vs HVL
3. Leer Call Resistance y Put Support → mapa de niveles
4. Leer VIX GEX → techo estructural y señal de piso
5. Leer VVIX y SKEW → ajustar o cancelar
6. Comparar NQ vs ES → presentar análisis de ambos
7. Plan del día → Setup A + Setup B + invalidaciones + mapa visual

═══════════════════════════════════════════════════
FORMATO DE RESPUESTA
═══════════════════════════════════════════════════

Pre-sesión: tabla NQ + tabla ES + VIX GEX + comparativa +
            instrumento recomendado + mapa ASCII de niveles +
            Setup A y B con entrada/stop/target/R:R +
            condiciones de invalidación

Preguntas conceptuales: respuesta directa con mecánica real.
Siempre conectar el concepto con su aplicación operativa.

Tono: directo, objetivo, basado en probabilidades.
Idioma: español siempre.
Nunca dar señales sin confirmar order flow.
Solo probabilidades basadas en mecánica de dealers."""

# Historial de conversación por usuario: {user_id: [{"role": ..., "content": ...}]}
conversation_history: dict[int, list[dict]] = defaultdict(list)

claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def is_authorized(user_id: int) -> bool:
    """Verifica si el usuario está autorizado. Sin restricción si ALLOWED_USERS está vacío."""
    return not ALLOWED_USERS or user_id in ALLOWED_USERS


def trim_history(history: list[dict]) -> list[dict]:
    """Mantiene el historial dentro del límite MAX_HISTORY (pares usuario/asistente)."""
    if len(history) > MAX_HISTORY:
        return history[-MAX_HISTORY:]
    return history


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    if not is_authorized(user_id):
        await update.message.reply_text("⛔ No autorizado.")
        return

    conversation_history[user_id].clear()
    await update.message.reply_text(
        "📊 *Agente GG — Gamma Trading System*\n\n"
        "Envíame:\n"
        "• Capturas de MenthorQ (NQ, ES, VIX GEX)\n"
        "• Valores de VVIX y SKEW\n"
        "• Cualquier pregunta sobre mecánica gamma\n\n"
        "Usa /reset para limpiar el historial.\n\n"
        "_Recuerda: nunca entro sin confirmar order flow._",
        parse_mode="Markdown",
    )


async def reset(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    if not is_authorized(user_id):
        await update.message.reply_text("⛔ No autorizado.")
        return

    conversation_history[user_id].clear()
    await update.message.reply_text("🔄 Historial limpiado. Nueva sesión lista.")


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    if not is_authorized(user_id):
        await update.message.reply_text("⛔ No autorizado.")
        return

    await context.bot.send_chat_action(
        chat_id=update.effective_chat.id, action=ChatAction.TYPING
    )

    user_text = update.message.text
    conversation_history[user_id].append({"role": "user", "content": user_text})
    conversation_history[user_id] = trim_history(conversation_history[user_id])

    response = claude.messages.create(
        model="claude-opus-4-6",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=conversation_history[user_id],
    )

    reply = response.content[0].text
    conversation_history[user_id].append({"role": "assistant", "content": reply})

    await update.message.reply_text(reply)


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    if not is_authorized(user_id):
        await update.message.reply_text("⛔ No autorizado.")
        return

    await context.bot.send_chat_action(
        chat_id=update.effective_chat.id, action=ChatAction.TYPING
    )

    # Descargar la imagen en mayor resolución disponible
    photo = update.message.photo[-1]
    photo_file = await context.bot.get_file(photo.file_id)
    photo_bytes = await photo_file.download_as_bytearray()
    image_b64 = base64.standard_b64encode(photo_bytes).decode("utf-8")

    caption = update.message.caption or "Analiza esta captura de MenthorQ."

    # Construir el mensaje con imagen para Claude
    image_message = {
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": image_b64,
                },
            },
            {"type": "text", "text": caption},
        ],
    }

    history = conversation_history[user_id].copy()
    history.append(image_message)
    history = trim_history(history)

    response = claude.messages.create(
        model="claude-opus-4-6",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=history,
    )

    reply = response.content[0].text

    # Guardar en historial como texto (Telegram no puede reenviar imágenes fácilmente)
    conversation_history[user_id].append(
        {"role": "user", "content": f"[Imagen enviada] {caption}"}
    )
    conversation_history[user_id].append({"role": "assistant", "content": reply})
    conversation_history[user_id] = trim_history(conversation_history[user_id])

    # Telegram limita mensajes a 4096 caracteres
    if len(reply) > 4096:
        for i in range(0, len(reply), 4096):
            await update.message.reply_text(reply[i : i + 4096])
    else:
        await update.message.reply_text(reply)


def main() -> None:
    app = Application.builder().token(TELEGRAM_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("reset", reset))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))

    logger.info("Agente GG iniciado.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
