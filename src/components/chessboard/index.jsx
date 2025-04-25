import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Chessboard } from 'react-chessboard';
import { useSocket } from '../../socket/socketContext.js';
import * as actions from '../../redux/actions.js';
import { sounds } from '../../assets';
import { playSound } from '../../utils';
import { GAME_STATES } from '../../constants.js';

// hooks
import {
    useGameFen,
    useIsWhite,
    useMyBombs,
    useGameState
} from '../../hooks';

const ChessBoard = () => {
    const dispatch = useDispatch();
    const socket = useSocket();          // use context so that all components reference the same socket

    // extract state from redux 
    const gameFen = useGameFen();
    const isWhite = useIsWhite();
    const myBombs = useMyBombs();
    const gameState = useGameState();

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

                if (gameState === GAME_STATES.placing_bombs) {
                    // play shovel sound when bomb buried
                    playSound(sounds.shovel);
                }
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myBombs]);

    const handleClick = (_e) => {
        const selectedSquare = squareMouseIsOver;  // accounting for sudden changes in mouse movement
        if (gameState === GAME_STATES.placing_bombs && myBombs.length < 3 &&
            ((isWhite && (selectedSquare[1] === '3' || selectedSquare[1] === '4')) || (!isWhite && (selectedSquare[1] === '5' || selectedSquare[1] === '6'))) &&
            !myBombs.includes(selectedSquare)
        ) {
            // bombs should only be placed on ranks 3-4 as white, and 5-6 as black
            socket.emit("placeBomb", selectedSquare);
        } else {
            playSound(sounds.illegal);
        }

        console.log(`Clicked on square ${selectedSquare}`);
    };

    const onDrop = (sourceSquare, targetSquare, piece) => {
        console.log(`Trying to make move: ${sourceSquare} to ${targetSquare} with ${piece}.`);

        if (GAME_STATES.playing && ((isWhite && piece[0] === 'w') || (!isWhite && piece[0] === 'b'))) {
            // trying to move own pieces
            socket.emit("makeMove", {
                from: sourceSquare,
                to: targetSquare,
                promotion: piece[1]?.toLowerCase() ?? "q",
            });
        } else {
            // trying to move opponent's pieces
            playSound(sounds.illegal);
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
                {...(gameState === GAME_STATES.placing_bombs ? { onMouseOverSquare: onMouseoverSquare } : {})}
                {...(gameState === GAME_STATES.placing_bombs ? { onMouseOutSquare: onMouseoutSquare } : {})}
                boardOrientation={isWhite ? "white" : "black"}
            />
        </div>
    );
};

export default ChessBoard;
