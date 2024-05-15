"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ws_1 = __importDefault(require("ws"));
const matrix_controller_1 = require("./controllers/matrix.controller");
const websocket_controller_1 = require("./controllers/websocket.controller");
const app = (0, express_1.default)();
const port = 3000;
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
const wss = new ws_1.default.Server({ server });
const matrixController = new matrix_controller_1.MatrixController(wss);
const websocketController = new websocket_controller_1.WebsocketController(wss, matrixController);
