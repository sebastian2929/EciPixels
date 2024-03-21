import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LobbyComponent } from './components/lobby/lobby.component'; 
import { GameComponent } from './components/game/game.component';


const routes: Routes = [
  { path: '', redirectTo: 'lobby', pathMatch: 'prefix' },
  { path: 'game/:id', component: GameComponent },
  { path: 'lobby', component: LobbyComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
