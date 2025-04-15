import React from 'react';
import { useSelector } from 'react-redux';
import ChessBoard from './ChessBoard';
import './BoardPage.css';

const MoveHistory = () => {
    const moveHistory = useSelector((state) => state.game.moveHistory);

    return (
        <div className="move-history">
            <h3>Moves</h3>
            {moveHistory.map((move, i) => (
                <div key={i}>
                    {String.fromCharCode(97 + move.from.col)}{8 - move.from.row} →{' '}
                    {String.fromCharCode(97 + move.to.col)}{8 - move.to.row}
                    {move.bombDetonated && ' 💣'}
                </div>
            ))}
        </div>
    );
};

const BoardPage = () => {
    const player = useSelector((state) => state.game.player);
    const opponent = useSelector((state) => state.game.opponent);

    return (
        <div className="game-container">
            <div className="chess-wrapper">
                <div className="player-info top">
                    <span>{opponent.name}</span>
                    <span>{opponent.rating}</span>
                    <span>💣 x{opponent.bombs}</span>
                </div>

                <div className="chess-board-container">
                    <ChessBoard />
                </div>

                <div className="player-info bottom">
                    <span>{player.name}</span>
                    <span>{player.rating}</span>
                    <span>💣 x{player.bombs}</span>
                </div>
            </div>

            <MoveHistory />
        </div>
    );
};

export default BoardPage;
