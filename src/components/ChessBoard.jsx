import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Chessboard } from 'react-chessboard';
import { useSocket } from '../socketContext.js';
import * as actions from '../redux/actions.js';;

const ChessBoard = () => {
    const dispatch = useDispatch();
    const socket = useSocket();          // use context so that all components reference the same socket

    // extract state from redux 
    const gameFen = useSelector((state) => state.gameFen);
    const isWhite = useSelector((state) => state.isWhite);
    const placingBombs = useSelector((state) => state.placingBombs);
    const myBombs = useSelector((state) => state.player.bombs);

    const [squareMouseIsOver, setSquareMouseIsOver] = useState('');

    // const [roomId, setRoomId] = useState(null);

    // // the useEffects subscribe to events when the component mounts
    // useEffect(() => {
    //     // we update the redux state by dispatching actions when we receive server updates
    //     socket.on("game:update", (newGameState) => {
    //         dispatch(updateGameFromServer(newGameState));
    //     });

    //     return () => {
    //         socket.off("game:update");
    //     };
    // }, [dispatch]);

    // useEffect(() => {
    //     socket.emit("move:make", {
    //         from: sourceSquare,
    //         to: targetSquare,
            
    //     })
    // })

    // TODO: delete comments
    // const makeMove = (move) => {
    //     const gameCopy = new Chess(game.fen());  // create a real clone of game
    //     const intendedMove = gameCopy.move(move);

    //     if (intendedMove === null) return false; // illegal move

    //     setGame(gameCopy);                       // only set state if move is legal
    //     return true;
    // }

    // uisng UseCallback to memoize a function for performance
    // const onDrop = useCallback(
    //     (sourceSquare, targetSquare, piece) => {
    //         if (!isMyTurn) return false;

    //         const move = {
    //             from: sourceSquare,
    //             to: targetSquare,
    //             roomId: roomId,
    //             promotion: piece[1]?.toLowerCase() ?? "q",
    //         };

    //         const result = game.move(move);

    //     }
    //     , 
    //     [game, isMyTurn, dispatch]
    // )

        useEffect(() => {
            const handleBombPlaced = (square) => {
                dispatch(actions.placeBomb(square));
            };
    
            socket.on('bombPlaced', handleBombPlaced);
    
            return () => {
                socket.off('bombPlaced', handleBombPlaced);
            };
        }, [dispatch, socket]);

    const handleClick = (_e) => {
        if (placingBombs && myBombs.length < 3) {
            if ((isWhite && (squareMouseIsOver[1] === '3' || squareMouseIsOver[1] === '4')) || (!isWhite && (squareMouseIsOver[1] === '5' || squareMouseIsOver[1] === '6'))) {
                // bombs should only be placed on ranks 3-4 as white, and 5-6 as black
                socket.emit("placeBomb", squareMouseIsOver);
            } else {
                console.log(`Cannot place bombs as ${isWhite ? "white" : "black"} on ${squareMouseIsOver}.`);
            }
        }

        console.log(`Clicked on square ${squareMouseIsOver}`);
    };
    
    const onDrop = (sourceSquare, targetSquare, piece) => {

    };

    // keeps track of where our mouse is
    const onMouseoverSquare = (square, _pieceOnSquare) => {
        setSquareMouseIsOver(square);
    };
    
    
    // (startSquare, endSquare, piece) => {
    //     socket.emit("makeMove", {
    //         from: startSquare,
    //         to: endSquare,
    //         promotion: piece[1]?.toLowerCase() ?? "q",
    //     });
    // };

    return (
        <div onClick={handleClick}>
            <Chessboard 
                position={gameFen} 
                onPieceDrop={onDrop} 
                onMouseOverSquare={onMouseoverSquare}
                boardOrientation={isWhite ? "white" : "black"}
            />
        </div>
    );
};

export default ChessBoard;
