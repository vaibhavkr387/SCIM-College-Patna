let io = null;

function setIO(socketServer) {
  io = socketServer;
}

function emitNotification(event, payload) {
  if (!io) return;
  io.emit(event, payload);
}

function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

module.exports = { setIO, emitNotification, emitToUser };
