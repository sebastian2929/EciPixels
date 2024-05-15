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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatrixService = void 0;
const mongodb_1 = require("mongodb");
const ws_1 = __importDefault(require("ws"));
class MatrixService {
    constructor(wss) {
        this.client = new mongodb_1.MongoClient('mongodb+srv://jblancov:Asdfgh123456##@cluster0.wk6qd7u.mongodb.net/');
        this.wss = wss;
        this.client.connect().then(() => {
            this.db = this.client.db('matrixDB');
            this.matrixCollection = this.db.collection('matrix');
        });
    }
    createMatrix(rows, columns) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Crear matriz de tamaño especificado con valores por defecto
                const matrix = Array.from({ length: rows }, () => Array(columns).fill(null));
                // Guardar matriz en la colección de MongoDB
                yield this.matrixCollection.insertOne({ matrix });
                // Notificar a los clientes que la matriz ha sido creada
                this.wss.clients.forEach(client => {
                    if (client.readyState === ws_1.default.OPEN) {
                        client.send(JSON.stringify({ action: 'matrixCreated', message: 'Matrix created successfully' }));
                    }
                });
            }
            catch (error) {
                console.error('Error creating matrix:', error);
                throw error;
            }
        });
    }
    delMatrix() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Eliminar la matriz de la colección de MongoDB
                yield this.matrixCollection.deleteMany({});
                // Notificar a los clientes que la matriz ha sido eliminada
                this.wss.clients.forEach(client => {
                    if (client.readyState === ws_1.default.OPEN) {
                        client.send(JSON.stringify({ action: 'matrixDeleted', message: 'Matrix deleted successfully' }));
                    }
                });
            }
            catch (error) {
                console.error('Error deleting matrix:', error);
                throw error;
            }
        });
    }
    updCell(row, column, value, gamer) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Actualizar el valor de la celda en la matriz en la colección de MongoDB
                yield this.matrixCollection.updateOne({}, { $set: { [`matrix.${row}.${column}`]: { value, gamer } } });
                // Notificar a los clientes que la celda ha sido actualizada
                this.wss.clients.forEach(client => {
                    if (client.readyState === ws_1.default.OPEN) {
                        client.send(JSON.stringify({ action: 'cellUpdated', message: 'Cell updated successfully' }));
                    }
                });
            }
            catch (error) {
                console.error('Error updating cell:', error);
                throw error;
            }
        });
    }
    getCell(row, column) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                // Obtener el valor de la celda de la matriz en la colección de MongoDB
                const result = yield this.matrixCollection.findOne({}, { projection: { _id: 0, [`matrix.${row}.${column}`]: 1 } });
                return ((_b = (_a = result === null || result === void 0 ? void 0 : result.matrix) === null || _a === void 0 ? void 0 : _a[row]) === null || _b === void 0 ? void 0 : _b[column]) || null;
            }
            catch (error) {
                console.error('Error getting cell value:', error);
                throw error;
            }
        });
    }
}
exports.MatrixService = MatrixService;
