# Invest App Backend
[![codecov](https://codecov.io/gh/yuu04rip/invest-app-backend/branch/main/graph/badge.svg)](https://codecov.io/gh/yuu04rip/invest-app-backend)
Backend API per applicazione Invest App: gestione utenti, autenticazione, profili, referral, prodotti, album, pagamenti e accessi.

---

## **Indice**
- [Stack & Tecnologie](#stack--tecnologie)
- [Setup locale](#setup-locale)
- [Variabili d’ambiente](#variabili-dambiente)
- [Script principali](#script-principali)
- [Struttura delle API](#struttura-delle-api)
  - [Autenticazione](#autenticazione)
  - [User](#user)
  - [Profile](#profile)
  - [Referral](#referral)
  - [Products](#products)
  - [Albums](#albums)
  - [Album Access](#album-access)
  - [Payments](#payments)
  - [Root & Webhook](#root--webhook)
- [Best Practice](#best-practice)
- [Testing](#testing)
- [Mock & Testing Stripe](#mock--testing-stripe)
- [Contribuire](#contribuire)

---

## Stack & Tecnologie

- **Node.js** + **Express**
- **Prisma** (ORM)
- **MySQL** (o MariaDB)
- **JWT** (autenticazione)
- **Stripe** (pagamenti)
- **Jest** + **Supertest** (test integrati)

---

## Setup locale

1. **Clona il repo**
   ```sh
   git clone <repo-url>
   cd invest-app-backend
   ```

2. **Installa le dipendenze**
   ```sh
   npm install
   ```

3. **Configura il database**
  - Crea un database MySQL/MariaDB.
  - Copia `.env.example` in `.env` e aggiorna la variabile `DATABASE_URL`.

4. **Setup Prisma / Migrate**
   ```sh
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Avvia il server**
   ```sh
   npm run dev
   ```

---

## Variabili d’ambiente

Copia `.env.example` in `.env` e personalizza:

```env
DATABASE_URL=mysql://user:password@localhost:3306/dbname
JWT_SECRET=supersecret
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

---

## Script principali

```json
"scripts": {
  "dev": "nodemon index.js",
  "start": "node index.js",
  "test": "jest"
}
```

---

## Struttura delle API

> Tutte le rotte richiedono `Authorization: Bearer <token>` (eccetto registrazione/login/reset password/verify).

### **Autenticazione**
- `POST /api/auth/register`  
  Registra utente (`email`, `password`, `role`). Invio OTP via email.
- `POST /api/auth/verify-otp`  
  Verifica OTP per attivazione account.
- `POST /api/auth/login`  
  Login, ricevi JWT.
- `POST /api/auth/resend-otp`  
  Reinvia OTP se non verificato.

### **User**
- `GET /api/user/me`  
  Info utente loggato.

### **Profile**
- `GET /api/profile/me`  
  Profilo proprio utente.
- `PUT /api/profile/me`  
  Crea/aggiorna proprio profilo (`name`, `surname`, ...).
- `GET /api/profile/`  
  Lista profili.
- `GET /api/profile/:id`  
  Profilo per ID.
- `PUT /api/profile/:id`  
  Aggiorna profilo per ID.
- `DELETE /api/profile/:id`  
  Elimina profilo per ID.

### **Referral**
- `POST /api/referral/generate`  
  Crea nuovo referral code.
- `GET /api/referral/me`  
  Mostra referral creati/usati dall’utente.

### **Products**
- `POST /api/products/`  
  Crea prodotto (`name`, `description`, `price`, ...).
- `GET /api/products/`  
  Lista prodotti.
- `GET /api/products/:id`  
  Prodotto per ID.
- `PUT /api/products/:id`  
  Aggiorna prodotto.
- `DELETE /api/products/:id`  
  Elimina prodotto.

### **Albums**
- `POST /api/albums/`  
  Crea album (`name`).
- `GET /api/albums/`  
  Lista album.
- `GET /api/albums/:id`  
  Album per ID.
- `PUT /api/albums/:id`  
  Aggiorna album.
- `DELETE /api/albums/:id`  
  Elimina album.

### **Album Access**
- `GET /api/album-access/:albumId`  
  Verifica se l’utente può accedere ad un album.

### **Payments**
- `POST /api/payments/checkout`  
  Avvia pagamento Stripe per un prodotto.

### **Root & Webhook**
- `GET /`  
  Test backend running.
- `POST /webhook/stripe`  
  Webhook Stripe (da configurare su Stripe Dashboard).

---

## Best Practice

- **Validazione input**: sempre validare dati in ingresso lato backend.
- **Gestione errori**: risposte JSON sempre coerenti (`error`, `details`).
- **Pulizia dati di test**: i test eliminano dati dipendenti PRIMA di eliminare l’utente.
- **Security**: usa JWT sicuri, environment variables per segreti, rate limiting su auth.
- **Coerenza naming**: rispetta esattamente i nomi campo Prisma in API e test.
- **Non loggare password o segreti** mai in console/log.

---

## Testing

- **Avvia tutti i test:**
  ```sh
  npm test
  ```
- Test integrati coprono: auth, profili, referral, prodotti, album, pagamenti, root endpoint.

---

## Mock & Testing Stripe

- L'integrazione Stripe è centralizzata in `lib/stripe.js`.
- Nei test, **mocka sempre `lib/stripe.js`** e NON direttamente il pacchetto `stripe`.
- Esempio di mock (usato nei test webhook):

    ```js
    jest.mock('../../lib/stripe', () => ({
      webhooks: {
        constructEvent: jest.fn(),
      },
    }));
    ```

- Questo garantisce che controller e test usino la stessa istanza e facilita la personalizzazione dei comportamenti Stripe nei test.

---

**Licenza:** MIT

---
