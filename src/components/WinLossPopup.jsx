import React from "react";
import { useSelector } from "react-redux";
import './WinLossPopup.css';
import sadHamster from "../assets/sad-hamster.gif";
import happyCat from "../assets/happy-cat.gif";
import officeHandshakeMeme from "../assets/office-handshake-meme.png";

const WinLossPopup = ({ result, reason, myEloChange, opponentEloChange, onClose }) => {
    const player = useSelector((state) => state.player);
    const opponent = useSelector((state) => state.opponent);

    const getGameOverAsset = () => {
        if (result === "You win") return happyCat;
        if (result === "You lose") return sadHamster;
        return officeHandshakeMeme;
    };

    const getEloChangeColor = (change) => {
        if (change > 0) return "green";
        if (change < 0) return "red";
        return "gray";
    };

    return (
        <div className="popup-overlay">
            <div className="popup-content">
                <button className="close-button" onClick={onClose}>
                    &times;
                </button>
                <img src={getGameOverAsset()} alt="Result Media" className="result-media" />
                <div className="result-text">
                    <h2>{`${result} by ${reason}`}</h2>
                    <div className="elo-info">
                        <p>
                            Your New Elo:{" "}
                            <span>{player.rating + myEloChange}</span>{" "}
                            <span style={{ color: getEloChangeColor(myEloChange) }}>
                                ({myEloChange > 0 ? "+" : ""}
                                {myEloChange})
                            </span>
                        </p>
                        <p>
                            Opponent's New Elo:{" "}
                            <span>{opponent.rating + opponentEloChange}</span>{" "}
                            <span style={{ color: getEloChangeColor(opponentEloChange) }}>
                                ({opponentEloChange > 0 ? "+" : ""}
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