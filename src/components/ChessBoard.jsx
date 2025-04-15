import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Chessboard } from 'react-chessboard';
import Chess from 'chess.js';

const ChessBoard = () => {
    const game = useSelector((state) => state.game);
    const orientation = useSelector((state) => state.orientation);

    const makeMove = (move) => {
        const gameCopy = new Chess(game.fen());  // create a real clone of game
        const intendedMove = gameCopy.move(move);

        if (intendedMove === null) return false; // illegal move

        setGame(gameCopy);                       // only set state if move is legal
        return true;
    }

    const onDrop = (startSquare, endSquare, piece) => {
        makeMove({
            from: startSquare,
            to: endSquare,
            promotion: piece[1].toLowerCase() ?? "q"
        });
    }

    return (
        <div>
            <Chessboard position={game.fen()} onPieceDrop={onDrop} boardOrientation={orientation} />
        </div>
    );
};

export default ChessBoard;
