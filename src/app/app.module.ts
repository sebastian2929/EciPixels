import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material/material.module';
import { LobbyComponent } from './components/lobby/lobby.component';
import { GameComponent } from './components/game/game.component';
import { FloorPipe } from './floor.pipe';

@NgModule({
  declarations: [
    AppComponent,
    LobbyComponent,
    GameComponent,
    FloorPipe,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MaterialModule,
    RouterModule,
    AppRoutingModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
