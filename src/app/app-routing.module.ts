import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LobbyComponent } from './components/lobby/lobby.component'; 
import { GameComponent } from './components/game/game.component';

const routes: Routes = [
  { path: '', component: LobbyComponent },
  { path: 'game/:id', component: GameComponent }, 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }