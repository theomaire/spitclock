# SpitOclock — Windows Setup Guide

This guide walks you through installing SpitOclock on a Windows computer, step by step.

---

## What You'll Need

- A Windows 10 or 11 computer
- An internet connection
- The SpitOclock Pi Zero (the little clock device) plugged in and connected to your WiFi
- About 10 minutes

---

## Step 1: Install Python

Python is the programming language that runs the SpitOclock app.

1. Open your browser and go to: **https://www.python.org/downloads/**
2. Click the big yellow **"Download Python 3.x.x"** button
3. Run the downloaded installer
4. **IMPORTANT:** On the first screen, check the box that says **"Add Python to PATH"** at the bottom — this is critical!
5. Click **"Install Now"**
6. Wait for the installation to finish, then click **"Close"**

### Verify it works

1. Press `Windows + R`, type `cmd`, press Enter to open a terminal
2. Type: `python --version`
3. You should see something like `Python 3.12.x` — if you get an error, restart your computer and try again

---

## Step 2: Install Node.js

Node.js is needed to build the visual interface.

1. Go to: **https://nodejs.org/**
2. Click the **LTS** (recommended) download button
3. Run the installer — click **Next** through all the screens (default options are fine)
4. Click **Finish**

### Verify it works

1. Open a **new** terminal (press `Windows + R`, type `cmd`, Enter)
2. Type: `node --version`
3. You should see something like `v20.x.x`

---

## Step 3: Copy the SpitOclock Folder

You should have received a **spitclock** folder (from a ZIP file or USB stick).

1. Copy the **spitclock** folder to your **Documents** folder
   - So you have: `C:\Users\YourName\Documents\spitclock`
2. Open a terminal (press `Windows + R`, type `cmd`, Enter)
3. Run these commands:

```
cd %USERPROFILE%\Documents\spitclock
```

```
scripts\install.bat
```

The installer will:
- Install Python dependencies
- Build the web interface
- Set up the `spitoclock` command

Wait for it to finish — you should see **"Installation complete!"**

---

## Step 5: Run SpitOclock

In any terminal, type:

```
spitoclock
```

This will:
- Start the SpitOclock server
- Open **http://localhost:8421** in your browser automatically

You should see the SpitOclock interface with:
- A visual preview of the LED clock (two rings of colored dots)
- Controls to change colors, effects, and schedules
- A "Push to Clock" button to send changes to the physical clock

---

## Step 6: Connect to the Clock

When the app opens, look at the top-right corner:
- **Green dot** = connected to the Pi clock
- **Red dot** = not connected

If it shows red, make sure:
- The Pi Zero clock is plugged in and powered on
- The Pi is connected to the same WiFi network as your computer
- Wait 30 seconds after plugging in the Pi (it needs time to boot)

Click **"Refresh"** to try connecting again.

---

## Using SpitOclock

### Changing Colors
1. Click on a program in the **Programs** list (e.g., "Default Clock")
2. Use the color pickers to change the hour, minute, or second hand colors
3. Adjust brightness with the slider
4. Click **Save**
5. The preview updates live — when you're happy, click **"Push to Clock"**

### Trying Effects
1. Create a new program (type a name and click **+ New**)
2. Change the **Type** to "effect"
3. Pick an effect: rainbow, breathing, chase, sparkle, or fire
4. Adjust speed and brightness
5. Save and push to the clock

### Setting a Schedule
1. Click the **Schedule** tab
2. Choose a **default program** (runs most of the time)
3. Add time rules — e.g., "Night Mode" from 22:00 to 07:00
4. Push to the clock — it will automatically switch programs at the scheduled times

---

## Troubleshooting

### "python is not recognized"
- You forgot to check "Add Python to PATH" during installation
- Uninstall Python, reinstall it, and make sure to check that box

### "spitoclock is not recognized"
- Close your terminal and open a new one
- If it still doesn't work, try: `python -m server.app` from the spitoclock folder

### "Cannot connect to Pi"
- Make sure the Pi is plugged in and has had 30+ seconds to boot
- Make sure your computer and the Pi are on the same WiFi network
- Try clicking "Refresh" in the connection panel

### The installer fails
- Make sure you have an internet connection
- Try running the terminal as Administrator (right-click > "Run as administrator")

---

## Updating SpitOclock

When there's a new version, you'll receive a new ZIP. Replace the spitclock folder and re-run the installer:

1. Delete the old `Documents\spitclock` folder
2. Copy the new one in its place
3. Open a terminal and run:

```
cd %USERPROFILE%\Documents\spitoclock
git pull
scripts\install.bat
```

---

## Quick Reference

| Action | Command |
|---|---|
| Start SpitOclock | `spitoclock` |
| Update SpitOclock | Replace folder, then `cd Documents\spitclock` then `scripts\install.bat` |
| Open the interface | Go to http://localhost:8421 in your browser |
| Stop SpitOclock | Press `Ctrl + C` in the terminal |
