const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const PORT = process.env.PORT;
require('./src/config/dbConnection');
// require('./src/utilities/cache');
const { initRedis } = require('./src/utilities/cache');
initRedis().then(() => {
  console.log('✅ Redis initialization completed');
}).catch(err => {
  console.log('⚠️  Redis initialization skipped:', err.message);
});
const cors = require('cors');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const errorMiddleware = require('./src/middlewares/error');
const { setupSwagger } = require('./src/config/swagger');
const rootRoutes = require('./src/routes/root/rootRoutes');
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin:"*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});
app.use(express.json());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('combined'));
app.set('trust proxy', true);
app.use(cors());
app.use(helmet());
app.use(errorMiddleware);
app.use((req, res, next) => {
  console.log("REQUESTED DATA =====>", {
    Host: req.headers.host,
    ContentType: req.headers['content-type'],
    Url: req.originalUrl,
    Method: req.method,
    Query: req.query,
    Body: req.body,
  });
  next();
});


io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.set('io', io);
setupSwagger(app);
app.use('/api/v1',rootRoutes);
// app.listen(PORT,()=>{
//     console.log(`Server is running on port ${PORT}`);
// })

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
});