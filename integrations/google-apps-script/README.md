# Giac - scrittura prelievi su Google Sheets

Protocollo corrente: **2.0.0**.

1. Nel foglio Google aprire **Estensioni > Apps Script**.
2. Copiare il contenuto di `Code.gs` nel file `Codice.gs`.
3. Aprire **Impostazioni progetto > Proprietà script** e aggiungere
   `GIAC_SHARED_SECRET` con lo stesso secret configurato nella web app
   (almeno 32 caratteri).
4. Selezionare `setupGiac` nell'editor e premere **Esegui** una volta.
   Accettare l'autorizzazione richiesta da Google.
5. Selezionare **Esegui il deployment > Nuovo deployment > Applicazione web**.
6. Configurare **Esegui come: Me** e **Chi ha accesso: Chiunque**.
7. Copiare l'URL `/exec` nelle impostazioni Giac.

Lo script non modifica `Qta Tot.` o le formule. Somma le quantità esclusivamente
alla colonna del giorno e verifica che l'intestazione contenga il giorno del mese
se è nel formato `Lunedì 24`.

Se uno SKU compare più volte, viene usata la prima riga valida nell'ordine del
foglio. Prima della scelta vengono ignorate le righe il cui campo Lotto corrisponde
alle regole **Giacenze escluse dal calcolo** configurate nella web app.

Per aggiornare uno script già distribuito, sostituire il contenuto di `Codice.gs`,
salvare e creare una **nuova versione** da **Gestisci deployment > Modifica**,
mantenendo lo stesso URL `/exec`.

La versione 2.0.0 firma anche la struttura del foglio e aggiorna soltanto le
celle degli SKU coinvolti. Se righe, SKU, lotti o valori cambiano dopo
l'anteprima, la registrazione viene interrotta e deve essere rigenerata.
