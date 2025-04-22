import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Chessboard } from 'react-chessboard';
import { useSocket } from '../socketContext.js';
import * as actions from '../redux/actions.js';

// sound effects
import shovelSound from '../assets/shovel_sound.mov';
import illegalSound from '../assets/illegal.mp3';

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
        // remove all existing red-Xs
        document.querySelectorAll('.red-x').forEach((x) => {
            x.remove();
        });

        // redraw all of them (so that when a bomb detonates, removed bomb is not there)
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

                if (placingBombs) {
                    // play shovel sound when bomb buried
                    new Audio(shovelSound).play();
                }
            }
        });
    }, [myBombs]);

    const handleClick = (_e) => {
        const selectedSquare = squareMouseIsOver;  // accounting for sudden changes in mouse movement
        if (placingBombs && myBombs.length < 3 &&
            ((isWhite && (selectedSquare[1] === '3' || selectedSquare[1] === '4')) || (!isWhite && (selectedSquare[1] === '5' || selectedSquare[1] === '6'))) &&
            !myBombs.includes(selectedSquare)
        ) {
            // bombs should only be placed on ranks 3-4 as white, and 5-6 as black
            socket.emit("placeBomb", selectedSquare);
        } else {
            new Audio(illegalSound).play();
        }

        console.log(`Clicked on square ${selectedSquare}`);
    };

    const onDrop = (sourceSquare, targetSquare, piece) => {
        console.log(`Trying to make move: ${sourceSquare} to ${targetSquare} with ${piece}.`);

        if ((isWhite && piece[0] === 'w') || (!isWhite && piece[0] === 'b')) {
            // trying to move own pieces
            socket.emit("makeMove", {
                from: sourceSquare,
                to: targetSquare,
                promotion: piece[1]?.toLowerCase() ?? "q",
            });
        } else {
            // trying to move opponent's pieces
            new Audio(illegalSound).play();
        }
    };

    // keeps track of where our mouse is
    const onMouseoverSquare = (square, _pieceOnSquare) => {
        setSquareMouseIsOver(square);

        if (myBombs.length < 3) {
            // highlight the square the mouse is over
            const squareEl = document.querySelector(`[data-square="${square}"]`);
            if (squareEl && !squareEl.querySelector('.highlighted')) {
                squareEl.style.position = 'relative';

                const x = document.createElement('div');
                x.className = 'highlighted';

                // Set absolute positioning for the highlight element
                x.style.position = 'absolute';
                x.style.top = '0';
                x.style.left = '0';
                x.style.width = '100%';
                x.style.height = '100%';
                x.style.display = 'flex';
                x.style.alignItems = 'center';
                x.style.justifyContent = 'center';
                x.style.backgroundColor = '#ffeb3b';
                x.style.opacity = '0.5';

                squareEl.appendChild(x);
            }
        }
    };

    // TODO: get rid of highlighted squares when our mouse is off
    const onMouseoutSquare = (square, _pieceOnSquare) => {
        const squareEl = document.querySelector(`[data-square="${square}"]`);

        if (squareEl) {
            const highlightDiv = squareEl.querySelector('.highlighted');
            if (highlightDiv) {
                highlightDiv.remove();
            } else {
                console.log(`${square} is not highlighted`);
            }
        }

    }

    return (
        <div
            onClick={handleClick}
        >
            <Chessboard
                position={gameFen}
                onPieceDrop={onDrop}
                {...(placingBombs ? { onMouseOverSquare: onMouseoverSquare } : {})}
                {...(placingBombs ? { onMouseOutSquare: onMouseoutSquare } : {})}
                boardOrientation={isWhite ? "white" : "black"}
            />
        </div>
    );
};

export default ChessBoard;
