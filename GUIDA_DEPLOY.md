# 🧩 EnigmaDay — Guida al Deploy Completa
### Da zero a sito online, gratis, in ~45 minuti

---

## Cosa useremo (tutto gratis)

| Servizio | Cosa fa | Piano gratuito |
|---|---|---|
| **GitHub** | Ospita il codice | Illimitato |
| **Supabase** | Database + autenticazione utenti | 500MB, 50.000 utenti |
| **Netlify** | Pubblica il sito online | 100GB traffico/mese |
| **Node.js** | Necessario sul tuo computer | Gratuito |

---

## PARTE 1 — Preparare il computer (una tantum)

### 1.1 Installa Node.js
1. Vai su **https://nodejs.org**
2. Clicca sul pulsante verde **"LTS"** (la versione stabile)
3. Scarica e installa normalmente
4. Per verificare: apri il Terminale (Mac) o il Prompt dei comandi (Windows) e scrivi:
   ```
   node --version
   ```
   Deve apparire qualcosa tipo `v20.x.x` ✅

### 1.2 Crea un account GitHub
1. Vai su **https://github.com**
2. Clicca **Sign up** e registrati gratuitamente
3. Conferma l'email

---

## PARTE 2 — Configurare Supabase (il database)

### 2.1 Crea il progetto
1. Vai su **https://supabase.com** → **Start your project**
2. Registrati (puoi usare GitHub)
3. Clicca **New project**
4. Compila:
   - **Name:** `enigmaday`
   - **Database Password:** scegli una password sicura e **SALVALA** da qualche parte
   - **Region:** `West EU (Ireland)` — la più vicina all'Italia
5. Clicca **Create new project** e aspetta ~2 minuti

### 2.2 Crea le tabelle del database
1. Nel menu a sinistra clicca **SQL Editor**
2. Clicca **New query**
3. Apri il file `supabase_schema.sql` che trovi nella cartella del progetto
4. Copia **tutto** il contenuto
5. Incollalo nell'editor SQL di Supabase
6. Clicca **Run** (il pulsante verde)
7. Deve apparire `Success. No rows returned` ✅

### 2.3 Copia le credenziali
1. Nel menu a sinistra clicca **Project Settings** (l'icona dell'ingranaggio)
2. Clicca **API**
3. Copia e salva questi due valori (ti serviranno dopo):
   - **Project URL** → es. `https://abcdefghij.supabase.co`
   - **anon public** (sotto "Project API Keys") → la chiave lunga che inizia con `eyJ...`

### 2.4 Crea l'account admin
1. Nel menu a sinistra clicca **Authentication**
2. Clicca **Add user** → **Create new user**
3. Compila:
   - Email: `admin@enigmaday.it` (o quella che preferisci)
   - Password: scegli una password sicura
