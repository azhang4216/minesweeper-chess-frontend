import { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useSocket } from '../../socket/socketContext.js';
import * as actions from '../../redux/actions.js';
import { sounds, pieces, images } from '../../assets';
import { playSound } from '../../utils';
import { GAME_STATES, RGBA } from '../../constants.js';

// hooks
import {
    useGameFen,
    useIsWhite,
    useIsMyTurn,
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

// Converts a square ("e4") and board orientation to a percentage-based absolute style
// so an overlay element sits exactly on that square within a position:relative wrapper.
const squareToOverlayStyle = (square, isWhite) => {
    const fileIndex = square.charCodeAt(0) - 97; // 'a'=0 .. 'h'=7
    const rank = parseInt(square[1], 10);         // 1..8
    const left = isWhite ? fileIndex / 8 : (7 - fileIndex) / 8;
    const top = isWhite ? (8 - rank) / 8 : (rank - 1) / 8;
    return {
        position: 'absolute',
        left: `${left * 100}%`,
        top: `${top * 100}%`,
        width: '12.5%',
        height: '12.5%',
    };
};

// displayBombs: Array<{ square: string, isOpponent: boolean }> | null
// When provided, overrides the redux-driven myBombs rendering (used for history nav,
// game-over view, and analyze view). When null, falls back to myBombs from redux.
const ChessBoard = ({ displayFen, visibleCraters = [], animationDuration, displayBombs = null, clickToMove = false }) => {
    const dispatch = useDispatch();
    const socket = useSocket();          // use context so that all components reference the same socket

    // extract state from redux
    const gameFen = useGameFen();
    const isWhite = useIsWhite();
    const isMyTurn = useIsMyTurn();
    const myBombs = useMyBombs();
    const gameState = useGameState();

    const isHistory = !!displayFen;
    const isGameOver = gameState === GAME_STATES.game_over;

    // Refs keep onDrop closures fresh when react-chessboard re-fires premoves
    const isMyTurnRef = useRef(isMyTurn);
    const isHistoryRef = useRef(isHistory);
    const gameStateRef = useRef(gameState);
    const gameFenRef = useRef(gameFen);
    isMyTurnRef.current = isMyTurn;
    isHistoryRef.current = isHistory;
    gameStateRef.current = gameState;
    gameFenRef.current = gameFen;

    const [squareMouseIsOver, setSquareMouseIsOver] = useState('');
    const [squaresToHighlight, setSquaresToHighlight] = useState([]);
    const [rightClickHighlights, setRightClickHighlights] = useState(new Set());
    const [customArrows, setCustomArrows] = useState([]);
    const [lastMove, setLastMove] = useState({ from: null, to: null });
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [legalMoves, setLegalMoves] = useState([]);

    useEffect(() => {
        const handleBombPlaced = (square) => {
            dispatch(actions.placeBomb(square));
        };

        socket.on('bombPlaced', handleBombPlaced);

        return () => {
            socket.off('bombPlaced', handleBombPlaced);
        };
    }, [dispatch, socket]);

    // Play shovel sound when the player adds a new bomb during placement phase.
    // Tracks count via ref so it fires exactly once per new bomb regardless of re-renders.
    const prevBombCountRef = useRef(0);
    useEffect(() => {
        if (gameState === GAME_STATES.placing_bombs && myBombs.length > prevBombCountRef.current) {
            playSound(sounds.shovel);
        }
        prevBombCountRef.current = myBombs.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myBombs.length]);

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


    // Ensures that when we start playing, any highlighted squares are removed
    useEffect(() => {
        if (gameState === GAME_STATES.playing) {
            setSquaresToHighlight([]);
        }
    }, [gameState]);

    const handleClick = async (_e) => {
        // Only handle clicks during bomb placement — during play, react-chessboard
        // handles interaction via onDrop/onSquareClick and this handler must not
        // fire the illegal-move sound on every square click.
        if (gameState !== GAME_STATES.placing_bombs) return;

        const selected = squareMouseIsOver;

        if (myBombs.length < 3 &&
            ((isWhite && (selected[1] === '3' || selected[1] === '4')) || (!isWhite && (selected[1] === '5' || selected[1] === '6'))) &&
            !myBombs.includes(selected)
        ) {
            socket.emit("placeBomb", selected);
        } else {
            playSound(sounds.illegal);
        }
    };

    const onDrop = (sourceSquare, targetSquare, piece) => {
        if (isHistoryRef.current) return false;
        if (gameStateRef.current !== GAME_STATES.playing) return false;

        const isMyPiece = (isWhite && piece[0] === 'w') || (!isWhite && piece[0] === 'b');
        if (!isMyPiece) return false;

        if (!isMyTurnRef.current) {
            // Not my turn — queue as premove; library re-fires onPieceDrop when position updates.
            // Premoves are cleared automatically on explosion (board remounts, resetting library state),
            // which is correct: the position changed drastically and the premove should be reassessed.
            return true;
        }

        // It's my turn (fresh drop or queued premove firing).
        // Validate before emitting so illegal moves (e.g. don't escape check) snap back instead of looping.
        let chessValidator;
        try {
            chessValidator = new Chess(gameFenRef.current);
        } catch {
            // Post-explosion FEN may be missing a king — chess.js can't parse it.
            // Skip client-side validation and let the server decide.
            chessValidator = null;
        }
        if (chessValidator) {
            try {
                // Use 'q' for promotion validation — we only need legality, not the specific piece.
                // piece[1] is the dragged piece type (e.g. 'P'), not the promotion target.
                chessValidator.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
            } catch {
                return false; // illegal move — snap piece back and clear queued premove
            }
        }

        socket.emit("makeMove", {
            from: sourceSquare,
            to: targetSquare,
            promotion: piece[1]?.toLowerCase() ?? "q",
        });
        return true;
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
        setRightClickHighlights(prev => {
            const next = new Set(prev);
            if (next.has(square)) next.delete(square);
            else next.add(square);
            return next;
        });
    };

    const clearAnnotations = () => {
        setRightClickHighlights(new Set());
        setCustomArrows([]); // new reference triggers library's internal clearArrows()
    };

    // Clear click-to-move selection whenever the mode is turned off
    useEffect(() => {
        if (!clickToMove) {
            setSelectedSquare(null);
            setLegalMoves([]);
        }
    }, [clickToMove]);

    const handleClickToMove = (square) => {
        clearAnnotations();
        if (!isMyTurnRef.current) return;

        // Deselect if clicking the already-selected square
        if (selectedSquare === square) {
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
        }

        // Move to the clicked square if it's a legal destination
        if (selectedSquare && legalMoves.includes(square)) {
            socket.emit('makeMove', { from: selectedSquare, to: square, promotion: 'q' });
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
        }

        // Try to select a piece on the clicked square
        let chess;
        try { chess = new Chess(gameFenRef.current); } catch { return; }

        const piece = chess.get(square);
        const isMyPiece = piece && (
            (isWhite && piece.color === 'w') || (!isWhite && piece.color === 'b')
        );

        if (isMyPiece) {
            setSelectedSquare(square);
            try {
                const moves = chess.moves({ square, verbose: true });
                setLegalMoves(moves.map(m => m.to));
            } catch {
                setLegalMoves([]);
            }
        } else {
            setSelectedSquare(null);
            setLegalMoves([]);
        }
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
                    draggable={false} // so that we don't get "double" pieces on drag for custom
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

    // Amber glow on valid bomb placement squares during placing_bombs phase
    const placementGlow = useMemo(() => {
        if (gameState !== GAME_STATES.placing_bombs) return {};
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const validRanks = isWhite ? ['3', '4'] : ['5', '6'];
        const styles = {};
        for (const file of files) {
            for (const rank of validRanks) {
                const sq = file + rank;
                if (!myBombs.includes(sq)) {
                    styles[sq] = { boxShadow: 'inset 0 0 0 2px rgba(245, 158, 11, 0.35)' };
                }
            }
        }
        return styles;
    }, [gameState, isWhite, myBombs]);

    const customSquareStyles = {
        ...getBaseSquareColors(),
        ...placementGlow,
        ...(selectedSquare && { [selectedSquare]: { backgroundColor: "#c7edcc" } }),
        ...(lastMove.from && { [lastMove.from]: { backgroundColor: "#c7edcc" } }),
        ...(lastMove.to && { [lastMove.to]: { backgroundColor: "#c7edcc" } }),
        ...legalMoves.reduce((acc, sq) => {
            acc[sq] = {
                background: 'radial-gradient(circle, rgba(0,0,0,0.25) 28%, transparent 28%)',
            };
            return acc;
        }, {}),
        ...squaresToHighlight.reduce((acc, sq) => {
            acc[sq] = { backgroundColor: RGBA.light_yellow };
            return acc;
        }, {}),
        ...[...rightClickHighlights].reduce((acc, sq) => {
            acc[sq] = { backgroundColor: 'rgba(235, 97, 80, 0.6)' };
            return acc;
        }, {}),
    };

    // Pieces are not draggable when viewing history, game is over, or click-to-move is on
    const draggable = !isHistory && !isGameOver && !clickToMove;

    // Bomb markers: use displayBombs prop when provided (history/analyze), else live redux state
    const bombs = displayBombs ?? myBombs.map(sq => ({ square: sq, isOpponent: false }));

    // Overlay style: covers the board exactly, pointer-events:none so it doesn't block interaction
    const overlayStyle = { position: 'absolute', inset: 0, pointerEvents: 'none' };

    return (
        <div style={{ position: 'relative' }} onClick={handleClick}>
            <Chessboard
                position={displayFen ?? gameFen}
                animationDuration={animationDuration}
                onPieceDrop={onDrop}
                arePiecesDraggable={draggable}
                {...(gameState === GAME_STATES.placing_bombs ? { onMouseOverSquare: onMouseoverSquare } : {})}
                {...(gameState === GAME_STATES.placing_bombs ? { onMouseOutSquare: onMouseoutSquare } : {})}
                onSquareRightClick={gameState === GAME_STATES.playing ? onSquareRightClick : undefined}
                onSquareClick={
                    gameState === GAME_STATES.playing && !isHistory
                        ? (clickToMove ? handleClickToMove : clearAnnotations)
                        : undefined
                }
                boardOrientation={isWhite ? "white" : "black"}
                arePremovesAllowed={!clickToMove}
                clearPremovesOnRightClick={true}
                customArrows={customArrows}
                customArrowColor={RGBA.iwc_purple}
                customPieces={customPieces}
                boardStyle={{
                    borderRadius: "4px",
                    boxShadow: "0 0 10px #000",
                }}
                customSquareStyles={customSquareStyles}
            />
            {/* Crater overlay — React-rendered, immune to react-chessboard's internal DOM rebuilds */}
            <div style={overlayStyle}>
                {visibleCraters.map(square => (
                    <img
                        key={square}
                        src={images.craterPng}
                        alt=""
                        style={{ ...squareToOverlayStyle(square, isWhite), objectFit: 'contain', opacity: 0.9 }}
                    />
                ))}
            </div>
            {/* Bomb X overlay */}
            <div style={overlayStyle}>
                {bombs.map(({ square, isOpponent }) => (
                    <div
                        key={square}
                        className={isOpponent ? 'enemy-x' : 'red-x'}
                        style={squareToOverlayStyle(square, isWhite)}
                    >
                        X
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChessBoard;
