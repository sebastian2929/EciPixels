
import WebSocket from 'ws';
import { Cell } from '../models/cell.interface'

export class MatrixService {
  private wss: WebSocket.Server;
  //private bds: BdService;
  constructor(wss: WebSocket.Server) {
    this.wss = wss;
    //this.bds = new BdService(wss);
    this.createMatrix();
    this.createMatrix();
  }

  topPlayers: [nam: string, clr: string, numCell: number][] = [];
  matrix: string[][] = [];
  visitedCells: Cell[] = [];
  rows: number = 50; //320
  cols: number = 50; //320
  backgrounColor = '#383838'

  public async getMatrixIni(mNam: string): Promise<{ matrix: string[][], activeCell: Cell }> {
    try {
      let cell: Cell;
      let clr = this.getRandomColor();

      if (clr !== "") {
        cell = await this.generateValidCell(mNam, clr);
      } else {
        cell = { row: 0, col: 0, clr, tim: 0, val: "", nam: mNam };
      }

      this.topPlayers.push([mNam, clr, 0]);

      return { matrix: this.matrix, activeCell: cell };
    } catch (error) {
      console.error('Error creating matrix:', error);
      throw error;
    }
  }

  private async generateValidCell(mNam: string, clr: string): Promise<Cell> {
    let row: number, col: number;
    let validPlacement = false;

    do {
      [row, col] = await this.generateRandomCoordinates();
      if (this.isValidPlacement(row, col)) {
        validPlacement = true;
        this.colorPlayerArea(row, col, clr);
      }
    } while (!validPlacement);

    return { row, col, clr, tim: 0, val: "", nam: mNam };
  }

  private async generateRandomCoordinates(): Promise<[number, number]> {
    const row = Math.floor(Math.random() * (this.rows - 6)) + 3;
    const col = Math.floor(Math.random() * (this.cols - 6)) + 3;
    return [row, col];
  }

  private isValidPlacement(row: number, col: number): boolean {
    for (let i = row - 1; i <= row + 1; i++) {
      for (let j = col - 1; j <= col + 1; j++) {
        if (this.matrix[i][j] !== this.backgrounColor) {
          return false;
        }
      }
    }
    return true;
  }

  private colorPlayerArea(row: number, col: number, clr: string): void {
    for (let i = row - 1; i <= row + 1; i++) {
      for (let j = col - 1; j <= col + 1; j++) {
        this.matrix[i][j] = clr;
      }
    }
  }

  public async getMatrix(): Promise<string[][]> {
    try {
      return this.matrix;
    }
    catch (error) {
      console.error('Error creating matrix:', error);
      throw error;
    }
  }

  public async createMatrix(): Promise<void> {
    try {
      for (let i = 0; i < this.rows; i++) {
        this.matrix[i] = [];
        for (let j = 0; j < this.cols; j++) {
          if (i === 0 || i === this.rows - 1 || j === 0 || j === this.cols - 1) {
            this.matrix[i][j] = "#2b2828";
          } else
            this.matrix[i][j] = this.backgrounColor;
        }
      }
    } catch (error) {
      console.error('Error creating matrix:', error);
      throw error;
    }
  }

  public async activeCell(mCell: Cell): Promise<Cell> {
    try {
        if (!mCell) {
            return this.handleMissingCell();
        }

        const count = this.countCellsWithColor(mCell.clr);

        if (count === 0) {
            return this.handleNoCellsFound(mCell);
        }

        const visitedCell = this.findVisitedCell(mCell);

        if (visitedCell) {
            return this.handleVisitedCell(visitedCell, mCell);
        }

        return this.handleNewCell(mCell);
    } catch (error) {
        console.error('Error updating cell:', error);
        throw error;
    }
}

private handleMissingCell(): Cell {
    const cell: Cell = {
        row: 0,
        col: 0,
        clr: '',
        tim: 0,
        val: 'gameover',
        nam: ''
    };
    return cell;
}

private countCellsWithColor(color: string): number {
    return this.matrix.flat().filter(cell => cell === color).length;
}

private handleNoCellsFound(mCell: Cell): Cell {
    mCell.val = 'gameover';
    return mCell;
}

private findVisitedCell(mCell: Cell): Cell | undefined {
    return this.visitedCells.find(cell => cell.row === mCell.row && cell.col === mCell.col);
}

private handleVisitedCell(visitedCell: Cell, mCell: Cell): Cell {
    if (visitedCell.tim < mCell.tim) {
        this.deleteCells(visitedCell.clr);
        this.visitedCells = this.visitedCells.filter(cell => cell.clr !== visitedCell.clr);
        this.matrix[mCell.row][mCell.col] = mCell.clr;
    } else {
        this.deleteCells(mCell.clr);
        this.visitedCells = this.visitedCells.filter(cell => cell.clr !== mCell.clr);
        this.matrix[visitedCell.row][visitedCell.col] = visitedCell.clr;
    }
    return mCell;
}

private handleNewCell(mCell: Cell): Cell {
    if (
        mCell.row < 1 ||
        mCell.row > this.rows - 2 ||
        mCell.col < 1 ||
        mCell.col > this.cols - 2
    ) {
        mCell.val = 'gameover';
    } else {
        this.matrix[mCell.row][mCell.col] = mCell.clr;
        if (mCell.val !== 'ini') {
            this.visitedCells.push(mCell);
        }
        mCell.val = 'ok';
    }

    if (mCell.val === 'gameover') {
        this.topPlayers = this.topPlayers.filter(player => player[0] !== mCell.nam);
    }

    return mCell;
}


public async calcArea(findClr: string): Promise<Cell[]> {
  try {
      const mCell: Cell[] = [];
      const { minRow, minCol, maxRow, maxCol } = this.calculateMinMaxRowsAndCols(findClr);

      for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
              if (this.matrix[r][c] !== findClr) {
                  const foundLimits = this.findLimits(findClr, r, c, minCol, maxCol, minRow, maxRow);

                  if (foundLimits === 4) {
                      this.matrix[r][c] = findClr;
                      mCell.push({ row: r, col: c, val: '', nam: '', clr: findClr, tim: -99 });
                  }
              }
          }
      }

