import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { Cell } from '../../models/cell.interface'

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

  topPlayers: [nam: string, clr: string, numCell: number][] = [];
  rows: number = 0
  cols: number = 0
  matrix: string[][] = [];
  visitedCells: Cell[] = [];
  orangeCells: Cell[] = [];
  cellSize: number = -1;
  activeCell: Cell;

  gameover = true;
  nam = '';
  clr = '';
  tim = -99

  showPopup: boolean = false;



  paintInterval: any;
  paintIntervalDuration: number = 120;
  padding = 10;
  windowWidth: number = window.innerWidth;
  windowHeight: number = window.innerHeight;
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
    switch (message.action) {
      case 'getMatrixIni':
        this.handleGetMatrixIni(message);
        break;
      case 'activeCell':
        this.handleActiveCell(message);
        break;
      case 'deleteCells':
        this.handleDeleteCells(message);
        break;
      case 'getMatrix':
      case 'restartGame':
        this.handleMatrixUpdate(message.data);
        break;
      case 'calcArea':
        this.handleCalcArea(message.data);
        break;
      case 'getTop':
        this.handleGetTop(message.data);
        break;
      default:
        console.log('Unhandled message action:', message.action);
    }
  }
  
  private handleGetMatrixIni(message: any): void {
    if (message.data) {
      this.initializeMatrix(message.data);
      this.paintMatrix();
      this.moveScroll('b');
      this.websocketService.sendMessage('getTop', {});
    } else {
      console.log('Mensaje del componente, el message.data no regresó la matrix');
    }
  }
  
  private initializeMatrix(data: any): void {
    this.matrix = data.matrix;
    this.rows = this.matrix.length;
    this.cols = this.rows > 0 ? this.matrix[0].length : 0;
    this.cellSize = (this.windowWidth - this.padding * 2) / (this.rows + 1);
    this.canvas.nativeElement.width = this.rows * this.cellSize;
    this.canvas.nativeElement.height = this.cols * this.cellSize;
    this.canvasMin.nativeElement.width = (this.canvas.nativeElement.width * 11) / 100;
    this.canvasMin.nativeElement.height = (this.canvas.nativeElement.height * 16) / 100;
    this.canvasTop.nativeElement.width = (this.canvas.nativeElement.width * 15) / 100;
    this.canvasTop.nativeElement.height = (this.canvas.nativeElement.height * 20) / 100;
    this.activeCell = data.activeCell;
    this.visitedCells = [];
    this.clr = data.activeCell.clr;
    this.prevDirection = "";
    this.gameover = false;
  
    for (let i = this.activeCell.row - 1; i <= this.activeCell.row + 1; i++) {
      for (let j = this.activeCell.col - 1; j <= this.activeCell.col + 1; j++) {
        const cell = { row: i, col: j, clr: this.clr, tim: this.getTim(), val: 'ini', nam: this.nam };
        this.websocketService.sendMessage('activeCell', cell);
      }
    }
  }
  
  private handleActiveCell(message: any): void {
    const cell = message.data;
    if (cell) {
      if (cell.val === 'ok') {
        this.handleCellOk(cell);
      }
      if (cell.val === 'gameover') {
        this.websocketService.sendMessage('deleteCells', cell.clr);
      }
    }
  }
  
  private handleCellOk(cell: any): void {
    this.matrix[cell.row][cell.col] = cell.clr;
    this.paintCell(cell.row, cell.col);
    this.paintCellOk(cell.row, cell.col, cell.clr);
  }
  
  private handleDeleteCells(message: any): void {
    this.matrix = message.data.matrix;
    this.paintMatrix();
    const clr = message.data.clr;
    if (this.clr === clr) {
      this.gameover = true;
      clearInterval(this.paintInterval);
      this.openPopup();
    }
  }
  
  private handleMatrixUpdate(data: any): void {
    this.matrix = data;
    this.paintMatrix();
  }
  
  private handleCalcArea(data: any): void {
    const mCell: Cell[] = data;
    mCell.forEach((cell) => {
      this.matrix[cell.row][cell.col] = cell.clr;
      cell.nam = this.nam;
      this.paintCellOk(cell.row, cell.col, cell.clr);
    });
    this.websocketService.sendMessage('getTop', {});
    this.paintMatrixMin();
  }
  
  private handleGetTop(data: any): void {
    this.topPlayers = data;
    this.paintMatrixTop();
  }
  


  paintMatrix(): void {
    if (this.matrix) {
      for (let i = 0; i < this.rows; i++) {
        for (let j = 0; j < this.cols; j++) {
          this.paintCellOk(i, j, this.matrix[i][j]);
        }
      }
    }
  }


  paintCell(rowDelta: number, colDelta: number): void {
    if (rowDelta === 1) {
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
    const { row, col } = this.activeCell;
    this.paintCellOk(row, col, this.clr);
  }

  paintCellOk(row: number, col: number, clr: string): void {
    const currentRow = row * this.cellSize;
    const currentCol = col * this.cellSize;
    this.canvasContext!.fillStyle = clr;
    this.canvasContext!.fillRect(currentCol, currentRow, this.cellSize, this.cellSize);
  }

  async paintMatrixMin() {
    if (this.matrix) {
      const mCellSize = this.canvasMin.nativeElement.width / this.rows;
      for (let i = 0; i < this.rows; i++) {
        for (let j = 0; j < this.cols; j++) {
          const x = j * mCellSize;
          const y = i * mCellSize;
          if (this.matrix[i][j] == '#383838') {
            this.canvasContextMin!.fillStyle = '#7c7b7b';
          } else {
            this.canvasContextMin!.fillStyle = this.matrix[i][j];
          }
          this.canvasContextMin!.fillRect(x, y, mCellSize, mCellSize);
        }
      }
    }
  }


  paintMatrixTop(): void {
    // Verificar si topPlayers y canvasContextTop existen y son válidos
    if (this.topPlayers && this.canvasContextTop) {
      // Limpiar el lienzo
      this.canvasContextTop.clearRect(0, 0, this.canvasContextTop.canvas.width, this.canvasContextTop.canvas.height);
      // Establecer el color de fondo blanco
      this.canvasContextTop.fillStyle = 'white';
      // Agregar el texto "Leaderboard" en la parte superior
      this.canvasContextTop.font = 'normal 16px Arial'; // Establecer la fuente y el tamaño del texto
      this.canvasContextTop.fillText('Leaderboard', 10, 30);
      // Dibujar la información de los jugadores
      this.topPlayers.forEach((player, index) => {
        const [name, , score] = player; // Ignoramos el color
        // Dibujar el nombre y el puntaje del jugador
        this.canvasContextTop!.fillText(`${index + 1}. ${name} - ${score}`, 10, 60 + index * 30);
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
          if(this.prevDirection !== direction[0] + '' + direction[1]) {
            this.orangeCells.forEach(cell => {
              this.paintCellOk(cell.row, cell.col, this.clr)
            });
            this.orangeCells = [];
          clearInterval(this.paintInterval);
          }
          this.move(direction[0], direction[1]);
          this.prevDirection = direction[0] + '' + direction[1]
          this.paintInterval = setInterval(() => {
            //see coloca dentro de un interval para que se ejecute continuamente
            // hasta que el jugador cambie de flecha
            this.paintCell(direction[0], direction[1]);
            this.move(direction[0], direction[1]);
          }, this.paintIntervalDuration);
        }
      }
    }
  }


  move(rowDelta: number, colDelta: number): void {
    const nRow = this.activeCell.row + rowDelta;
    const nCol = this.activeCell.col + colDelta;
    
    // Actualiza la celda activa con la nueva posición y tiempo
    this.activeCell = { row: nRow, col: nCol, clr: this.clr, tim: this.getTim(), val: '', nam: this.nam };
  
    // Busca si la celda ya fue visitada
    const visitedCellIndex = this.visitedCells.findIndex(cell => cell.row === nRow && cell.col === nCol);
    if (visitedCellIndex !== -1) {
      // La celda ya fue visitada
      this.gameover = true;
      // Borra las celdas del jugador y reinicia las celdas visitadas y pintadas de naranja
      this.clearPlayerCells();
    } else {
      if (this.matrix[nRow][nCol] === this.activeCell.clr && this.visitedCells.length > 0) {
        // Cerró el bucle, enviar al servidor para calcular el área ganada
        this.websocketService.sendMessage('calcArea', this.activeCell.clr);
        this.visitedCells = [];
      } else {
        // Si la celda no es del color del jugador, la agrega a las celdas visitadas
        if (this.matrix[nRow][nCol] !== this.activeCell.clr) {
          this.visitedCells.push(this.activeCell);
          // Elimina las celdas pintadas de naranja que ya no están activas
          this.clearInactiveOrangeCells();
          // Envía la celda activa al servidor para marcarla en la matriz del servicio
          this.websocketService.sendMessage('activeCell', this.activeCell);
        }
      }
      // Pinta la celda en la matriz del jugador y en naranja
      this.paintCellOk(nRow, nCol, this.activeCell.clr);
      this.paintCellOk(nRow, nCol, 'orange');
      this.orangeCells.push(this.activeCell);
    }
  }
  
  // Método para limpiar las celdas del jugador y restablecer las celdas visitadas y pintadas de naranja
  clearPlayerCells(): void {
    this.websocketService.sendMessage('deleteCells', this.clr);
    this.visitedCells = [];
    this.orangeCells.forEach(cell => {
      this.paintCellOk(cell.row, cell.col, this.clr);
    });
    this.orangeCells = [];
  }
  
  // Método para limpiar las celdas pintadas de naranja que ya no están activas
  clearInactiveOrangeCells(): void {
    this.orangeCells.forEach(cell => {
      if (!this.visitedCells.some(vc => vc.row === cell.row && vc.col === cell.col)) {
        this.paintCellOk(cell.row, cell.col, this.clr);
      }
    });
    this.orangeCells = [];
  }
  
  


  moveScroll(direction: string) {
    if (this.scrollContainer !== null) {
      // Calcula el desplazamiento del scroll de acuerdo con la celda actual
      const targetTop = (this.cellSize * this.activeCell.row) - (this.windowHeight / 2) + this.padding * 2;
      const targetLeft = (this.cellSize * this.activeCell.col) - (this.windowWidth / 2) + this.padding * 2;
  
      // Verifica la dirección del desplazamiento y ajusta el scroll en consecuencia
      if (direction === 't') {
        // Desplazamiento hacia arriba o abajo
        this.scrollContainer.nativeElement.scrollTop = targetTop;
      } else {
        // Desplazamiento hacia la derecha o la izquierda
        if (direction === 'l') {
          this.scrollContainer.nativeElement.scrollLeft = targetLeft;
        } else {
          // Desplazamiento en ambas direcciones con transición suave
          this.scrollContainer.nativeElement.scrollTo({
            top: targetTop,
            left: targetLeft,
            behavior: 'smooth'
          });
        }
      }
    }
  }
  


  //Calcula eltiemo en milisegundos en el que se activa la celda en formato numerioc yyyymmddhh24missfff
  getTim(): number {
    return +`${new Date().toISOString().replace(/\D/g, '').slice(0, -1)}${new Date().getMilliseconds().toString().padStart(3, '0')}`;
  }

  startGame() {
    this.websocketService.sendMessage('getMatrixIni', this.nam);
    this.closePopup();
    this.paintMatrixMin();
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



