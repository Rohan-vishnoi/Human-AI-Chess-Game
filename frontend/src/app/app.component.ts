import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chessground } from 'chessground';
import { Api } from 'chessground/api';
import { Config } from 'chessground/config';
import { Chess } from 'chess.js';
import { Key } from 'chessground/types';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  cg!: Api;
  chess = new Chess();

  gameState: 'WELCOME' | 'PLAYING' | 'GAME_OVER' = 'WELCOME';
  playerName: string = '';
  playerColor: 'WHITE' | 'BLACK' = 'WHITE';
  isAiThinking: boolean = false;

  // PASTE YOUR EMULATOR URL HERE:
  private readonly BACKEND_URL = 'http://127.0.0.1:5001/chess-ai-1003/us-central1/getAiMove';
  // This setter fixes the invisible board bug!
  @ViewChild('boardRef') set boardRef(element: ElementRef) {
    if (element && this.gameState === 'PLAYING' && !this.cg) {
      setTimeout(() => {
        this.initBoard(element.nativeElement);
      }, 10);
    }
  }

  startGame() {
    if (!this.playerName.trim()) {
      alert('Please enter your name!');
      return;
    }

    this.gameState = 'PLAYING';
    this.chess.reset();
    this.isAiThinking = false;

    if (this.playerColor === 'BLACK') {
      this.makeAiMove();
    }
  }

  initBoard(boardElement: HTMLElement) {
    const cgConfig: Config = {
      fen: this.chess.fen(),
      orientation: this.playerColor.toLowerCase() as 'white' | 'black',
      turnColor: 'white',
      movable: {
        color: this.playerColor.toLowerCase() as 'white' | 'black',
        free: false,
        dests: this.getLegalMoves()
      },
      events: {
        move: (orig, dest) => this.onUserMove(orig, dest)
      }
    };

    this.cg = Chessground(boardElement, cgConfig);
  }

  getLegalMoves(): Map<Key, Key[]> {
    const dests = new Map<Key, Key[]>();
    this.chess.moves({ verbose: true }).forEach(m => {
      const from = m.from as Key;
      const to = m.to as Key;
      if (!dests.has(from)) dests.set(from, []);
      dests.get(from)?.push(to);
    });
    return dests;
  }

  onUserMove(orig: any, dest: any) {
    try {
      this.chess.move({ from: orig, to: dest, promotion: 'q' });
      this.updateBoardState();

      if (this.chess.isGameOver()) {
        this.handleGameOver();
      } else {
        this.makeAiMove();
      }
    } catch (error) {
      console.error('Illegal move attempted');
      if (this.cg) this.cg.set({ fen: this.chess.fen() });
    }
  }

  async makeAiMove() {
    this.isAiThinking = true;
    const aiColor = this.playerColor === 'WHITE' ? 'BLACK' : 'WHITE';

    try {
      const response = await fetch(this.BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fen: this.chess.fen(),
          aiColor: aiColor
        })
      });

      const data = await response.json();

      if (data.move) {
        this.chess.move(data.move);
        this.updateBoardState();

        if (this.chess.isGameOver()) {
          this.handleGameOver();
        }
      } else {
        console.error('AI returned an invalid response:', data);
        alert('The AI got confused! Check the console.');
      }
    } catch (error) {
      console.error('Error contacting AI backend:', error);
      alert('Failed to reach the AI backend. Is your emulator running?');
    } finally {
      this.isAiThinking = false;
    }
  }

  updateBoardState() {
    if (!this.cg) return;
    this.cg.set({
      fen: this.chess.fen(),
      turnColor: this.chess.turn() === 'w' ? 'white' : 'black',
      movable: {
        color: this.playerColor.toLowerCase() as 'white' | 'black',
        dests: this.getLegalMoves()
      }
    });
  }

  handleGameOver() {
    this.gameState = 'GAME_OVER';
    setTimeout(() => {
      if (this.chess.isCheckmate()) alert('Checkmate! Game Over.');
      else if (this.chess.isDraw()) alert('Game ended in a Draw.');
      else if (this.chess.isStalemate()) alert('Stalemate! Game Over.');
    }, 500);
  }

  resetGame() {
    this.gameState = 'WELCOME';
    this.playerName = '';
    this.playerColor = 'WHITE';
    this.isAiThinking = false;
    if (this.cg) {
      this.cg.destroy();
      // @ts-ignore
      this.cg = undefined;
    }
  }
}
