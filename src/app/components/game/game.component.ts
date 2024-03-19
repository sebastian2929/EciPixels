import { Component, OnInit } from '@angular/core';

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
  posicion = { x: 0, y: 0 };
  cuadros = [];
  direccion = { x: 0, y: 0 };
  intervalId;
  pausado = false;
  huellas = [];
  ultimaTeclaMovimiento;

  private circulo: { x: number, y: number, radio: number };

  ngOnInit(): void {
    this.canvas = document.getElementById('lienzo') as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d');
    this.gw = this.canvas.width / this.horizontal;
    this.gh = this.canvas.height / this.vertical;
    this.posicion.x = Math.floor(this.horizontal / 2);
    this.posicion.y = Math.floor(this.vertical / 2);
    this.crearCuadros();
    document.onkeydown = this.manejarTecla.bind(this);
    this.fillBackground();
    this.circulo = { x: this.posicion.x, y: this.posicion.y, radio: this.gw / 2 };
  }

  crearCuadros() {
    for (let i = 0; i < this.vertical; i++) {
      this.cuadros[i] = [];
      for (let j = 0; j < this.horizontal; j++) {
        this.cuadros[i][j] = { visitado: false, color: '#646464' };
      }
    }
  }

  manejarTecla(event: KeyboardEvent) {
    if (this.pausado && ['a', 'd', 'w', 's'].includes(event.key)) {
      this.pausado = false;
      this.direccion = this.calcularDireccion(event.key);
    } else {
      switch (event.key) {
        case 'a':
        case 'd':
        case 'w':
        case 's':
          this.ultimaTeclaMovimiento = event.key;
          const nuevaDireccion = this.calcularDireccion(event.key);
          if (
            !this.sonDireccionesOpuestas(this.direccion, nuevaDireccion) ||
            event.key === this.ultimaTeclaMovimiento
          ) {
            this.direccion = nuevaDireccion;
          } else {
            this.pausado = true;
          }
          break;
        case 'p':
          this.pausado = !this.pausado;
          break;
      }
    }

    if (!this.pausado) {
      if (!this.intervalId) {
        this.intervalId = setInterval(this.moverCuadro.bind(this), 125);
      }
    } else if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  calcularDireccion(tecla: string) {
    switch (tecla) {
      case 'a':
        return { x: -1, y: 0 };
      case 'd':
        return { x: 1, y: 0 };
      case 'w':
        return { x: 0, y: -1 };
      case 's':
        return { x: 0, y: 1 };
    }
  }

  sonDireccionesOpuestas(dir1, dir2) {
    return dir1.x === -dir2.x || dir1.y === -dir2.y;
  }

  moverCuadro() {
    const newX = this.posicion.x + this.direccion.x;
    const newY = this.posicion.y + this.direccion.y;
    if (
      newX >= 0 &&
      newX < this.horizontal &&
      newY >= 0 &&
      newY < this.vertical
    ) {
      this.fillBackground();
      this.drawHuellas();
      this.dibujarCirculo(this.posicion.x, this.posicion.y);
      this.cuadros[this.posicion.y][this.posicion.x].visitado = true;
      this.huellas.push({ x: this.posicion.x, y: this.posicion.y });
      this.posicion.x = newX;
      this.posicion.y = newY;
    }
  }

  dibujarCirculo(x: number, y: number) {
    this.circulo.x = x;
    this.circulo.y = y;
    this.context.beginPath();
    this.context.arc(this.circulo.x * this.gw + this.circulo.radio, this.circulo.y * this.gh + this.circulo.radio, this.circulo.radio, 0, 2 * Math.PI);
    this.context.fillStyle = '#000D8D';
    this.context.fill();
    this.context.strokeStyle = '#000854';
    this.context.lineWidth = 1.5;
    this.context.stroke();
  }

  drawHuellas() {
    for (let i = 0; i < this.huellas.length; i++) {
      const huella = this.huellas[i];
      const rx = huella.x * this.gw;
      const ry = huella.y* this.gh;
      if (this.cuadros[huella.y][huella.x].visitado) {
        this.context.fillStyle = 'blue';
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
        const cuadro = this.cuadros[i][j];
        this.context.fillStyle = cuadro.color;
        this.drawSquare(j, i, cuadro.color);
      }
    }
  }

  drawSquare(x: number, y: number, color: string) {
    const rx = x * this.gw;
    const ry = y * this.gh;
    this.context.fillStyle = color;
    this.context.fillRect(rx, ry, this.gw, this.gh);
    this.context.strokeStyle = 'black';
    this.context.lineWidth = 2;
    this.context.strokeRect(rx, ry, this.gw, this.gh);
  }
}