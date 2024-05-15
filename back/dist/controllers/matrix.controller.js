"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatrixController = void 0;
const matrix_service_1 = require("../services/matrix.service");
class MatrixController {
    constructor(wss) {
        this.wss = wss;
        this.matrixService = new matrix_service_1.MatrixService(wss);
        this.handleMessages();
    }
    handleMessages() {
        this.wss.on('connection', (ws) => {
            ws.on('message', (message) => __awaiter(this, void 0, void 0, function* () {
                const parsedMessage = JSON.parse(message);
                const { action, data } = parsedMessage;
                switch (action) {
                    case 'createMatrix':
                        const { rows, columns } = data;
                        yield this.createMatrix(ws, rows, columns);
                        break;
                    case 'delMatrix':
                        yield this.delMatrix(ws);
                        break;
                    case 'updCell':
                        const { row, column, value, gamer } = data;
                        yield this.updCell(ws, row, column, value, gamer);
                        break;
                    case 'getCell':
                        const { getRow, getColumn } = data;
                        const cellValue = yield this.getCell(getRow, getColumn);
                        ws.send(JSON.stringify({ action: 'cellValue', data: cellValue }));
                        break;
                    default:
                        console.log('Invalid action');
                }
            }));
        });
    }
    createMatrix(ws, rows, columns) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Llamar al servicio para crear la matriz en MongoDB
                yield this.matrixService.createMatrix(rows, columns);
                // Enviar respuesta al cliente a través de WebSocket
                ws.send(JSON.stringify({ action: 'matrixCreated', message: 'Matrix created successfully' }));
            }
            catch (error) {
                console.error('Error creating matrix:', error);
                // Enviar mensaje de error al cliente a través de WebSocket
                ws.send(JSON.stringify({ action: 'matrixCreationError', error: error.message }));
            }
        });
    }
    delMatrix(ws) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Llamar al servicio para eliminar la matriz en MongoDB
                yield this.matrixService.delMatrix();
                // Enviar respuesta al cliente a través de WebSocket
                ws.send(JSON.stringify({ action: 'matrixDeleted', message: 'Matrix deleted successfully' }));
            }
            catch (error) {
                console.error('Error deleting matrix:', error);
                // Enviar mensaje de error al cliente a través de WebSocket
                ws.send(JSON.stringify({ action: 'matrixDeletionError', error: error.message }));
            }
        });
    }
    updCell(ws, row, column, value, gamer) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Llamar al servicio para actualizar la celda en MongoDB
                yield this.matrixService.updCell(row, column, value, gamer);
                // Enviar respuesta al cliente a través de WebSocket
                ws.send(JSON.stringify({ action: 'cellUpdated', message: 'Cell updated successfully' }));
            }
            catch (error) {
                console.error('Error updating cell:', error);
                // Enviar mensaje de error al cliente a través de WebSocket
                ws.send(JSON.stringify({ action: 'cellUpdateError', error: error.message }));
            }
        });
    }
    getCell(row, column) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Llamar al servicio para obtener el valor de la celda de MongoDB
                const cellValue = yield this.matrixService.getCell(row, column);
                return cellValue;
            }
            catch (error) {
                console.error('Error getting cell value:', error);
                throw error;
            }
        });
    }
}
exports.MatrixController = MatrixController;
