import { WebSocketServer } from 'ws'
import { syncHandlers } from '../utils/socket.utils.js'

let wss

export function openServer() {
    wss = new WebSocketServer({ port: 8080 });

    console.log("Server started on port 8080");

    wss.on("connection", (ws) => {
        console.log("Client connected");

        ws.on("message", async (message) => {
            try {
                const { type, payload } = JSON.parse(message);

                if (syncHandlers[type]) {
                    try {
                        const { data, message } = await syncHandlers[type](payload);

                        ws.send(JSON.stringify({
                            type: type,
                            success: true,
                            data: data,
                            message: message
                        }));
                    } catch (error) {
                        console.error(`Error processing sync handler ${type}:`, error);
                        ws.send(JSON.stringify({ type: type, success: false, error: error.message }));
                    }
                } else {
                    console.warn(`Mensagem desconhecida: ${type}`);
                }
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        });

        ws.on("error", (error) => {
            console.error("WebSocket connection error:", error);
        });

        ws.on("close", () => {
            console.log("Client disconnected");
        });
    });

    wss.on("error", (error) => {
        console.error("WebSocket server error:", error);
    });
}

export function closeServer() {
    if (wss) {
        wss.close();
    }
}

// client_ws.js
// const WebSocket = require('ws');
// const ws = new WebSocket('ws://localhost:8080');

// ws.on('open', function open() {
//   ws.send('hello from client');
// });

// ws.on('message', function message(data) {
//   console.log('received: %s', data);
// });