      this.visitedCells = this.visitedCells.filter(cell => cell.clr !== findClr);
      return mCell;
  } catch (error: any) {
      console.error('Error calculating area:', error);
      throw error;
  }
}

private calculateMinMaxRowsAndCols(findClr: string): { minRow: number, minCol: number, maxRow: number, maxCol: number } {
  let minRow = Number.MAX_SAFE_INTEGER;
  let minCol = Number.MAX_SAFE_INTEGER;
  let maxRow = 0;
  let maxCol = 0;

  for (let i = 0; i < this.matrix.length; i++) {
      for (let j = 0; j < this.matrix[i].length; j++) {
          if (this.matrix[i][j] === findClr) {
              minRow = Math.min(minRow, i);
              minCol = Math.min(minCol, j);
              maxRow = Math.max(maxRow, i);
              maxCol = Math.max(maxCol, j);
          }
      }
  }

  return { minRow, minCol, maxRow, maxCol };
}

private findLimits(findClr: string, r: number, c: number, minCol: number, maxCol: number, minRow: number, maxRow: number): number {
  let foundLimits = 0;

  for (let c1 = c + 1; c1 <= maxCol; c1++) {
      if (this.matrix[r][c1] === findClr) {
          foundLimits++;
          break;
      }
  }

  for (let c1 = c - 1; c1 >= minCol; c1--) {
      if (this.matrix[r][c1] === findClr) {
          foundLimits++;
          break;
      }
  }

  for (let r1 = r + 1; r1 <= maxRow; r1++) {
      if (this.matrix[r1][c] === findClr) {
          foundLimits++;
          break;
      }
  }

  for (let r1 = r - 1; r1 >= minRow; r1--) {
      if (this.matrix[r1][c] === findClr) {
          foundLimits++;
          break;
      }
  }

  return foundLimits;
}


  public async deleteCells(clr: string): Promise<{ matrix: string[][], clr: string }> {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        if (this.matrix[i][j] === clr) {
          this.matrix[i][j] = this.backgrounColor;
        }
      }
    }
    this.topPlayers = this.topPlayers.filter(player => player[1] !== clr);
    return { matrix: this.matrix, clr: clr };
  }


  getRandomColor(): string {
    // Genera un número hexadecimal aleatorio entre 0 y 16777215 (FFFFFF en hexadecimal)
    const randomHex = Math.floor(Math.random() * 16777215).toString(16);
    // Asegura que el número generado tenga 6 dígitos
    const hexColor = '000000'.substring(0, 6 - randomHex.length) + randomHex;
    // Retorna el color en el formato '#xxxxxx'
    return '#' + hexColor;
  }

  public async restartGame(): Promise<string[][]> {
    try {
      for (let i = 0; i < this.rows; i++) {
        for (let j = 0; j < this.cols; j++) {
          this.matrix[i][j] = this.backgrounColor;
        }
      }
      return this.matrix;

    } catch (error) {
      console.error('Error creating matrix:', error);
      throw error;
    }
  }

  public async getTop() {
    try {
      // Reiniciar el recuento de puntos para todos los jugadores
      this.topPlayers.forEach(player => {
        player[2] = 0;
      });

      // Calcular el recuento de puntos para cada jugador en la matriz
      this.matrix.forEach(row => {
        row.forEach(element => {
          const playerIndex = this.topPlayers.findIndex(player => player[1] === element);
          if (playerIndex !== -1) {
            this.topPlayers[playerIndex][2]++;
          }
        });
      });

      // Filtrar los jugadores con puntos y ordenar la lista por puntaje
      const playersWithPoints = this.topPlayers.filter(player => player[2] > 0);
      return playersWithPoints.sort((a, b) => b[2] - a[2]).slice(0, 5);
    } catch (error) {
      console.error('Error getting top:', error);
      throw error;
    }
  }

}

