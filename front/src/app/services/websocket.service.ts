import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  // WebSocketSubject para manejar la conexión WebSocket
  private socket$: WebSocketSubject<any>; 
  constructor() {
    // Inicializar el WebSocketSubject con la URL del servidor WebSocket
    this.socket$ = webSocket('ws://localhost:3000'); // URL del servidor WebSocket
  }

  /**
   * Envía un mensaje al servidor WebSocket.
   * @param action Acción a realizar en el servidor.
   * @param data Datos asociados con la acción.
   */
  public sendMessage(action: any, data: any): void {
    this.socket$.next(JSON.stringify({ action, data }));
  }

  /**
   * Obtiene el objeto WebSocketSubject para recibir mensajes del servidor.
   * @returns Objeto WebSocketSubject para recibir mensajes del servidor.
   */
  public getMessage(): WebSocketSubject<any> {
    return this.socket$;
  }

}
