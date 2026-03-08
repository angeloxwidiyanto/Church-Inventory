# Church Inventory System - Windows Offline Installation Guide

This guide explains how to install and run the Church Inventory System on a new Windows PC completely offline.

## 1. Prerequisites (On the Windows PC)
Before installing the app, the PC needs Node.js installed to run the local server.

1. Go to [nodejs.org](https://nodejs.org/) from the new Windows PC and download the **LTS (Long Term Support)** version for Windows.
2. Run the downloaded installer. Keep clicking **Next** to accept the default settings until it finishes.
3. Open the **Command Prompt** (press `Windows Key`, type `cmd`, and hit `Enter`).
4. Type `node -v` and hit Enter. If it prints a version number (like `v20.x.x`), Node.js is installed correctly.

## 2. Transferring the App
1. On your Mac, create a zip file of your `Church Inventory` folder.
   * **Crucial:** Make sure the `data` folder inside your project is included in the copy to keep your existing inventory database.
   * *Optional:* You can delete the `node_modules` and `.next` folders inside the copy before transferring to make the zip file much smaller. They will be regenerated on the new PC.
2. Transfer this zip file via a USB flash drive to your new Windows PC.
3. Extract the `Church Inventory` folder to a convenient location on the new PC (e.g., `C:\Church Inventory` or your Desktop).

## 3. Initial Setup & Build
You only need to do this step **once** when you first install the app.

1. Open the extracted `Church Inventory` folder in Windows File Explorer.
2. Click on the address bar at the top (where it says the folder path), type `cmd` and hit `Enter`. This opens a Command Prompt directly in your app folder.
3. Install all the app requirements by typing:
   ```cmd
   npm install
   ```
   *(Wait for it to finish installing).*
4. Build the web app for production:
   ```cmd
   npm run build
   ```
   *(Wait for it to finish building).*

## 4. Setting up Automatic Background Startup
These steps will create scripts to start the server completely hidden in the background every time the PC turns on.

### Step 4A: Create the Server Start Script
1. Inside your `Church Inventory` folder on Windows, right-click an empty space, choose **New** > **Text Document**.
2. Name it **`run_server.bat`** (make sure to delete the `.txt` at the end).
3. Right-click `run_server.bat`, select **Edit** (with Notepad).
4. Paste the following text exactly:
   ```bat
   @echo off
   cd /d "%~dp0"
   npm start
   ```
5. Save the file and close Notepad.

### Step 4B: Create the Hidden Startup Script
This script triggers `run_server.bat` silently so you don't have a black box constantly open.
1. In the same `Church Inventory` folder, right-click an empty space, choose **New** > **Text Document**.
2. Name it **`SilentStartup.vbs`** (make sure you change the `.txt` extension to `.vbs`).
3. Right-click it, select **Edit** (with Notepad).
4. Paste exactly this:
   ```vbs
   Set WshShell = CreateObject("WScript.Shell")
   WshShell.Run chr(34) & "run_server.bat" & Chr(34), 0
   Set WshShell = Nothing
   ```
5. Save the file and close.

### Step 4C: Put it in the Windows Startup Folder
1. On your Windows keyboard, press the **`Windows Key` + `R`** at the same time to open the Run box.
2. Type exactly `shell:startup` and press **Enter**. A new Windows Explorer folder will open.
3. Go back to your `Church Inventory` folder where you created the scripts.
4. Right-click specifically on your new **`SilentStartup.vbs`** file and click **Copy**.
5. Switch back to the Startup folder you opened in step 2. Right-click anywhere in the empty white space and select **"Paste shortcut"** (Do *not* just paste the file, make sure it is a *shortcut*).

## 5. Daily Usage
You are completely done! Every time the PC turns on, the app server will silently boot up in the background.

When someone needs to use the inventory system on that PC, they just need to:
1. Open their regular web browser (Edge, Chrome, Firefox).
2. Go to **`http://localhost:3000`** in the address bar.
