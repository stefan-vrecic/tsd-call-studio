# Call Studio Desktop (prototype)

One app window: Call Studio on the left, and a side panel on the right that can show Chanty, Stripe or Google Calendar
(sites that refuse to be shown inside a normal browser page, but work fine inside an app window). Logins are saved per site.

```
python3 ../server.py      # Call Studio's server must be running
cd desktop && npm start
```
Clicking the Chanty / Stripe / Calendar tab inside Call Studio opens it in the side panel. Drag the divider to resize,
⇄ swaps sides, ✕ closes the panel. Not packaged yet: it runs from this folder.
