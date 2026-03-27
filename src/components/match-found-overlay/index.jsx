import './style.css';

const MatchFoundOverlay = ({ myName, myRating, opponentName }) => (
    <div className="mfo-overlay">
        <div className="mfo-card">
            <div className="mfo-label">⚡ MATCH FOUND ⚡</div>
            <div className="mfo-players">
                <div className="mfo-player">
                    <div className="mfo-avatar">{myName?.[0]?.toUpperCase()}</div>
                    <div className="mfo-name">{myName}</div>
                    <div className="mfo-rating">{myRating}</div>
                </div>
                <div className="mfo-vs">VS</div>
                <div className="mfo-player">
                    <div className="mfo-avatar mfo-avatar--opponent">{opponentName?.[0]?.toUpperCase()}</div>
                    <div className="mfo-name">{opponentName}</div>
                    <div className="mfo-rating mfo-rating--taunt">They have no idea.</div>
                </div>
            </div>
            <div className="mfo-starting">GAME STARTS IN 3...</div>
        </div>
    </div>
);

export default MatchFoundOverlay;
