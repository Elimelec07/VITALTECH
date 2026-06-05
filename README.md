<div align="center">

# 💚 VitalTech · *CuidAR*

### *Tu bienestar importa.*

Aplicación web de salud y bienestar pensada para **acompañarte, escucharte y orientarte** en los momentos en que más lo necesitas.

[![Demo](https://img.shields.io/badge/🌐_Demo_en_vivo-Vercel-000000?style=for-the-badge)](https://brazalete.vercel.app)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](#)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-green?style=for-the-badge)](#-licencia)

</div>

---

## 📖 Acerca del proyecto

**VitalTech** (presentada en la interfaz como **CuidAR**) es una herramienta web desarrollada por estudiantes de la **Universidad del Magdalena** como aporte a la garantía del derecho a la salud. Su propósito es que cualquier persona pueda:

- Identificar de forma temprana el **riesgo de diabetes, hipertensión, infarto o accidente cerebrovascular**.
- Trabajar hacia un **peso y un estilo de vida saludables**.
- Recibir **información, acompañamiento emocional y recomendaciones** ajustadas a su nivel de riesgo.
- Usar de forma adecuada y oportuna los servicios de salud de **promoción y prevención**.

> ⚠️ **Aviso médico:** Esta herramienta **no reemplaza** la valoración, consulta ni recomendaciones de un profesional de la salud. Ante cualquier síntoma o duda, consulta a tu EPS o médico tratante.

---

## ✨ Características

| Módulo | Descripción |
|---|---|
| 🔐 **Acceso y registro** | Inicio de sesión por tipo y número de documento, con aceptación de términos y condiciones. |
| 🩺 **Test de Diabetes e Hipertensión** | Cuestionario de tamizaje para estimar el nivel de riesgo cardiometabólico. |
| 🧠 **Test Psicológico** | Evaluación de bienestar emocional con orientación según resultados. |
| 📋 **Mi Historia Clínica** | Registro y consulta del historial de salud del usuario. |
| 🔥 **Consejos de Prevención** | Recomendaciones prácticas de hábitos saludables. |
| 🏃 **Deportes** | Sugerencias de actividad física para complementar la prevención. |
| 💬 **Asistente Virtual de Salud** | Chatbot de apoyo (basado en reglas) que orienta sobre salud física, emocional y derivación en situaciones de crisis. |
| 🔔 **Notificaciones inteligentes** | Tips diarios, recordatorios de tests y alertas personalizadas según el historial. |
| 👤 **Perfil de usuario** | Datos personales y foto de perfil. |
| 🛠️ **Panel de administración** | Acceso protegido para gestión interna. |
| 🌓 **Tema claro / oscuro** | Cambio de apariencia adaptable. |
| 📱 **Diseño responsive** | Enfoque *mobile-first* con barra de navegación inferior. |

---

## 🛠️ Tecnologías

- **HTML5** — estructura semántica de las vistas.
- **CSS3** — estilos, animaciones y diseño responsive.
- **JavaScript (ES6)** — lógica de la app, tests, asistente y notificaciones.
- **Web Storage API** (`localStorage` / `sessionStorage`) — persistencia de datos en el cliente.
- **Font Awesome 6** y **Flaticon UIcons** — iconografía.
- **Vercel** — despliegue y hosting.

> El proyecto es 100 % *front-end* (vanilla JS, sin frameworks). No requiere build ni dependencias para ejecutarse.

---

## 📂 Estructura del proyecto

```
VitalTech/
└── vitaltech_web/
    ├── index.html              # Pantalla de login
    ├── HTML/
    │   ├── main.html           # Inicio / feed principal
    │   ├── register.html       # Registro de usuario
    │   ├── test-diabetes.html  # Test de diabetes e hipertensión
    │   ├── test-psicologico.html
    │   ├── historia-clinica.html
    │   ├── consejos-prevencion.html
    │   ├── deportes.html
    │   ├── asistente.html      # Asistente virtual de salud
    │   ├── perfil.html
    │   ├── admin.html          # Panel de administración
    │   ├── terminos.html
    │   └── politicas.html
    ├── CSS/
    │   ├── style.css
    │   └── sidebar.css
    ├── JS/
    │   ├── auth.js             # Autenticación
    │   ├── theme.js            # Tema claro/oscuro
    │   ├── script.js           # Lógica general
    │   ├── notifications.js    # Sistema de notificaciones
    │   └── asistente.js        # Motor del chatbot
    └── img/                    # Logos, íconos e imágenes
```

---

## 🚀 Ejecutar en local

Al ser un sitio estático, basta con clonar el repo y abrirlo en el navegador:

```bash
# 1. Clonar el repositorio
git clone https://github.com/Elimelec07/VitalTech.git

# 2. Entrar a la carpeta del sitio
cd VitalTech/vitaltech_web
```

Luego, **abre `index.html`** directamente en tu navegador.

> 💡 **Recomendado:** sírvelo con un servidor local para que las rutas y el almacenamiento funcionen correctamente:
> ```bash
> # Con Python
> python -m http.server 8000
> # Con Node (npx)
> npx serve .
> ```
> Y visita `http://localhost:8000`.

---

## 🌐 Despliegue

La aplicación está desplegada en **Vercel**:

👉 **[brazalete.vercel.app](https://brazalete.vercel.app)**

---

## 🔒 Privacidad de datos

El tratamiento de la información personal se rige por la **Ley 1581 de 2012** de Colombia, relativa a la protección de datos personales. Los datos del usuario se almacenan localmente en el navegador y se usan únicamente con fines de orientación en salud dentro de la aplicación.

---

## 🗺️ Mejoras futuras

- [ ] Migrar la autenticación y el panel admin a un **backend seguro** (actualmente la validación es del lado del cliente, solo para demostración).
- [ ] Persistencia en base de datos para historia clínica y resultados de tests.
- [ ] Conexión del asistente con un modelo de lenguaje para respuestas más naturales.
- [ ] Exportación de la historia clínica en PDF.
- [ ] Versión PWA instalable.

---

## 👤 Autores

**Elimelec Ricardo** — Universidad del Magdalena

- 📧 [elimelecjoser@gmail.com](mailto:elimelecjoser@gmail.com)
- 📱 [+57 321 815 4994](tel:+573218154994) · [WhatsApp](https://wa.me/573218154994)

**Juan Orozco** — Universidad del Magdalena

- 📧 [juanorozcop75@gmail.com](mailto:juanorozcop75@gmail.com)
- 📱 [+57 324 443 6617](tel:+573244436617) · [WhatsApp](https://wa.me/573244436617)

---

## 📄 Licencia

Distribuido bajo la licencia **MIT**. Consulta el archivo `LICENSE` para más información.

---

<div align="center">

*Hecho con 💚 para cuidar lo que más importa: tu salud.*

</div>
