import { Injectable } from '@angular/core';
import { Client, Message, StompSubscription } from '@stomp/stompjs';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client;

  constructor() {
    this.client = new Client();
    this.client.webSocketFactory = () => new WebSocket('ws://localhost:4200/lobby');
    this.client.onConnect = () => {
      // Una vez que la conexión está establecida, llamas a joinGame()
      this.joinGame('uniquePlayerId');
    };
    this.client.activate();
  }  

  subscribe(topic: string): Observable<Message> {
    return new Observable<Message>((observer) => {
      const subscription: StompSubscription = this.client.subscribe(topic, (message: Message) => {
        observer.next(message);
      });
      return () => subscription.unsubscribe();
    });
  }

  sendMessage(topic: string, message: any): void {
    this.client.publish({ destination: topic, body: JSON.stringify(message) });
  }

  joinGame(playerId: string): void {
    // Envía un mensaje al servidor para unir al jugador al juego
    this.sendMessage('/game/join', { playerId });
  }
}
