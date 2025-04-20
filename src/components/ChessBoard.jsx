import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Chessboard } from 'react-chessboard';
import { useSocket } from '../socketContext.js';
import * as actions from '../redux/actions.js';
import shovelSound from '../assets/shovel_sound.mov';

const ChessBoard = () => {
    const dispatch = useDispatch();
    const socket = useSocket();          // use context so that all components reference the same socket

    // extract state from redux 
    const gameFen = useSelector((state) => state.gameFen);
    const isWhite = useSelector((state) => state.isWhite);
    const placingBombs = useSelector((state) => state.placingBombs);
    const myBombs = useSelector((state) => state.player.bombs);

    const [squareMouseIsOver, setSquareMouseIsOver] = useState('');

    useEffect(() => {
        const handleBombPlaced = (square) => {
            dispatch(actions.placeBomb(square));
        };

        socket.on('bombPlaced', handleBombPlaced);

        return () => {
            socket.off('bombPlaced', handleBombPlaced);
        };
    }, [dispatch, socket]);

    useEffect(() => {
        console.log("hello world!");
        myBombs.forEach(square => {
            const squareEl = document.querySelector(`[data-square="${square}"]`);
            if (squareEl && !squareEl.querySelector('.red-x')) {
                const x = document.createElement('div');
                x.className = 'red-x';
                x.textContent = 'X';
                x.style.top = '0';
                x.style.left = '0';
                x.style.width = '100%';
                x.style.height = '100%';
                x.style.display = 'flex';
                x.style.alignItems = 'center';
                x.style.justifyContent = 'center';

                squareEl.style.position = 'relative';
                squareEl.appendChild(x);

                // play shovel sound when bomb buried
                new Audio(shovelSound).play();
            }
        });
    }, [myBombs]);

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
