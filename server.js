require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const authRoutes = require('./src/routes/authRoutes');
const recordRoutes = require('./src/routes/recordRoutes');
const historyRoutes = require('./src/routes/historyRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const { notFoundHandler, errorHandler } = require('./src/middleware/errorMiddleware');
const { initSocket } = require('./src/sockets/socketHandler');
const { startScheduler } = require('./src/services/schedulerService');
const { ensureDataFiles } = require('./src/services/bootstrapService');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set('io', io);

ensureDataFiles();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/Pdf', express.static(path.join(__dirname, 'Pdf')));


initSocket(io);
startScheduler(io);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 3000);
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
