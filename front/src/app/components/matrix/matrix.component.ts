import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { Cell } from '../../models/cell.interface';

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
  rows: number = 0;
  cols: number = 0;
  matrix: string[][] = [];
  visitedCells: Cell[] = [];
  orangeCells: Cell[] = [];
  cellSize: number = -1;
  activeCell: Cell;

  gameover = true;
  nam = '';
  clr = '';
  tim = -99;

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

  ngOnDestroy(): void {
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
        this.matrix = message.data.matrix;
        this.rows = this.matrix.length;
        this.cols = this.matrix.length > 0 ? this.matrix[0].length : 0;
        this.cellSize = (this.windowWidth - this.padding * 2) / (this.rows + 1);
        this.canvas.nativeElement.width = this.rows * this.cellSize;
        this.canvas.nativeElement.height = this.cols * this.cellSize;
        this.canvasMin.nativeElement.width = (this.canvas.nativeElement.width * 11) / 100
        this.canvasMin.nativeElement.height = (this.canvas.nativeElement.height * 16) / 100
        this.canvasTop.nativeElement.width = (this.canvas.nativeElement.width * 15) / 100
        this.canvasTop.nativeElement.height = (this.canvas.nativeElement.height * 20) / 100
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
          this.paintCell(cell.row, cell.col);
          this.paintCellOk(cell.row, cell.col, cell.clr);
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
      const mCell: Cell[] = message.data;
      mCell.forEach((cell) => {
        this.matrix[cell.row][cell.col] = cell.clr;
        cell.nam = this.nam;
        this.paintCellOk(cell.row, cell.col, cell.clr);
      });
      this.websocketService.sendMessage('getTop', {});
      this.paintMatrixMin();
    }
    if (message.action === 'getTop') {
      this.topPlayers = message.data;
      this.paintMatrixTop();
    }
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

  paintMatrixMin(): void {
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
    if (this.topPlayers && this.canvasContextTop) {
      this.canvasContextTop.clearRect(0, 0, this.canvasContextTop.canvas.width, this.canvasContextTop.canvas.height);
      this.canvasContextTop!.fillStyle = 'white';
      this.canvasContextTop.font = 'normal 16px Arial';
      this.canvasContextTop.fillText('Leaderboard', 10, 30);
      this.topPlayers.forEach((player, index) => {
        const [name, , score] = player;
        this.canvasContextTop!.fillText(`${index + 1}. ${name} - ${score}`, 10, 60 + index * 30);
      });
    }
  }

  prevDirection: string = '';
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.gameover) {
      event.preventDefault();
      const directionMap: { [key: string]: [number, number] } = {
        'ArrowUp': [-1, 0],
        'ArrowDown': [1, 0],
        'ArrowLeft': [0, -1],
        'ArrowRight': [0, 1]
      };
      const direction = directionMap[event.key];
      if (direction) {
        if (this.prevDirection !== direction[0] + '' + direction[1]) {
          if (this.prevDirection !== direction[0] + '' + direction[1]) {
            this.orangeCells.forEach(cell => {
              this.paintCellOk(cell.row, cell.col, this.clr)
            });
            this.orangeCells = [];
            clearInterval(this.paintInterval);
          }
          this.move(direction[0], direction[1]);
          this.prevDirection = direction[0] + '' + direction[1]
          this.paintInterval = setInterval(() => {
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
    this.activeCell = { row: nRow, col: nCol, clr: this.clr, tim: this.getTim(), val: '', nam: this.nam };
    const visitedCell = this.visitedCells.slice(1, this.visitedCells.length - 1).find(cell => cell.row === nRow && cell.col === nCol);
    if (visitedCell) {
      this.gameover = true;
      this.websocketService.sendMessage('deleteCells', this.clr);
      this.visitedCells = [];
      this.orangeCells.forEach(cell => {
        this.paintCellOk(cell.row, cell.col, this.clr);
      });
      this.orangeCells = [];
    } else {
      if (this.matrix[nRow][nCol] === this.activeCell.clr && this.visitedCells.length > 0) {
        this.websocketService.sendMessage('calcArea', this.activeCell.clr);
        this.visitedCells = [];
      } else {
        if (this.matrix[nRow][nCol] !== this.activeCell.clr) {
          this.visitedCells.push(this.activeCell);
          this.orangeCells.forEach(cell => {
            if (!this.visitedCells.some(vc => vc.row === cell.row && vc.col === cell.col)) {
              this.paintCellOk(cell.row, cell.col, this.clr);
            }
          });
          this.orangeCells = [];
          this.websocketService.sendMessage('activeCell', this.activeCell);
        }
      }
      this.paintCellOk(nRow, nCol, this.activeCell.clr);
      this.paintCellOk(nRow, nCol, 'orange');
      this.orangeCells.push(this.activeCell);
    }
  }

  moveScroll(direction: string): void {
    if (this.scrollContainer !== null) {
      const targetTop = (this.cellSize * this.activeCell.row) - (this.windowHeight / 2) + this.padding * 2;
      const targetLeft = (this.cellSize * this.activeCell.col) - (this.windowWidth / 2) + this.padding * 2;
      if (direction === 't') {
        this.scrollContainer.nativeElement.scrollTop = targetTop;
      } else {
        if (direction === 'l') {
          this.scrollContainer.nativeElement.scrollLeft = targetLeft;
        } else {
          this.scrollContainer.nativeElement.scrollTo({
            top: targetTop,
            left: targetLeft,
            behavior: 'smooth'
          });
        }
      }
    }
  }

  getTim(): number {
    return +`${new Date().toISOString().replace(/\D/g, '').slice(0, -1)}${new Date().getMilliseconds().toString().padStart(3, '0')}`;
  }

  startGame(): void {
    this.websocketService.sendMessage('getMatrixIni', this.nam);
    this.closePopup();
    this.paintMatrixMin();
  }

  restartGame(): void {
    this.websocketService.sendMessage('restartGame', {});
  }

  openPopup(): void {
    this.showPopup = true;
  }

  closePopup(): void {
    this.showPopup = false;
  }

}
