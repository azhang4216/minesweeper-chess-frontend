import React, { useState, useCallback } from 'react';
import Chessboard from 'react-chessboard';
// import { Chess } from 'chess.js';

const MyChessGame = () => {
  return <div></div>
  // // Initialize chess.js game logic
  // const chess = new Chess();
  
  // const [position, setPosition] = useState(chess.fen()); // FEN notation for board position
  // const [gameOver, setGameOver] = useState(false); // Check if the game is over

  // const onPieceDrop = useCallback((sourceSquare, targetSquare) => {
  //   if (gameOver) return; // Do nothing if the game is over

  //   const move = chess.move({
  //     from: sourceSquare,
  //     to: targetSquare,
  //     promotion: 'q', // Automatically promote pawns to queens (you can modify this later)
  //   });

  //   if (move === null) {
  //     console.log("Invalid move!");
  //     return;
  //   }

  //   // Update board position after a valid move
  //   setPosition(chess.fen());

  //   // Check if the game is over (checkmate or stalemate)
  //   if (chess.game_over()) {
  //     setGameOver(true);
  //     console.log("Game Over!");
  //   }
  // }, [chess, gameOver]);

  // const onNewGame = () => {
  //   chess.reset(); // Reset the chess game
  //   setPosition(chess.fen());
  //   setGameOver(false);
  // };

  // return (
  //   <div>
  //     <Chessboard
  //       position={position}
  //       onPieceDrop={onPieceDrop}
  //       customBoardStyle={{
  //         width: '400px',
  //         height: '400px',
  //       }}
  //     />
  //     <button onClick={onNewGame} disabled={gameOver}>
  //       Start New Game
  //     </button>
  //     {gameOver && <div>Game Over! {chess.in_checkmate() ? "Checkmate!" : "Stalemate!"}</div>}
  //   </div>
  // );
};

export default MyChessGame;
