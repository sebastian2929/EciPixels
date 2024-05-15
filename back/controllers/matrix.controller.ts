import WebSocket from 'ws';
import { MatrixService } from '../services/matrix.service';
import { Cell } from '../models/cell.interface'
  
export class MatrixController {

    private matrixService: MatrixService;
    constructor(private wss: WebSocket.Server) {
        this.matrixService = new MatrixService(wss);
        this.handleMessages();
    }

    private handleMessages(): void {
        this.wss.on('connection', (ws: WebSocket) => {
            ws.on('message', async (message: string) => {
                let parsedMessage = JSON.parse(JSON.parse(message));
                const action = parsedMessage.action;
                switch (action) {
                    case 'calcArea': {
                        const findClr = parsedMessage.data;
                        await this.calcArea(ws, findClr);
                        break;
                    }
                    case 'activeCell': {
                        const cell = parsedMessage.data;
                        await this.activeCell(ws, cell);
                        break;
                    }
                    case 'deleteCells': {
                        const clr = parsedMessage.data;
                        await this.deleteCells(ws,clr);
                        break;
                    }
                    case 'getMatrixIni': {
                        const mNam = parsedMessage.data;
                        await this.getMatrixIni(ws, mNam);
                        break;
                    }
                    case 'getMatrix': {
                        await this.getMatrix(ws);
                        break;
                    }
                    case 'restartGame': {
                        await this.restartGame(ws);
                        break;
                    }
                    case 'getTop': {
                        await this.getTop(ws);
                        break;
                    }
                    default: {
                        console.log('Invalid action');
                    }
                }
            });
        });
    }


    private async getMatrixIni(ws: WebSocket, mNam: string): Promise<void> {
        try {
            ws.send(JSON.stringify({ action: 'getMatrixIni', data: await this.matrixService.getMatrixIni(mNam) }));
        } catch (error: any) {
            console.error('Error getting matrix:', error);
            // Enviar mensaje de error al cliente a través de WebSocket
            ws.send(JSON.stringify({ action: 'matrixGetError', error: error.message }));
        }
    }


    private async getMatrix(ws: WebSocket): Promise<void> {
        try {
            ws.send(JSON.stringify({ action: 'getMatrix', data: await this.matrixService.getMatrix() }));
        } catch (error: any) {
            console.error('Error getting matrix:', error);
            // Enviar mensaje de error al cliente a través de WebSocket
            ws.send(JSON.stringify({ action: 'matrixGetError', error: error.message }));
        }
    }


    private async activeCell(ws: WebSocket, cell: Cell): Promise<void> {
        try {
            const mCell  =  await this.matrixService.activeCell(cell);
            /////////////ws.send(JSON.stringify({ action: 'activeCell', data:  mCell}));
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ action: 'activeCell', data: mCell }));
                }
            });
        } catch (error: any) {
            console.error('Error updating cell:', error);
            // Enviar mensaje de error al cliente a través de WebSocket
            ws.send(JSON.stringify({ action: 'cellUpdateError', error: error.message }));
        }
    }

    private async deleteCells(ws: WebSocket, clr: string): Promise<void> {
        try {
            const matrix_clr = await this.matrixService.deleteCells(clr);
            ////ws.send(JSON.stringify({ action: 'deleteCells', data: matrix_clr}));
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ action: 'deleteCells', data: matrix_clr }));
                }
            });
        } catch (error: any) {
            console.error('Error updating cell:', error);
            // Enviar mensaje de error al cliente a través de WebSocket
            ws.send(JSON.stringify({ action: 'cellUpdateError', error: error.message }));
        }
    }
    
    private async calcArea(ws: WebSocket, findClr: string){
        try {
            const matrix_paint = await this.matrixService.calcArea(findClr);
            //////////////////ws.send(JSON.stringify({ action: 'calcArea', data: matrix_paint}));
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ action: 'calcArea', data: matrix_paint }));
                }
                
            });
        } catch (error: any) {
            console.error('Error calculating area:', error);
            // Enviar mensaje de error al cliente a través de WebSocket
            ws.send(JSON.stringify({ action: 'calcArea', error: error.message }));
        }
    }

    private async restartGame(ws: WebSocket): Promise<void> {
        try {
            const matrixClear = await this.matrixService.restartGame();
            ws.send(JSON.stringify({ action: 'restartGame', data: matrixClear }));
        } catch (error: any) {
            console.error('Error removing matrix:', error);
            // Enviar mensaje de error al cliente a través de WebSocket
            ws.send(JSON.stringify({ action: 'matrixGetError', error: error.message }));
        }
    }

    private async getTop(ws: WebSocket) {
        try {
            const top = await this.matrixService.getTop();
            ////////////////////ws.send(JSON.stringify({ action: 'getTop', data: top}));
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ action: 'getTop', data: top }));
                }
            });
        } catch (error: any) {
            console.error('Error getting top:', error);
            // Enviar mensaje de error al cliente a través de WebSocket
            ws.send(JSON.stringify({ action: 'getting top update', error: error.message }));
        }
    }
}
