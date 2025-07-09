import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Chessboard } from 'react-chessboard';
import { useSocket } from '../../socket/socketContext.js';
import * as actions from '../../redux/actions.js';
import { sounds, pieces } from '../../assets';
import { playSound } from '../../utils';
import { GAME_STATES, RGBA } from '../../constants.js';

// hooks
import {
    useGameFen,
    useIsWhite,
    useMyBombs,
    useGameState
} from '../../hooks';

const highlightSquare = (square, colorRgba) => {
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
        x.style.backgroundColor = colorRgba;

        squareEl.appendChild(x);
    }
};

const ChessBoard = () => {
    const dispatch = useDispatch();
    const socket = useSocket();          // use context so that all components reference the same socket

    // extract state from redux 
    const gameFen = useGameFen();
    const isWhite = useIsWhite();
    const myBombs = useMyBombs();
    const gameState = useGameState();

    const [squareMouseIsOver, setSquareMouseIsOver] = useState('');
    const [squaresToHighlight, setSquaresToHighlight] = useState([]);
    const [lastMove, setLastMove] = useState({ from: null, to: null });
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [legalMoves, setLegalMoves] = useState([]);

    useEffect(() => { console.log(`player is set to white: ${isWhite}`) }, [isWhite]);

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

    useEffect(() => {
        // remove all existing highlighted squares
        document.querySelectorAll('.highlighted').forEach((x) => {
            x.remove();
        });

        // redraw (if there are any)
        squaresToHighlight.forEach(square => {
            highlightSquare(square, RGBA.light_yellow);
        });

    }, [squaresToHighlight]);

    useEffect(() => {
        socket.on('movePlayed', ({ from, to }) => {
            setLastMove({ from, to });
            setSelectedSquare(null);
            setLegalMoves([]);
        });

        return () => {
            socket.off('movePlayed');
        };
    }, [socket]);

    const handleClick = async (_e) => {
        const selected = squareMouseIsOver;

        if (gameState === GAME_STATES.placing_bombs && myBombs.length < 3 &&
            ((isWhite && (selected[1] === '3' || selected[1] === '4')) || (!isWhite && (selected[1] === '5' || selected[1] === '6'))) &&
            !myBombs.includes(selected)
        ) {
            socket.emit("placeBomb", selected);
        } else {
            playSound(sounds.illegal);
        }

        console.log(`Clicked on square ${selected}`);
    };

    const onDrop = (sourceSquare, targetSquare, piece) => {
        console.log(`Trying to make move: ${sourceSquare} to ${targetSquare} with ${piece}.`);

        if (GAME_STATES.playing && ((isWhite && piece[0] === 'w') || (!isWhite && piece[0] === 'b'))) {
            socket.emit("makeMove", {
                from: sourceSquare,
                to: targetSquare,
                promotion: piece[1]?.toLowerCase() ?? "q",
            });
        } else {
            playSound(sounds.illegal);
            setSelectedSquare(null);
            setLegalMoves([]);
        }
    };

    const onMouseoverSquare = (square, _pieceOnSquare) => {
        setSquareMouseIsOver(square);

        if (myBombs.length < 3) {
            // highlight the square the mouse is over
            setSquaresToHighlight([square]);
        }
    };

    const onMouseoutSquare = (square, _pieceOnSquare) => {
        setSquaresToHighlight(squaresToHighlight.filter(s => s !== square));
    };

    const onSquareRightClick = (square) => {
        setSquaresToHighlight([...squaresToHighlight, square]);
    };

    const customPieces = Object.fromEntries(
        Object.entries(pieces).map(([pieceCode, imgSrc]) => [
            pieceCode,
            ({ squareWidth }) => (
                <img
                    src={imgSrc}
                    alt={pieceCode}
                    style={{
                        width: squareWidth,
                        height: squareWidth,
                    }}
                />
            ),
        ])
    );

    const getBaseSquareColors = () => {
        const colors = {};
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        for (let rank = 1; rank <= 8; rank++) {
            for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
                const square = files[fileIndex] + rank;
                const isLight = (fileIndex + rank) % 2 === 0;
                colors[square] = {
                    backgroundColor: isLight ? "#e6ddee" : "#a78cc2"
                };
            }
        }
        return colors;
    };

    const customSquareStyles = {
        ...getBaseSquareColors(),
        ...(selectedSquare && { [selectedSquare]: { backgroundColor: "#c7edcc" } }),
        ...(lastMove.from && { [lastMove.from]: { backgroundColor: "#c7edcc" } }),
        ...(lastMove.to && { [lastMove.to]: { backgroundColor: "#c7edcc" } }),
        ...legalMoves.reduce((acc, sq) => {
            acc[sq] = {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '50%'
            };
            return acc;
        }, {}),
        ...squaresToHighlight.reduce((acc, sq) => {
            acc[sq] = { backgroundColor: RGBA.light_yellow };
            return acc;
        }, {}),
    };

    return (
        <div onClick={handleClick}>
            <Chessboard
                position={gameFen}
                onPieceDrop={onDrop}
                {...(gameState === GAME_STATES.placing_bombs ? { onMouseOverSquare: onMouseoverSquare } : {})}
                {...(gameState === GAME_STATES.placing_bombs ? { onMouseOutSquare: onMouseoutSquare } : {})}
                {...(gameState === GAME_STATES.playing ? { onSquareRightClick: onSquareRightClick } : {})}
                boardOrientation={isWhite ? "white" : "black"}
                arePremovesAllowed={true}
                clearPremovesOnRightClick={true}
                customArrowColor={RGBA.iwc_purple}
                customPieces={customPieces}
                boardStyle={{
                    borderRadius: "4px",
                    boxShadow: "0 0 10px #000",
                }}
                customSquareStyles={customSquareStyles}
            />
        </div>
    );
};

export default ChessBoard;
