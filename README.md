DoctorBot Embed — Quick Instructions

Files included:
- chatbot.css       (styles for the widget and fallback)
- chatbot.js        (initialization logic: initDoctorBot / DOCTOR_BOT_CONFIG)
- index.html        (example page that auto-inits using the provided config)

How to use in another project (minimum):
1. Copy `chatbot.css` and `chatbot.js` into a folder in your project (e.g., `/assets/chatbot/`).
2. Copy the contents of `index.html` into the page where you want the widget, or include equivalent markup & the `DOCTOR_BOT_CONFIG` script.
3. Ensure the fallback container `#chatbot-container` is present somewhere in the page (it can be moved).
4. Serve your site over HTTP(S). Do NOT open the page directly as `file://` in the browser.

Notes & troubleshooting:
- If the widget doesn't appear, open DevTools Console and look for warnings prefixed with "DoctorBot:".
- Common issues: network blocked loading `https://static.readdy.ai/assistant/widget.umd.js`, incorrect `assistantId`/`publicKey`, or CORS/origin restrictions on the provider dashboard.
- To manually initialize after dynamic DOM changes, call `initDoctorBot(yourConfigObject)` from JS.

Security:
- The `assistantId` and `publicKey` are required by the provider to initialize the widget. Keep them in client JS only if intended by the provider; otherwise restrict usage via allowed origins in provider dashboard.

If you want, I can:
- Update your `hom+chatbot.html` to import these files and remove inline code.
- Make the embed use relative paths that work when copied into a different folder structure.
