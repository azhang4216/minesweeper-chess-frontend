import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import Chess from 'chess.js';

const ChessBoard = () => {
    const [game, setGame] = useState(new Chess());

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
            {/* TODO: boardOrientation={"white"} or "black" */}
            <Chessboard id="BasicBoard" position={game.fen()} onPieceDrop={onDrop}/>
        </div>
    );
};

export default ChessBoard;
