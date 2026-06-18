# 🎯 Realme Sorteo — Sorteador de Números

Un sorteador de números premium con diseño futurista inspirado en la identidad visual de **Realme**, protagonizado por la mascota **Realmeow**. Desarrollado con HTML, CSS y JavaScript vanilla, sin dependencias externas.

---

## 📸 Características

- 🎰 **Sorteo animado** con efecto de ruleta y desaceleración progresiva
- 🎊 **Confeti de celebración** con explosión de partículas al revelar el ganador
- 🐱 **Avatar Realmeow** con tilt 3D reactivo al mouse y animación de celebración
- 🔊 **Sistema de audio sintetizado** (Web Audio API) — ticks, redoble de suspenso y fanfarria de victoria
- ✨ **Partículas de fondo** interactivas que reaccionan al cursor
- 📜 **Historial de ganadores** persistente vía `localStorage` (últimos 10 sorteos)
- 🖱️ **Cursor personalizado** con efecto de lag elástico
- 🌟 **Parallax de fondo** reactivo al scroll y movimiento del mouse
- 📱 **Responsive** — se adapta a pantallas desde mobile hasta desktop

---

## 🗂️ Estructura del Proyecto

```
realme-sorteo/
├── index.html          # Estructura HTML principal
├── styles.css          # Sistema de diseño, animaciones y layout
├── app.js              # Lógica del sorteo, audio, partículas y animaciones
├── avatar.png          # Mascota Realmeow (PNG con transparencia)
├── realmeow.jpg        # Imagen de fondo parallax
└── README.md
```

---

## 🚀 Uso

No requiere instalación ni servidor. Simplemente abre `index.html` en cualquier navegador moderno:

```bash
# Opción 1: abrir directamente
open index.html

# Opción 2: con un servidor local (recomendado para evitar restricciones CORS)
npx serve .
# o
python -m http.server 8080
```

Luego visita `http://localhost:8080` en tu navegador.

---

## 🎮 Cómo usar el sorteador

1. Ingresa el **Número Inicial** y el **Número Final** del rango
2. Haz clic en **SORTEAR GANADOR**
3. Espera la animación de ruleta (~3.5 segundos)
4. El número ganador aparece con efecto de celebración — confeti, fanfarria y animación del avatar
5. El resultado se guarda automáticamente en el **historial de ganadores**

> Puedes limpiar el historial en cualquier momento con el botón **Limpiar Historial**.

---

## ⚙️ Configuración del Sorteo

| Campo | Descripción | Valor por defecto |
|---|---|---|
| Número Inicial | Límite inferior del rango | `1` |
| Número Final | Límite superior del rango | `100` |

El número ganador se elige con `Math.random()` dentro del rango `[min, max]` inclusive.

---

## 🔊 Sistema de Audio

El audio está **activado por defecto**. Usa el botón 🔊 en la esquina de la tarjeta para activarlo o desactivarlo.

| Sonido | Cuándo suena |
|---|---|
| Ticks de triángulo | Durante el giro de la ruleta (pitch sube progresivamente) |
| Redoble de suspenso | En los últimos segundos del sorteo |
| Fanfarria (acorde C Major 9) | Al revelar el ganador |

Todo el audio es **sintetizado en tiempo real** vía Web Audio API — no hay archivos de audio externos.

---

## 🎨 Sistema de Diseño

| Variable | Valor |
|---|---|
| Color principal | `#ffc800` (Realme Yellow) |
| Color acento | `#00f0ff` (Neon Blue) |
| Fondo | `#07070a` (Deep Dark) |
| Fuente UI | Outfit (Google Fonts) |
| Fuente digital | Orbitron (Google Fonts) |

---

## 🌐 Compatibilidad

| Navegador | Soporte |
|---|---|
| Chrome 90+ | ✅ Completo |
| Firefox 88+ | ✅ Completo |
| Safari 14+ | ✅ Completo |
| Edge 90+ | ✅ Completo |
| Mobile (iOS/Android) | ⚠️ Funcional (cursor personalizado desactivado) |

> **Nota:** El cursor personalizado se oculta automáticamente en dispositivos táctiles ya que `cursor: none` no aplica en mobile.

---

## 📦 Dependencias

**Ninguna.** El proyecto es 100% vanilla — solo HTML, CSS y JavaScript nativo.

Las únicas cargas externas son las fuentes de Google Fonts:
- [Outfit](https://fonts.google.com/specimen/Outfit)
- [Orbitron](https://fonts.google.com/specimen/Orbitron)

---

## 📄 Licencia

© 2026 Realme. Todos los derechos reservados.  
Desarrollado por **Eligio Ayala**.
