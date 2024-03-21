import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  vertical = 40;
  horizontal = 40;
  gw: number;
  gh: number;
  position = { x: 0, y: 0 };
  squares = [];
  direction = { x: 0, y: 0 };
  intervalId;
  paused = false;
  footprints = [];
  lastMoveKey;
  initialX: number;
  initialY: number;
  squareColor = 'blue';
  playerColor = '#000D8D';
  gameOver = false;

  private blinkInterval;

  constructor(private router: Router) {}

  private circle = { x: 0, y: 0, radius: 0 };

  ngOnInit(): void {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d');
    this.gw = this.canvas.width / this.horizontal;
    this.gh = this.canvas.height / this.vertical;
    this.createSquares();
    this.position = this.getRandomStartingPosition();
    document.onkeydown = this.handleKeyPress.bind(this);
    this.fillBackground();
    this.drawStartingArea(this.position.x, this.position.y);
    this.circle = { x: this.position.x, y: this.position.y, radius: this.gw / 2 };
    this.drawCircle(this.position.x, this.position.y);
  }

  createSquares() {
    for (let i = 0; i < this.vertical; i++) {
      this.squares[i] = [];
      for (let j = 0; j < this.horizontal; j++) {
        this.squares[i][j] = { visited: false, color: '#646464' };
      }
    }
  }

  getRandomStartingPosition() {
    do {
      this.initialX = Math.floor(Math.random() * (this.horizontal - 5)) + 1;
      this.initialY = Math.floor(Math.random() * (this.vertical - 5)) + 1;
    } while (!this.isStartingPositionValid(this.initialX, this.initialY));
    return { x: this.initialX + 1, y: this.initialY + 1 };
  }

  isStartingPositionValid(initialX: number, initialY: number) {
    for (let i = initialY - 1; i < initialY + 4; i++) {
      for (let j = initialX - 1; j < initialX + 4; j++) {
        if (this.squares[i][j].visited) {
          return false;
        }
      }
    }
    return true;
  }

  drawStartingArea(x: number, y: number) {
    for (let i = y - 1; i < y + 2; i++) {
      for (let j = x - 1; j < x + 2; j++) {
        this.squares[i][j].color = this.squareColor;
        this.drawSquare(j, i, this.squares[i][j].color);
        this.squares[i][j].visited = true;
      }
    }
  }

  handleKeyPress(event: KeyboardEvent) {
    if (!this.paused && !this.gameOver) {
      if (['a', 'd', 'w', 's', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        this.lastMoveKey = event.key;
        const newDirection = this.calculateDirection(event.key);
        if (!this.areOppositeDirections(this.direction, newDirection) || event.key === this.lastMoveKey) {
          this.direction = newDirection;
        } else {
          this.paused = true;
        }
      }
    }

    if (event.key === 'p') {
      this.paused = !this.paused;
      if (this.paused) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    } else if (['a', 'd', 'w', 's', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) && this.paused) {
      this.paused = false;
      this.direction = this.calculateDirection(event.key);
      if (!this.intervalId) {
        this.intervalId = setInterval(this.moveSquare.bind(this), 125);
      }
    }

    if (!this.paused && !this.gameOver && !this.checkCollision(this.position.x + this.direction.x, this.position.y + this.direction.y)) {
      if (!this.intervalId) {
        this.intervalId = setInterval(this.moveSquare.bind(this), 125);
      }
    }
  }

  calculateDirection(key: string) {
    switch (key) {
      case 'a':
      case 'ArrowLeft':
        return { x: -1, y: 0 };
        case 'd':
          case 'ArrowRight':
            return { x: 1, y: 0 };
          case 'w':
          case 'ArrowUp':
            return { x: 0, y: -1 };
          case 's':
          case 'ArrowDown':
            return { x: 0, y: 1 };
        }
      }
    
      areOppositeDirections(dir1, dir2) {
        return dir1.x === -dir2.x || dir1.y === -dir2.y;
      }
    
      moveSquare() {
        const newX = this.position.x + this.direction.x;
        const newY = this.position.y + this.direction.y;
    
        if (newX >= 0 && newX < this.horizontal && newY >= 0 && newY < this.vertical) {
          this.fillBackground();
    
          const prevX = this.position.x;
          const prevY = this.position.y;
          if (this.squares[prevY][prevX].visited) {
            this.drawSquare(prevX, prevY, this.squareColor);
          }
    
          this.drawFootprints();
    
          this.drawCircle(newX, newY);
    
          this.squares[newY][newX].visited = true;
          this.footprints.push({ x: newX, y: newY });
    
          this.position.x = newX;
          this.position.y = newY;
        } else {
          this.gameOver = true;
          this.paused = true; // Si el juego termina, pausarlo automáticamente
          clearInterval(this.intervalId); // Detener el intervalo de movimiento
    
          this.blinkColors();
    
          setTimeout(() => {
            this.router.navigate(['lobby']);
          }, 1000);
        }
      }
    
      checkCollision(newX: number, newY: number): boolean {
        return newX < 0 ||
          newX >= this.horizontal ||
          newY < 0 ||
          newY >= this.vertical;
      }
    
      drawCircle(x: number, y: number) {
        this.circle.x = x;
        this.circle.y = y;
        this.context.beginPath();
        this.context.arc(
          this.circle.x * this.gw + this.circle.radius,
          this.circle.y * this.gh + this.circle.radius,
          this.circle.radius,
          0,
          2 * Math.PI
        );
        this.context.fillStyle = this.playerColor;
        this.context.fill();
        this.context.strokeStyle = '#000854';
        this.context.lineWidth = 1.5;
        this.context.stroke();
      }
    
      drawFootprints() {
        for (let i = 0; i < this.footprints.length; i++) {
          const footprint = this.footprints[i];
          const rx = footprint.x * this.gw;
          const ry = footprint.y * this.gh;
          if (this.squares[footprint.y][footprint.x].visited) {
            this.context.fillStyle = this.squareColor;
            this.context.fillRect(rx, ry, this.gw, this.gh);
            this.context.strokeStyle = 'black';
            this.context.strokeRect(rx, ry, this.gw, this.gh);
          }
        }
      }
    
      fillBackground() {
        this.context.fillStyle = '#000';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = 0; i < this.vertical; i++) {
          for (let j = 0; j < this.horizontal; j++) {
            const square = this.squares[i][j];
            this.context.fillStyle = square.color;
            this.drawSquare(j, i, square.color);
          }
        }
      }
    
      drawSquare(x: number, y: number, color: string) {
        const rx = x * this.gw;
        const ry = y * this.gh;
        this.context.fillStyle = color;
        this.context.fillRect(rx, ry, this.gw, this.gh);
        this.context.strokeStyle = 'black';
        this.context.strokeRect(rx, ry, this.gw, this.gh);
      }
    
      blinkColors() {
        let counter = 0;
        const blinkColorsInterval = setInterval(() => {
          if (counter % 2 === 0) {
            this.fillBackground();
            this.drawFootprints();
          } else {
            this.footprints.forEach((footprint) => {
              const rx = footprint.x * this.gw;
              const ry = footprint.y * this.gh;
              if (this.squares[footprint.y][footprint.x].visited) {
                this.context.fillStyle = 'red';
                this.context.fillRect(rx, ry, this.gw, this.gh);
                this.context.strokeStyle = 'black';
                this.context.strokeRect(rx, ry, this.gw, this.gh);
              }
            });
          }
    
          counter++;
    
          if (counter >= 6) {
            clearInterval(blinkColorsInterval);
          }
        }, 100);
      }
    }
    