4. Clicca **Create user**
5. Ora vai su **SQL Editor** → **New query** e incolla questo (sostituendo l'email con la tua):
   ```sql
   UPDATE public.profiles
   SET ruolo = 'admin'
   WHERE email = 'admin@enigmaday.it';
   ```
6. Clicca **Run** ✅

### 2.5 Disabilita la verifica email (opzionale, per semplificare i test)
1. Vai su **Authentication** → **Providers** → **Email**
2. Disattiva **"Confirm email"** se vuoi che gli utenti si registrino senza conferma email
3. Salva

---

## PARTE 3 — Caricare il codice su GitHub

### 3.1 Crea un repository
1. Vai su **https://github.com** (sei loggato)
2. Clicca **+** in alto a destra → **New repository**
3. Compila:
   - **Repository name:** `enigmaday`
   - Lascia tutto il resto come sta
4. Clicca **Create repository**

### 3.2 Carica i file
1. Apri il Terminale (Mac) o Prompt dei comandi (Windows)
2. Vai nella cartella del progetto:
   ```bash
   cd percorso/alla/cartella/enigmaday
   ```
   > Su Mac puoi trascinare la cartella nel Terminale dopo aver scritto `cd `
3. Esegui questi comandi uno alla volta:
   ```bash
   git init
   git add .
   git commit -m "primo commit"
   git branch -M main
   git remote add origin https://github.com/TUO_USERNAME/enigmaday.git
   git push -u origin main
   ```
   > Sostituisci `TUO_USERNAME` con il tuo nome utente GitHub

---

## PARTE 4 — Pubblicare su Netlify

### 4.1 Crea l'account
1. Vai su **https://netlify.com**
2. Clicca **Sign up** → scegli **GitHub** (più semplice)
3. Autorizza l'accesso

### 4.2 Crea il sito
1. Nella dashboard Netlify clicca **Add new site** → **Import an existing project**
2. Scegli **GitHub**
3. Cerca e seleziona il repository `enigmaday`
4. Compila le impostazioni di build:
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
5. **NON cliccare ancora Deploy** — prima devi aggiungere le variabili d'ambiente

### 4.3 Aggiungi le credenziali Supabase
1. Scorri in basso fino a **Environment variables**
2. Aggiungi le due variabili (quelle che hai copiato al passo 2.3):

   | Key | Value |
   |---|---|
   | `REACT_APP_SUPABASE_URL` | `https://abcdefghij.supabase.co` |
   | `REACT_APP_SUPABASE_ANON_KEY` | `eyJ...` (la chiave lunga) |

3. Ora clicca **Deploy site**
4. Aspetta 2-3 minuti mentre Netlify compila il sito ☕

### 4.4 Il sito è online!
Netlify ti darà un indirizzo tipo `https://random-name-12345.netlify.app`  
Puoi cambiarlo in **Site settings** → **Domain management** → **Options** → **Edit site name**

---

## PARTE 5 — Personalizzare il dominio (opzionale, gratuito)

### Opzione A — Dominio gratuito .netlify.app
Puoi rinominarlo in qualcosa tipo `enigmaday.netlify.app` direttamente dalle impostazioni Netlify.

### Opzione B — Dominio personalizzato (~10€/anno)
1. Compra un dominio su **Namecheap** o **Aruba** (es. `enigmaday.it`)
2. In Netlify: **Site settings** → **Domain management** → **Add custom domain**
3. Segui le istruzioni per aggiornare i DNS (Netlify ti guida passo per passo)

---

## PARTE 6 — Aggiornare il sito in futuro

Ogni volta che modifichi il codice, basta fare:
```bash
git add .
git commit -m "descrizione della modifica"
git push
```
Netlify si aggiorna **automaticamente** in 2-3 minuti! 🚀

---

## PARTE 7 — Aggiungere enigmi

Hai due modi:

### Via pannello admin (consigliato)
1. Accedi al sito con `admin@enigmaday.it`
2. Clicca **Admin** nella navbar
3. Vai su **Enigmi** → **+ Aggiungi**
4. Compila e salva

### Via Supabase direttamente
1. Vai su Supabase → **Table Editor** → **enigmi**
2. Clicca **Insert row** e inserisci i dati manualmente

---

## PARTE 8 — Newsletter (invio email automatico)

Per mandare l'enigma via email ogni mattina, usa **Resend** (gratuito fino a 3.000 email/mese):

1. Registrati su **https://resend.com**
2. Vai su **https://supabase.com** → il tuo progetto → **Edge Functions**
3. Crea una nuova Edge Function chiamata `send-newsletter`
4. Incolla questo codice:
   ```typescript
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
   
   Deno.serve(async () => {
     const supabase = createClient(
       Deno.env.get('SUPABASE_URL')!,
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
     )
   
     // Prendi l'enigma di oggi
     const today = new Date().toISOString().split('T')[0]
     const { data: enigma } = await supabase
       .from('enigmi').select('*').eq('data_pub', today).single()
   
     if (!enigma) return new Response('Nessun enigma oggi')
   
     // Prendi gli iscritti alla newsletter
     const { data: subscribers } = await supabase
       .from('profiles').select('email, nome').eq('newsletter', true)
   
     // Manda l'email con Resend
     for (const sub of subscribers || []) {
       await fetch('https://api.resend.com/emails', {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           from: 'EnigmaDay <newsletter@tuodominio.it>',
           to: sub.email,
           subject: `🧩 Enigma del Giorno — ${today}`,
           html: `<h2>Ciao ${sub.nome}!</h2>
                  <p>Ecco l'enigma di oggi:</p>
                  <blockquote><strong>${enigma.testo}</strong></blockquote>
                  <p>Vai su <a href="https://tuosito.netlify.app">EnigmaDay</a> per risolverlo!</p>`
         })
       })
     }
   
     return new Response(`Email inviate a ${subscribers?.length} iscritti`)
   })
   ```
5. In Supabase → **Project Settings** → **Edge Functions** → aggiungi la variabile `RESEND_API_KEY` con la tua chiave API di Resend
6. Per mandare le email ogni mattina, usa il **cron job di Supabase**:
   - Vai su **Database** → **Extensions** → abilita `pg_cron`
   - Poi in SQL Editor:
   ```sql
   select cron.schedule(
     'newsletter-giornaliera',
     '0 8 * * *',  -- ogni mattina alle 8:00
     $$
     select net.http_post(
       url := 'https://PROGETTO.supabase.co/functions/v1/send-newsletter',
       headers := '{"Authorization": "Bearer ANON_KEY"}'
     )
     $$
   );
   ```

---

## Riepilogo finale

```
✅ Supabase  → database + login utenti
✅ GitHub    → codice versionato
✅ Netlify   → sito online e aggiornamento automatico
✅ Resend    → email newsletter (opzionale)
```

**Tempo totale stimato:** ~45 minuti la prima volta  
**Costo mensile:** €0

---

## Hai problemi?

- **Errore Supabase "permission denied"** → controlla che le policy RLS siano state create (passo 2.2)
- **Sito bianco dopo il deploy** → in Netlify vai su **Deploys** e guarda il log degli errori
- **Le variabili d'ambiente non funzionano** → assicurati che inizino con `REACT_APP_`
- **L'admin non funziona** → controlla di aver eseguito l'UPDATE sul ruolo (passo 2.4)
