import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Chess } from 'chess.js';
import './style.css';

import Chessboard from '../chessboard';
import { actions } from '../../redux';
import { getGameById } from '../../api/profile';
import { getFenAtIndex } from '../../utils';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const parsePgn = (pgn) => {
    const chess = new Chess();
    try {
        chess.loadPgn(pgn);
        return chess.history();
    } catch (_) {
        return [];
    }
};

const playerName = (player) => player.is_guest ? 'Guest Player' : player.player_id;

const GameViewPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();

    const [game, setGame] = useState(null);
    const [moves, setMoves] = useState([]);
    const [viewIndex, setViewIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const moveListEndRef = useRef(null);

    useEffect(() => {
        dispatch(actions.resetGame());
        dispatch(actions.setOrientation(true)); // white at bottom by default

        getGameById(id)
            .then((data) => {
                setGame(data);
                setMoves(parsePgn(data.game_pgn));
                setLoading(false);
            })
            .catch(() => {
                setError('Game not found.');
                setLoading(false);
            });
    }, [id, dispatch]);

    useEffect(() => {
        if (viewIndex >= moves.length) {
            moveListEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [moves, viewIndex]);

    if (loading) return <div className="game-view-loading">Loading game...</div>;
    if (error) return <div className="game-view-error">{error}</div>;

    const displayFen = getFenAtIndex(STARTING_FEN, moves, viewIndex);

    // Board is always shown from white's perspective. White's bombs sit on ranks 3-4,
    // black's on 5-6. Show all bombs persistently (no explosion timing in the DB record).
    const displayBombs = (game.bombs || []).map(sq => ({
        square: sq,
        isOpponent: sq[1] === '5' || sq[1] === '6',
    }));

    const goToStart = () => setViewIndex(0);
    const goBack = () => setViewIndex(v => Math.max(0, v - 1));
    const goForward = () => setViewIndex(v => Math.min(moves.length, v + 1));
    const goToLatest = () => setViewIndex(moves.length);

    const white = game.white_player;
    const black = game.black_player;

    const resultLabel = {
        WHITE_WINS: 'White wins',
        BLACK_WINS: 'Black wins',
        DRAW: 'Draw',
    }[game.result] ?? game.result;

    return (
        <div className="game-view-container">
            <div className="game-view-content">
                <div className="chess-wrapper">
                    <div className="player-info top">
                        <span className="player-name">{playerName(black)}</span>
                        <span className="player-rating">
                            {black.elo_before_game_start}
                            {black.elo_change != null && (
                                <span style={{ color: black.elo_change >= 0 ? '#4ade80' : '#f87171', marginLeft: 4 }}>
                                    {black.elo_change >= 0 ? '+' : ''}{black.elo_change}
                                </span>
                            )}
                        </span>
                    </div>
                    <div className="chess-board-container">
                        <Chessboard displayFen={displayFen} displayBombs={displayBombs} />
                    </div>
                    <div className="player-info bottom">
                        <span className="player-name">{playerName(white)}</span>
                        <span className="player-rating">
                            {white.elo_before_game_start}
                            {white.elo_change != null && (
                                <span style={{ color: white.elo_change >= 0 ? '#4ade80' : '#f87171', marginLeft: 4 }}>
                                    {white.elo_change >= 0 ? '+' : ''}{white.elo_change}
                                </span>
                            )}
                        </span>
                    </div>
                </div>

                <div className="side-panel">
                    <div className="game-result-banner">
                        <span className="result-text">{resultLabel}</span>
                        <span className="result-by">by {game.result_by.replace(/_/g, ' ').toLowerCase()}</span>
                    </div>

                    <div className="move-history-header">
                        <span className="moves-label">Moves</span>
                        <div className="nav-controls">
                            <button className="nav-btn" onClick={goToStart} title="Start">⏮</button>
                            <button className="nav-btn" onClick={goBack} title="Previous">◀</button>
                            <button className="nav-btn" onClick={goForward} title="Next">▶</button>
                            <button className="nav-btn" onClick={goToLatest} title="Latest">⏭</button>
                        </div>
                    </div>

                    <div className="move-history-table">
                        {Array.from({ length: Math.ceil(moves.length / 2) }).map((_, idx) => {
                            const whiteMoveIdx = 2 * idx + 1;
                            const blackMoveIdx = 2 * idx + 2;
                            return (
                                <div className="move-history-row" key={idx}>
                                    <div className="move-turn">{idx + 1}.</div>
                                    <div
                                        className={`move-white${viewIndex === whiteMoveIdx ? ' move-active' : ''}`}
                                        onClick={() => setViewIndex(whiteMoveIdx)}
                                    >
                                        {moves[2 * idx] || ''}
                                    </div>
                                    <div
                                        className={`move-black${viewIndex === blackMoveIdx ? ' move-active' : ''}`}
                                        onClick={() => moves[2 * idx + 1] && setViewIndex(blackMoveIdx)}
                                    >
                                        {moves[2 * idx + 1] || ''}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={moveListEndRef} />
                    </div>

                    <div className="game-view-meta">
                        <span>{new Date(game.date).toLocaleDateString()}</span>
                        <span>{game.time_control}</span>
                    </div>

                    <Link to="/" className="game-view-back">← Back</Link>
                </div>
            </div>
        </div>
    );
};

export default GameViewPage;
