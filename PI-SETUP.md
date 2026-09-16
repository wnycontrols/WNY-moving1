# Raspberry Pi Time-Clock Kiosk Setup

Turns a Raspberry Pi 3 + official 7" touchscreen + USB RFID reader into a wall
punch clock. Workers scan their tag → their own screen appears with big
**Clock in / Clock out / Break** buttons. Nothing else is reachable without the
manager PIN.

The kiosk is just a web page — `kiosk.html` on your existing site — so there is
nothing to install on the Pi beyond a browser pointed at:

```
https://wnycontrols.github.io/WNY-moving1/kiosk.html
```

## 1. One-time app setup (on any computer, ~3 min)

1. In the main app, tap **⚙** → under **Admin Emails** add a dedicated kiosk
   email on its own line, e.g. `kiosk@wnymoving.com` (it doesn't need to be a
   real inbox — it's just a login name) → Save.
2. Open `…/kiosk.html`, type that email and a password, and tap
   **"First time? Create this kiosk login."** The kiosk starts.
3. Tap the small **⚙** in the corner → you'll be asked to **set a manager
   PIN** (4–8 digits). This PIN is the only way into the manager panel or off
   the kiosk screen.
4. In the manager panel, assign tags: tap **Assign tag** next to a person,
   then scan their fob. Done — repeat for the crew. (Scanning an unknown fob at
   the idle screen also offers "Manager: assign this tag.")

## 2. Prepare the Pi (~20 min)

1. On a computer, install **Raspberry Pi Imager** (raspberrypi.com/software).
   Choose *Raspberry Pi OS (32-bit) with desktop*, and in the imager's settings
   (gear icon) set your Wi-Fi name/password, hostname, and a login user
   (e.g. `pi`). Write it to the microSD card.
2. Assemble the 7" touchscreen per its instructions (DSI ribbon + 5V from the
   Pi's GPIO or its own supply), insert the card, power on. Touch works out of
   the box on the official display.
3. Plug the RFID reader into USB. Most cheap 125 kHz/13.56 MHz USB readers act
   as a **keyboard** — open a text editor, scan a fob: if numbers appear and
   the cursor drops a line, you're done, no drivers. (If nothing types, tell
   Claude the reader model — an SPI module like the RC522 needs a small helper
   script instead.)

## 3. Launch the kiosk automatically

Open a terminal on the Pi:

```bash
mkdir -p ~/.config/lxsession/LXDE-pi
nano ~/.config/lxsession/LXDE-pi/autostart
```

Put exactly this in the file (Ctrl+O, Enter, Ctrl+X to save):

```
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xset s off
@xset -dpms
@xset s noblank
@chromium-browser --kiosk --noerrdialogs --disable-restore-session-state --check-for-update-interval=604800 https://wnycontrols.github.io/WNY-moving1/kiosk.html
```

Reboot (`sudo reboot`). The Pi boots straight into the fullscreen clock.
Sign in with the kiosk login once — it stays signed in after reboots.

> Newer Raspberry Pi OS ("Bookworm" on Wayland): if the autostart file has no
> effect, instead run `sudo raspi-config` → Advanced → Wayland → select X11,
> reboot, and the instructions above apply.

## 4. Daily use

- **Worker scans fob** → sees only their own name, today's hours, and big
  buttons: **Clock in**, or **Break / Clock out** while working, **End break**
  on break. One tap, big ✓ confirmation, back to the clock face.
- Unknown fobs are rejected. The screen returns to the clock automatically.
- The idle screen shows who's currently on the clock (initials; amber ring =
  on break).
- **Managers**: ⚙ → PIN → assign/remove tags, change the PIN, or **Open full
  app** for everything else (calendar, crews, hours, pay). Admin accounts also
  see everything as usual from their own phones.
- If the internet drops, actions show a red ✕ "didn't save" — scan again when
  it's back.

## Troubleshooting

| Problem | Fix |
|---|---|
| Screen goes black after minutes | The `@xset` lines above disable blanking — make sure all three are present, reboot |
| Scan does nothing | Reader must act as a keyboard (test in a text editor). Click the screen once after boot so the page has focus |
| "This login is not an admin" | The kiosk email isn't in ⚙ Admin Emails (must be lowercase, exact) |
| Forgot the manager PIN | Any admin: main app → ⚙ works fine; to reset the kiosk PIN, ask Claude or delete the `kioskPin` field on the `payroll/_config` document in the Firebase console |
| Browser shows an old version | The page auto-updates on reload; power-cycle the Pi |
