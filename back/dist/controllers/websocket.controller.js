"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketController = void 0;
class WebsocketController {
    constructor(wss, matrixController) {
        this.wss = wss;
        this.matrixController = matrixController;
    }
}
exports.WebsocketController = WebsocketController;
