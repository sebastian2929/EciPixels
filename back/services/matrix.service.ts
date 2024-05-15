
import WebSocket from 'ws';
import { Cell } from '../models/cell.interface'

export class MatrixService {
  private wss: WebSocket.Server;
  constructor(wss: WebSocket.Server) {
    this.wss = wss;
    this.createMatrix();
    this.createMatrix();
  }

  topPlayers: [nam: string, clr: string, numCell: number][] = [];
  matrix: string[][] = [];
  visitedCells: Cell[] = [];
  rows: number = 320; //320
  cols: number = 320; //320
  backgrounColor = '#383838'

  public async getMatrixIni(mNam: string): Promise<{ matrix: string[][], activeCell: Cell }> {
    try {
      let cell: Cell;
      let clr = this.getRandomColor();
      if (clr !== "") {
        let row = Math.floor(Math.random() * (this.rows - 8)) + 4;
        let col = Math.floor(Math.random() * (this.cols - 8)) + 4;
        for (let i = row - 1; i <= row + 1; i++) {
          for (let j = col - 1; j <= col + 1; j++) {
            this.matrix[i][j] = clr;
          }
        }
        cell = { row, col, clr, tim: 0, val: "", nam: mNam }
      } else {
        cell = { row: 0, col: 0, clr, tim: 0, val: "", nam: mNam }
      }
      this.topPlayers.push([mNam, clr, 0]);
      return { matrix: this.matrix, activeCell: cell };
    }
    catch (error) {
      console.error('Error creating matrix:', error);
      throw error;
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
            return this.handleGameOver(mCell);
        }

        const count: number = this.getCountOfCells(mCell.clr);

        if (count > 0) {
            const visitedCell = this.getVisitedCell(mCell);
            if (visitedCell) {
                this.updateVisitedCell(visitedCell, mCell);
            } else {
                this.handleNewCellWithinBounds(mCell);
            }
        } else {
            return this.handleGameOver(mCell);
        }

        return mCell;
    } catch (error) {
        console.error('Error updating cell:', error);
        throw error;
    }
}

private getCountOfCells(color: string): number {
    return this.matrix.flat().filter(cell => cell === color).length;
}

private getVisitedCell(cell: Cell): Cell | undefined {
    return this.visitedCells.find(c => c.row === cell.row && c.col === cell.col);
}

private updateVisitedCell(visitedCell: Cell, newCell: Cell): void {
    if (visitedCell.tim < newCell.tim) {
        this.updateCells(visitedCell, newCell);
    } else {
        this.updateCells(newCell, visitedCell);
    }
}

private handleNewCellWithinBounds(cell: Cell): void {
    if (this.isWithinBounds(cell)) {
        this.updateMatrixAndVisitedCells(cell);
        cell.val = 'ok';
    } else {
        this.handleGameOver(cell);
    }
}

private handleGameOver(cell: Cell): Cell {
    cell.val = 'gameover';
    if (cell.val === 'gameover') {
        this.removePlayerFromTopPlayers(cell.nam);
    }
    return cell;
}

private isWithinBounds(cell: Cell): boolean {
    return cell.row >= 1 && cell.row <= this.rows - 2 && cell.col >= 1 && cell.col <= this.cols - 2;
}

private updateMatrixAndVisitedCells(cell: Cell): void {
    this.matrix[cell.row][cell.col] = cell.clr;
    if (cell.val !== 'ini') {
        this.visitedCells.push(cell);
    }
}

private removePlayerFromTopPlayers(playerName: string): void {
    this.topPlayers = this.topPlayers.filter(player => player[0] !== playerName);
}

private updateCells(cellToKeep: Cell, cellToDelete: Cell): void {
    this.deleteCells(cellToKeep.clr);
    this.visitedCells = this.visitedCells.filter(cell => cell.clr !== cellToKeep.clr);
    this.matrix[cellToDelete.row][cellToDelete.col] = cellToDelete.clr;
}


  public async calcArea(findClr: string): Promise<Cell[]> {
    try {
      let mCell: Cell[] = [];
      // Calculate mins and maxs
      let minRow = Number.MAX_SAFE_INTEGER;
      let minCol = Number.MAX_SAFE_INTEGER;
      let maxRow = 0;
      let maxCol = 0;
      //calcula min's y max's row y col
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
      // Iterate over the area
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          //Se analizan solo as celdas del color diferente al buscado
          if (this.matrix[r][c] !== findClr) {
            //Cuenta el número de límites del findClr de la celda evaluada
            let paso: number = 0;
            // Right
            for (let c1 = c + 1; c1 <= maxCol; c1++) {
              if (this.matrix[r][c1] === findClr) {
                //Encontró un límite por derecha
                paso++;
                break;
              }
            }
            // Left
            for (let c1 = c - 1; c1 >= minCol; c1--) {
              if (this.matrix[r][c1] === findClr) {
                paso++;
                break;
              }
            }
            // Down
            for (let r1 = r + 1; r1 <= maxRow; r1++) {
              if (this.matrix[r1][c] === findClr) {
                paso++;
                break;
              }
            }
            // Up
            for (let r1 = r - 1; r1 >= minRow; r1--) {
              if (this.matrix[r1][c] === findClr) {
                paso++;
                break;
              }
            }
            //Si se encuntran los 4 límites se pinda del color
            if (paso === 4) {
              this.matrix[r][c] = findClr;
              mCell.push({ row: r, col: c, val: '', nam: '', clr: findClr, tim: -99 });
              paso = 0;
            }
          }
        }
      }
      this.visitedCells = this.visitedCells.filter(cell => cell.clr !== findClr);
      //return this.matrix;
      return mCell;
    } catch (error: any) {
      console.error('Error calculating area:', error);
      throw error;
    }
  }

  public async deleteCells(clr: string): Promise<{ matrix: string[][], clr: string }> {
    //await this.bds.updateGamersStateByColor(clr, 'I');
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

  public async restartGame(): Promise<String[][]> {
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

