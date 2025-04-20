import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const SidePanel = () => {
    const moveHistory = useSelector((state) => state.moveHistory);
    const placingBombs = useSelector((state) => state.placingBombs);
    const isWhite = useSelector((state) => state.isWhite);
    const myBombs = useSelector((state) => state.player.bombs);

    return (
        <div className="side-panel">
            {(placingBombs) ?
                <div className="bomb-placement-info">
                    <h3>
                        {
                            (myBombs.length < 3) ?
                                `Plant your ${3 - myBombs.length} bombs!` : 
                                "Waiting for your opponent to finish planting bombs..."
                        }
                    </h3>
                    <p>
                        As the {isWhite ? "white" : "black"} player, you can place bombs only on the {isWhite ? "3rd & 4th" : "5th & 6th"} ranks.
                        <br/>
                        <br/>
                        Your opponent can't see them, but you can (marked with a red X).
                        <br/>
                        <br/>
                        Any piece that steps on a bomb is destroyed, and the bomb is removed.
                    </p>
                </div>
                :
                <div className="move-history">
                    <h3>Moves</h3>
                    {moveHistory.map((move, i) => (
                        <div key={i}>
                            {String.fromCharCode(97 + move.from.col)}{8 - move.from.row} →{' '}
                            {String.fromCharCode(97 + move.to.col)}{8 - move.to.row}
                            {move.bombDetonated && ' 💣'}
                        </div>
                    ))}
                </div>}
        </div>
    );
};

export default SidePanel;