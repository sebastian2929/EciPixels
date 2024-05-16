import express from 'express';
import http from 'http';
import cluster from 'cluster';
import WebSocket from 'ws';
import { MatrixController } from './controllers/matrix.controller';
import { WebsocketController } from './controllers/websocket.controller';

const numCPUs = require('os').cpus().length;
const app = express();
const port = 3000;

// Verifica si el proceso actual es el proceso maestro
if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
    console.log(`Creando instancias de backend, espere por favor ...`);

    // Bifurca los procesos secundarios (workers)
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    // Maneja eventos relacionados con los workers
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
    });
} else {
   
    // Worker process
    const workerId = `${process.pid}-${cluster.worker?.id}`;

    const server = http.createServer(app);
    
    // Inicializa tu servidor WebSocket
    const wss = new WebSocket.Server({ server });


    const matrixController = new MatrixController(wss);

    const websocketController = new WebsocketController(wss, matrixController);

    server.listen(port, () => {
        console.log(`Worker ${process.pid} started`);
    });

    // Handle WebSocket connections
    wss.on('connection', (ws, req) => {
        // Log which worker handled the WebSocket connection
        console.log(`WebSocket connection handled by Worker ${workerId}`);
        
        // Handle WebSocket messages
        ws.on('message', (message) => {
            // Process WebSocket message
            console.log(`Received message on Worker ${workerId}: ${message}`);
            // Handle the message here
        });

        // Handle WebSocket errors
        ws.on('error', (err) => {
            console.error(`WebSocket encountered error on Worker ${workerId}:`, err);
        });

        // Handle WebSocket close events
        ws.on('close', () => {
            console.log(`WebSocket connection closed on Worker ${workerId}`);
        });
    });
}
