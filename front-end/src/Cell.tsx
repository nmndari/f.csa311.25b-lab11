import React from 'react';
import { Cell } from './game';

interface Props {
  cell: Cell;
  isWinning?: boolean;
}

class BoardCell extends React.Component<Props> {
  render(): React.ReactNode {
    const className = `cell ${this.props.cell.playable ? 'playable' : ''} ${this.props.isWinning ? 'winning' : ''}`;
    return (
      <div className={className}>{this.props.cell.text}</div>
    );
  }
}

export default BoardCell;