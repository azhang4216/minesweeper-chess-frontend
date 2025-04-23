import React from "react";
import './style.css';
import { getGameOverAsset, getEloChangeColor } from "../../utils";

// hooks
import {
    usePlayer,
    useOpponent
} from '../../hooks';

const WinLossPopup = ({ result, reason, myEloChange, opponentEloChange, onClose }) => {
    const player = usePlayer();
    const opponent = useOpponent();

    return (
        <div className="popup-overlay">
            <div className="popup-content">
                <button className="close-button" onClick={onClose}>
                    &times;
                </button>
                <img src={getGameOverAsset(result)} alt="Result Media" className="result-media" />
                <div className="result-text">
                    <h2>{`${result} by ${reason}`}</h2>
                    <div className="elo-info">
                        <p>
                            Your New Elo:{" "}
                            <span>{player.rating + myEloChange}</span>{" "}
                            <span style={{ color: getEloChangeColor(myEloChange) }}>
                                ({myEloChange < 0 ? "" : "+"}
                                {myEloChange})
                            </span>
                        </p>
                        <p>
                            Opponent's New Elo:{" "}
                            <span>{opponent.rating + opponentEloChange}</span>{" "}
                            <span style={{ color: getEloChangeColor(opponentEloChange) }}>
                                ({opponentEloChange < 0 ? "" : "+"}
                                {opponentEloChange})
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WinLossPopup;