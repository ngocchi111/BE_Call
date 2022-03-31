require("dotenv");
const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Running");
});

const list = [];
io.on("connection", (socket) => {
  socket.emit("me", socket.id);

  list.push({id: socket.id});

  socket.on('disconnect', ()=>{
    for (let s of list)
    if (s.id == socket.id)
      list.splice(list.indexOf(s), 1);
  })

  socket.on('online', ()=>{socket.emit('online', list)});

  socket.on("callToUser", ({ from, to }) => {
    io.to(to).emit("callToUser", {
      from
    });
  });

  socket.on('decline', ({to})=>{
    io.to(to).emit('decline');
  })


  socket.on("callUser", ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit("callUser", {
      signal: signalData,
      from,
      name,
    });
  });

  socket.on("iCallUser", ({ userToCall, signalData, from, name }) => {
    console.log('icalluser '+ userToCall + ' ' + from)
    io.to(userToCall).emit("iCallUser", {
      signal: signalData,
    });
  });

  socket.on("updateMyMedia", ({ type, currentMediaStatus }) => {
    console.log("updateMyMedia");
    socket.broadcast.emit("updateUserMedia", { type, currentMediaStatus });
  });

  socket.on("msgUser", ({ name, to, msg, sender }) => {
    io.to(to).emit("msgRcv", { name, msg, sender });
  });

  socket.on("answerCall", (data) => {
    socket.broadcast.emit("updateUserMedia", {
      type: data.type,
      currentMediaStatus: data.myMediaStatus,
    });
    io.to(data.to).emit("callAccepted", data);
  });
  socket.on("endCall", ({ id }) => {
    io.to(id).emit("endCall");
  });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
