# LinkLogging & LinkTrees
An app for link shortening and logging 
And creating and managing linktrees.

## Get Started: 

1. Once the repo is cloned on your device, open the folder in VScode (or any other code editor) and run `npm i` in cmd. It will create a `build` folder.
2. Copy `public.pem` file and `src/IP_DATA.BIN` file into **build folder**.
3. Before starting the app, you need to run CASI locally for testing as the middleware **auth.ts** needs JWT tokens generated from CASI locally.
4. Here are some instructions to setup CASI  (You can look at the instructions given in the CASI repo by DevClub & skip these steps):
    
    * Clone https://github.com/devclub-iitd/SingleSignOn/
    * Copy .env.sample into .env or run command:
    ```
    cd SingleSignOn
    cp .env.sample .env
    ```
    * Install *openSSL* on your system
    * Run 
    ```
    openssl genrsa -out private.pem 2048
    openssl rsa -in private.pem -outform PEM -pubout -out public.pem
    ```
    
    in CMD, It will generate two files: **public.pem** and **private.pem**
    * Move these files into _SingleSignOn/src/config_
    * Replace the content of both _public.pem_ in LinkLogging and build folder with the content of newly generated _public.pem_ file 
    * Create a separate Mongo Database for local CASI users or use the one we created [here](mongodb+srv://test_user:linklogging1234@linklogging.ijmqm.mongodb.net/CASI?retryWrites=true&w=majority) on MongoDB Atlas (but it requires access so    contact us for that)
    * Replace value of **DB_URL** in *SingleSignOn/.env* file with address of your Database
    * Open SingleSignOn and run 
    ```
    npm i
    npm start
    ```
    * Open _Port:8000_ on your browser. It should show the CASI homepage.
    * Signup with dummy credentials. These will be stored but will not be verified for local login.
    * Open your CASI database and manually change the `isVerified: false` field to `isVerified: true`

5. Login into local CASI using the dummy credentials.
6. Create a Mongo Database for testing link logging or Use the one we created [here](mongodb+srv://test_user:linklogging1234@linklogging.ijmqm.mongodb.net/link_logging?retryWrites=true&w=majority) on Mongo Atlas (but it requires access so contact us for that)
7. Replace value of `const dbURI` in *LinkLogging/src/app.ts* with address of your database.
8. Open LinkLogging folder in cmd and Run
```
npm run eslint-fix
npm run prettier-fix
npm i
nodemon start
```
9. Open Port:5000 on your Browser and Start Testing

### Good Luck .....
