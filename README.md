# Invest App Backend

Backend per la gestione di utenti, autenticazione, prodotti, album e verifica email con OTP.

---

## **Caratteristiche principali**

- **Registrazione utente** con verifica email tramite OTP (One-Time Password)
- **Login** consentito solo dopo verifica email
- **Gestione referral code**
- **Gestione profili, prodotti, album, pagamenti**
- **API RESTful** realizzate con Express.js e Prisma ORM (MySQL)
- **Invio email** tramite Nodemailer (Gmail/App Password)
- **Protezione tentativi OTP** (antibruteforce)

---

## **Setup progetto**

### 1. **Clona il repository**
```sh
git clone https://github.com/yuu04rip/invest-app-backend.git
cd invest-app-backend
```

### 2. **Installa le dipendenze**
```sh
npm install
```

### 3. **Configura le variabili d’ambiente**

Crea un file `.env` nella root con i seguenti parametri (modifica secondo le tue esigenze):

```
DATABASE_URL="mysql://user:password@localhost:3306/investdb"
EMAIL_SERVICE=gmail
EMAIL_USER=tuamail@gmail.com
EMAIL_PASS=la-tua-app-password
JWT_SECRET=sicretissimasegreta
FRONTEND_VERIFY_URL=http://localhost:3000/verify-otp
```

### 4. **Esegui le migration Prisma**
```sh
npx prisma migrate dev
```

### 5. **Avvia il server**
```sh
npm start
```
Server in ascolto su `http://localhost:5000` (o porta configurata).

---

## **Flusso verifica email con OTP**

1. **POST `/api/auth/register`**
   - Registra l’utente
   - Genera OTP e la invia via email
   - L’utente è `isVerified: false` finché non verifica l’email

2. **POST `/api/auth/verify-otp`**
   - L’utente invia email e OTP ricevuta
   - Se valida, `isVerified: true` e OTP invalidata

3. **POST `/api/auth/resend-otp`**
   - Invia una nuova OTP se necessario

4. **POST `/api/auth/login`**
   - Login consentito solo a utenti con email verificata

---

## **Struttura cartelle principale**

```
/controllers
  authController.js
/routes
  auth.js
/utils
  sendEmail.js
/prisma
  schema.prisma
.env
app.js / index.js
```

---

## **Esempi chiamate API**

### Registrazione

```http
POST /api/auth/register
{
  "email": "utente@esempio.com",
  "password": "sicura1234",
  "role": "investitore"
}
```

### Verifica OTP

```http
POST /api/auth/verify-otp
{
  "email": "utente@esempio.com",
  "otp": "123456"
}
```

### Reinvio OTP

```http
POST /api/auth/resend-otp
{
  "email": "utente@esempio.com"
}
```

### Login

```http
POST /api/auth/login
{
  "email": "utente@esempio.com",
  "password": "sicura1234"
}
```

---

## **Sicurezza**

- Le password sono crittografate con bcrypt
- Le variabili sensibili sono in `.env`
- Limite tentativi OTP e scadenza per prevenire attacchi a forza bruta

---

## **Contribuire**

1. Forka il repo
2. Crea una feature branch (`git checkout -b feature/nome`)
3. Commit & push
4. Fai una Pull Request

---

## **Licenza**

MIT

---

## **Contatti**

Per segnalazioni, richieste o collaborazione: [yuu04rip](https://github.com/yuu04rip)