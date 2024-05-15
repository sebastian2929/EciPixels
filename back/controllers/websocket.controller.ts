import   WebSocket  from 'ws';
import { MatrixController } from './matrix.controller';

export class WebsocketController {
    constructor(private wss: WebSocket.Server, private matrixController: MatrixController) {
    }
}
