import { Component, OnInit, TemplateRef } from '@angular/core';
import { ViewChild, ElementRef } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { Cell } from '../../models/cell.interface'
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-matrix',
  templateUrl: './matrix.component.html',
  styleUrls: ['./matrix.component.css']
})

export class MatrixComponent implements OnInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasMin') canvasMin!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasTop') canvasTop!: ElementRef<HTMLCanvasElement>;

  topPlayers: { name: string, clr: string, numCell: number }[] = [];
  rows: number = 0
  cols: number = 0
  matrix: string[][] = [];
  visitedCells: Cell[] = [];
  cellSize: number = -1;
  activeCell: Cell;

  gameover = true;
  nam = '';
  clr = '';
  tim = -99

  showPopup: boolean = false;



  paintInterval: any;
  paintIntervalDuration: number = 100;
  padding = 10;
  windowWidth: number = window.innerWidth + 120;
  windowHeight: number = window.innerHeight + 120;
  canvasContext: CanvasRenderingContext2D | null = null;
  canvasContextMin: CanvasRenderingContext2D | null = null;
  canvasContextTop: CanvasRenderingContext2D | null = null;

  constructor(private websocketService: WebsocketService) {
    this.activeCell = { row: 0, col: 0, clr: this.clr, tim: this.tim, val: '', nam: this.nam };
  }

  ngOnInit(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.setupWebSocket();
    this.openPopup();
  }

  startTime: Date | undefined;
  timerInterval: any;

  //
  ngAfterViewInit(): void {
    this.canvasContext = this.canvas.nativeElement.getContext('2d');
    this.canvasContextMin = this.canvasMin.nativeElement.getContext('2d');
    this.canvasContextTop = this.canvasTop.nativeElement.getContext('2d');
    if (this.canvasContextMin) {
      this.canvasContextMin.globalAlpha = 0.4;
    }
    if (this.canvasContextTop) {
      this.canvasContextTop.globalAlpha = 0.4;
    }
  }

  ngOnDestroy() {
    clearInterval(this.paintInterval);
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private setupWebSocket(): void {
    const socket = this.websocketService.getMessage();
    socket.subscribe((message) => {
      this.handleIncomingMessage(message);
    });
  }

  private handleIncomingMessage(message: any): void {
    if (message.action === 'getMatrixIni') {
      if (message.data) {
        this.matrix = (message.data.matrix);
        this.rows = this.matrix.length;
        this.cols = this.matrix.length > 0 ? this.matrix[0].length : 0;
        this.cellSize = (this.windowWidth - this.padding * 2) / (this.rows + 1);
        this.canvas.nativeElement.width = this.rows * this.cellSize;
        this.canvas.nativeElement.height = this.cols * this.cellSize;
        this.canvasMin.nativeElement.width = (this.canvas.nativeElement.width * 11) / 100
        this.canvasMin.nativeElement.height = (this.canvas.nativeElement.height * 16) / 100
        this.canvasTop.nativeElement.width = (this.canvas.nativeElement.width * 15) / 100
        this.canvasTop.nativeElement.height = (this.canvas.nativeElement.height * 10) / 100
        this.activeCell = (message.data.activeCell);
        this.visitedCells = [];
        this.clr = (message.data.activeCell.clr);
        this.prevDirection = "";
        this.gameover = false;
        for (let i = this.activeCell.row - 1; i <= this.activeCell.row + 1; i++) {
          for (let j = this.activeCell.col - 1; j <= this.activeCell.col + 1; j++) {
            const cell = { row: i, col: j, clr: this.clr, tim: this.getTim(), val: 'ini', nam: this.nam };
            this.websocketService.sendMessage('activeCell', cell);
          }
        }
        this.paintMatrix();
        this.moveScroll('b');
        this.websocketService.sendMessage('getTop', {});

      }
      else {
        console.log('Mensaje del componente, el message.data no regresó la matrix');
      }
    }
    if (message.action === 'activeCell') {
      const cell = message.data;
      if (cell) {
        if (cell.val === 'ok') {
          this.matrix[cell.row][cell.col] = cell.clr
          this.paintCellOk(cell);
        }
        if (cell.val === 'gameover') {
          this.websocketService.sendMessage('deleteCells', cell.clr);
        }
      }
    }
    if (message.action === 'deleteCells') {
      this.matrix = message.data.matrix
      this.paintMatrix();
      const clr = message.data.clr
      if (this.clr === clr) {
        this.gameover = true;
        clearInterval(this.paintInterval);
        this.openPopup();
      }
    }
    if (message.action === 'getMatrix') {
      this.matrix = (message.data);
      this.paintMatrix();
    }
    if (message.action === 'restartGame') {
      this.matrix = message.data;
      this.paintMatrix();
    }
    if (message.action === 'calcArea') {
      //this.matrix = message.data;
      //this.paintMatrix();
      const mCell: Cell[] = message.data;
      mCell.forEach((cell) => {
        ////this.websocketService.sendMessage('activeCell', cell);    
        this.matrix[cell.row][cell.col] = cell.clr;
        cell.nam = this.nam;
        this.paintCellOk(cell);
      });
      this.websocketService.sendMessage('getTop', {});
    }
    if(message.action === 'getTop'){
      this.topPlayers = message.data;      
      this.paintMatrixTop();
    }
  }



  paintMatrix(): void {
    if (this.matrix) {
      for (let i = 0; i < this.rows; i++) {
        for (let j = 0; j < this.cols; j++) {
          const x = j * this.cellSize;
          const y = i * this.cellSize;
  
          // Verifica si es la celda activa
          const isActiveCell = i === this.activeCell.row && j === this.activeCell.col;
  
          // Rellena la celda con el color correspondiente
          this.canvasContext!.fillStyle = this.matrix[i][j];
          this.canvasContext!.fillRect(x, y, this.cellSize, this.cellSize);
        }
      }
      this.paintMatrixMin();
      this.paintMatrixTop();
    }
  }
  
  
  
  

  async paintMatrixMin() {
    if (this.matrix) {
      const mCellSize = this.canvasMin.nativeElement.width / this.rows;
      for (let i = 0; i < this.rows; i++) {
        for (let j = 0; j < this.cols; j++) {
          const x = j * mCellSize;
          const y = i * mCellSize;
          this.canvasContextMin!.strokeStyle = "#272625"; // Color del borde
          this.canvasContextMin!.lineWidth = (mCellSize * 40) / 100; // Grosor del borde
          this.canvasContextMin!.strokeRect(x, y, mCellSize, mCellSize);
          // Rellena la celda con el color correspondiente
          this.canvasContextMin!.fillStyle = this.matrix[i][j];
          this.canvasContextMin!.fillRect(x, y, mCellSize, mCellSize);
        }
      }
    }
  }


  paintMatrixTop(): void {
    if (this.topPlayers && this.canvasContextTop) { // Comprueba si topPlayers y canvasContextTop existen
      // Limpiar el lienzo
      this.canvasContextTop.clearRect(0, 0, this.canvasContextTop.canvas.width, this.canvasContextTop.canvas.height);
  
      // Agregar el texto "Leaderboard" en la parte superior
      this.canvasContextTop.fillStyle = 'black';
      this.canvasContextTop.font = 'bold 17px Arial'; // Establecer la fuente y el tamaño del texto
      this.canvasContextTop.fillText('Leaderboard', 8, 25);
  
      // Dibujar la información de los jugadores
      this.topPlayers.forEach((player, index) => {
        if (typeof player === 'object' && 'name' in player && 'numCell' in player) {
          // Si player es un objeto con las propiedades 'name' y 'numCell', extraemos las propiedades
          const playerName = player.name.toString();
          const score = player.numCell;
          this.canvasContextTop!.fillStyle = 'black';
          this.canvasContextTop!.fillText(`${index + 1}. ${playerName} - ${score}`, 10, 46 + index * 20);
          console.log(score);
          console.log(playerName);
          
          
        } else {
          // Si player no es un objeto válido, lo ignoramos o lo tratamos de manera diferente
          console.log(`Elemento en topPlayers en la posición ${index} no es válido.`);
          // Podrías omitirlo, lanzar un error, o manejarlo de otra manera según tus necesidades
        }
      });
    }
  }







  //Evitar tecla oprimida y mantenida
  prevDirection: string = '';
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.gameover) {
      event.preventDefault();
      //clave valor: calve la palabra que identifica la techa. Valor, el arreglo de dos elementos [x, y]
      const directionMap: { [key: string]: [number, number] } = {
        'ArrowUp': [-1, 0],
        'ArrowDown': [1, 0],
        'ArrowLeft': [0, -1],
        'ArrowRight': [0, 1]
      };
      const direction = directionMap[event.key];
      if (direction) {
        //controla que si mantienen oprimida la misma flecha no se validará
        if (this.prevDirection !== direction[0] + '' + direction[1]) {
          clearInterval(this.paintInterval);
          this.move(direction[0], direction[1]);
          this.prevDirection = direction[0] + '' + direction[1]
          this.paintInterval = setInterval(() => {
            //see coloca dentro de un interval para que se ejecute continuamente
            // hasta que el jugador cambie de flecha
            this.move(direction[0], direction[1]);
          }, this.paintIntervalDuration);
        }
      }
    }
  }


  move(rowDelta: number, colDelta: number): void {
    const nRow = this.activeCell.row + rowDelta;
    const nCol = this.activeCell.col + colDelta;
    // actualiza la celda 
    //PILAS el this.getTim obtiene el tiempo en el que la celda fue activa yyyymmddhhh24missfff hast amilisegundos
    // ese tiempo en el back sirce para identificar el tiempo de colisión 
    this.activeCell = { row: nRow, col: nCol, clr: this.clr, tim: this.getTim(), val: '', nam: this.nam };
    //busca si la celda ya fue visitada 
    const visitedCell = this.visitedCells.slice(1, this.visitedCells.length - 1).find(cell => cell.row === nRow && cell.col === nCol);
    if (visitedCell) {
      // ya fue visitada
      this.gameover = true;
      //borra las celdas del jugador "gameover"
      this.websocketService.sendMessage('deleteCells', this.activeCell.clr);
      //deja en blanco las celdas
      this.visitedCells = [];
    } else {
      if (this.matrix[nRow][nCol] === this.activeCell.clr && this.visitedCells.length > 0) {
        //Cerró el bucle
        // enviar la back para calcular el area ganad
        this.websocketService.sendMessage('calcArea', this.activeCell.clr);
        this.visitedCells = [];
      } else {
        // si ningina de las anteriores se adiciona a las celdas visitadas
        if (this.matrix[nRow][nCol] !== this.activeCell.clr) {
          this.visitedCells.push(this.activeCell);
          //enviar la celda activa para que se marque en la matris.srvice
          this.websocketService.sendMessage('activeCell', this.activeCell);
        }
      }
      //pinta la celda en la matrix del jugador
      this.dirScroll(rowDelta, colDelta);
      // verificar colisión
      //Como erificar la colición??
      // en el back matrix.service en activiCell() colocar esta validación
    }
  }

  dirScroll(rowDelta: number, colDelta: number): void {
    if (rowDelta === 1) {
      //mueve el scroll para dejar siempre visible al jugador la celda activa
      this.moveScroll('t');
    }
    if (colDelta === 1) {
      this.moveScroll('l');
    }
    if (rowDelta === -1) {
      this.moveScroll('t');
    }
    if (colDelta === -1) {
      this.moveScroll('l');
    }
  }

  moveScroll(direction: string) {
    if (this.scrollContainer !== null) {
      // calcula el desplazamiento del scroll de acuerd ocon le celdaActual
      const targetTop = (this.cellSize * this.activeCell.row) - (this.windowHeight / 2) + this.padding * 2;
      const targetLeft = (this.cellSize * this.activeCell.col) - (this.windowWidth / 2) + this.padding * 2;
      if (direction === 't') {
        //arriab ao abajo
        this.scrollContainer.nativeElement.scrollTop = targetTop;
      } else {
        //Derecha o izquierda
        if (direction === 'l') {
          this.scrollContainer.nativeElement.scrolLeft = targetLeft;
        } else {
          // en ambossentidos
          this.scrollContainer.nativeElement.scrollTo({
            top: targetTop,
            left: targetLeft,
            behavior: 'smooth' // Establece la transición suave
          });
        }
      }
    }
  }

  paintCellOk(cell: Cell): void {
    //Pinta la celda que llega del WS y es "ok"
    const { row, col, clr } = cell;
    this.canvasContext!.fillStyle = cell.clr;
    let currentRow = row * this.cellSize;
    let currentCol = col * this.cellSize;
    const rightX = (col + 1) * this.cellSize;
    this.canvasContext!.clearRect(currentCol, currentRow, 1, this.cellSize);
    this.canvasContext!.fillRect(currentCol, currentRow, this.cellSize, this.cellSize);
  }

  //Calcula eltiemo en milisegundos en el que se activa la celda en formato numerioc yyyymmddhh24missfff
  getTim(): number {
    return +`${new Date().toISOString().replace(/\D/g, '').slice(0, -1)}${new Date().getMilliseconds().toString().padStart(3, '0')}`;
  }


  startGame() {
    const name = this.nam;
    this.websocketService.sendMessage('setName', name);
    //this.websocketService.sendMessage('getMatrixIni', {});
    this.closePopup();
  }

  restartGame() {
    this.websocketService.sendMessage('restartGame', {});
  }

  openPopup() {
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
  }

}



