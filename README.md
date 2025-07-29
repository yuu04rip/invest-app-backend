# Invest-App Backend

Backend API per l’app Investitori/Imprenditori.

---

## 🚀 Stack Tecnologico

- **Node.js** (runtime)
- **Express.js** (framework REST API)
- **PostgreSQL** (database relazionale)
- **Docker** (sviluppo e deploy)
- **Stripe/PayPal** (pagamenti)
- **JWT** (autenticazione)

---

## 📦 Setup locale

1. **Clona la repository**
   ```bash
   git clone https://github.com/tuo-utente/invest-app-backend.git
   cd invest-app-backend
   ```

2. **Configura le variabili ambiente**
   - Copia `.env.example` in `.env` e modifica i parametri come necessario.

3. **Installa le dipendenze**
   ```bash
   npm install
   ```

4. **Avvia il server**
   ```bash
   npm run dev
   ```
   Oppure, tramite Docker:
   ```bash
   docker-compose up --build
   ```

---

## 🗂️ Struttura delle cartelle

```
src/
  controllers/
  models/
  routes/
  services/
  utils/
config/
tests/
docs/
```

---

## 🌐 Endpoints principali (MVP)
- Autenticazione (login, register, refresh, email verify)
- Referral (genera, valida)
- Profilo utente (CRUD)
- Healthcheck

La documentazione dettagliata sarà disponibile su `/docs` (Swagger/OpenAPI).

---

## 🛠️ Strumenti di sviluppo
- ESLint, Prettier (lint/format)
- Jest (test)
- Docker Compose (sviluppo locale)
- Swagger (documentazione API)

---

## 📄 Licenza

MIT
