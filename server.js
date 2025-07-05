const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);
const path = require("path");

const PORT = process.env.PORT || 3000;

// История вызовов (в памяти)
let callLog = [];

app.use(express.static(path.join(__dirname, "public")));

// Динамическая страница вызова официанта по QR: /call/001, /call/002 и т.д.
app.get("/call/:id", (req, res) => {
  const id = req.params.id;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Table ${id}</title></head>
    <body style="font-family:sans-serif;text-align:center;padding-top:50px;">
      <h2>You are at Table <b>#${id}</b></h2>
      <button onclick="callWaiter()" style="font-size:24px;padding:15px 30px;">Call Waiter</button>

      <script>
        function callWaiter() {
          fetch('/api/call/${id}')
            .then(() => alert("Waiter will come shortly."))
            .catch(() => alert("Something went wrong."));
        }
      </script>
    </body>
    </html>
  `);
});

// API-запрос от стола: /api/call/:id
app.get("/api/call/:id", (req, res) => {
  const id = req.params.id;
  const time = new Date().toLocaleTimeString();
  const entry = { id, time };
  callLog.unshift(entry);
  if (callLog.length > 100) callLog.pop(); // ограничим список
  io.emit("new_call", entry);
  res.sendStatus(200);
});

// API — история вызовов
app.get("/api/history", (req, res) => {
  res.json(callLog);
});

// WebSocket для live-обновлений
io.on("connection", (socket) => {
  console.log("Admin connected");
});

http.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
