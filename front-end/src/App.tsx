import React from 'react';
import './App.css';
import { GameState, Cell } from './game';
import BoardCell from './Cell';

interface Props { }

interface State extends GameState {
  currentPlayer: string;
  winner: string | null;
  canUndo: boolean;
  winningCells: number[] | null;
  history: { cells: Cell[]; player: string }[];
  currentStep: number;
}

class App extends React.Component<Props, State> {
  private initialized: boolean = false;

  constructor(props: Props) {
    super(props);
    this.state = { 
      cells: [],
      currentPlayer: 'X',
      winner: null,
      canUndo: false,
      winningCells: null,
      history: [],
      currentStep: 0
    };
  }

  newGame = async () => {
    try {
      const response = await fetch('/newgame');
      const json = await response.json();
      this.setState({ 
        cells: json.cells,
        currentPlayer: 'X',
        winner: null,
        canUndo: false,
        winningCells: null,
        history: [],
        currentStep: 0
      });
    } catch (error) {
      console.error('Failed to start new game:', error);
    }
  }


  undo = async () => {
    const response = await fetch('/undo');
    const json = await response.json();
    const winner = this.checkWinner(json.cells);
    const winningCells = winner && winner !== 'Draw' ? this.getWinningCells(json.cells) : null;
  
    const newHistory = this.state.history.slice(0, this.state.currentStep - 1);
  
    this.setState({
      cells: json.cells,
      currentPlayer: this.state.currentPlayer === 'X' ? 'O' : 'X',
      winner,
      winningCells,
      canUndo: newHistory.length > 0,
      history: newHistory,
      currentStep: newHistory.length,
    });
  };
  
  
  play(x: number, y: number): React.MouseEventHandler {
    return async (e) => {
      e.preventDefault();
      try {
        // 1. Хэрвээ ялагч байгаа бол цааш тоглохгүй
        if (this.state.winner) return;
  
        // 2. Өмнөх төлвөө хадгалах
        const historyCopy = [...this.state.history];
        historyCopy.push({
          cells: this.state.cells.map(cell => ({ ...cell })), // deep copy хийх хэрэгтэй
          player: this.state.currentPlayer
        });
  
        // 3. Сервер рүү хүсэлт явуулах
        const response = await fetch(`/play?x=${x}&y=${y}`);
        const json = await response.json();
  
        // 4. Шинэ төлвөөр ялагч шалгах
        const winner = this.checkWinner(json.cells);
        const winningCells = winner && winner !== 'Draw' ? this.getWinningCells(json.cells) : null;
  
        // 5. Шинэ төлвийг state-д оноох
        this.setState({
          cells: json.cells,
          currentPlayer: this.state.currentPlayer === 'X' ? 'O' : 'X',
          winner,
          canUndo: true,
          winningCells,
          history: historyCopy,
          currentStep: historyCopy.length, // Өмнөх түүхийг шинэчлэх
        });
      } catch (error) {
        console.error('Failed to play:', error);
      }
    };
  }
  
  
  checkWinner(cells: Cell[]): string | null {
    const winningCombinations = [
      [0,1,2], [3,4,5], [6,7,8], // Rows
      [0,3,6], [1,4,7], [2,5,8], // Columns
      [0,4,8], [2,4,6] // Diagonals
    ];

    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (cells[a].text && 
          cells[a].text === cells[b].text && 
          cells[a].text === cells[c].text) {
        return cells[a].text;
      }
    }
    
    return cells.every(cell => cell.text !== '') ? 'Draw' : null;
  }

  getWinningCells(cells: Cell[]): number[] {
    const winningCombinations = [
      [0,1,2], [3,4,5], [6,7,8], // Rows
      [0,3,6], [1,4,7], [2,5,8], // Columns
      [0,4,8], [2,4,6] // Diagonals
    ];

    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (cells[a].text && 
          cells[a].text === cells[b].text && 
          cells[a].text === cells[c].text) {
        return combination;
      }
    }
    return [];
  }

  createCell(cell: Cell, index: number): React.ReactNode {
    const isWinningCell = this.state.winningCells?.includes(index);
    return (
      <div key={index}>
        {cell.playable && !this.state.winner ? (
          <a href='/' onClick={this.play(cell.x, cell.y)}>
            <BoardCell cell={cell} isWinning={isWinningCell} />
          </a>
        ) : (
          <BoardCell cell={cell} isWinning={isWinningCell} />
        )}
      </div>
    );
  }

  showHistory = () => {
    console.log("Game History:");
    this.state.history.forEach((step, index) => {
      console.log(`Move ${index + 1} by ${step.player}:`);
      step.cells.forEach((cell, i) => {
        process.stdout.write(cell.text || '-');
        if ((i + 1) % 3 === 0) console.log();
      });
      console.log('---');
    });
  };

  componentDidMount(): void {
    if (!this.initialized) {
      this.newGame();
      this.initialized = true;
    }
  }

  render(): React.ReactNode {
    const status = this.state.winner 
      ? this.state.winner === 'Draw' 
        ? 'Game Over: Draw!'
        : `Winner: ${this.state.winner}!`
      : `Current Player: ${this.state.currentPlayer}`;

    return (
      <div className="game-container">
        <div id="instructions">{status}</div>
        <div id="board" className={this.state.winner ? 'game-over' : ''}>
          {this.state.cells.map((cell, i) => this.createCell(cell, i))}
        </div>
        <div id="bottombar">
          <button onClick={this.newGame}>New Game</button>
          <button onClick={this.undo} disabled={!this.state.canUndo || this.state.winner !== null}>
            Undo
          </button>
        </div>
      </div>
    );
  }
}

export default App;