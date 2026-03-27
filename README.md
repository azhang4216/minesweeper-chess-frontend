# Landmine Chess Frontend ♟️💣

A real-time online chess variant where strategy meets surprise through hidden bombs on the board. Click [here](https://github.com/azhang4216/minesweeper-chess-backend) for the backend repo.

## 🎮 Game Description

Landmine Chess follows standard chess rules with an explosive twist. Before the game begins, each player secretly places three bombs on their half of the board:
- White places bombs within ranks 3 and 4
- Black places bombs within ranks 5 and 6

If any piece (friend or foe) lands on a square containing a bomb, the bomb detonates, removing both the piece and the bomb from play. Each player can see how many of their bombs remain active through a counter display.

## 🏗️ Tech Stack
- React.js for a responsive single-page application
- Chess UI built with react-chessboard
- Chess logic implemented with chess.js
- Redux toolkit for state management
- Custom CSS with design tokens (dark tactical theme)
- React Router DOM for client-side routing
- Socket.io client for real-time gameplay
- Axios for API requests (login, profile, reset password)
- GitHub Actions for CI (tests required on every PR to main)

## 💻 Local Development

### Prerequisites
- Node.js (v >=20)
- Backend server running at `http://localhost:4000`

### Setup
1. Clone this repository
```
git clone https://github.com/azhang4216/minesweeper-chess-frontend.git
cd minesweeper-chess-frontend
```

2. Install dependencies
```
npm install
```

3. Start the frontend
```
npm start
```

4. Visit `http://localhost:3000` to view the application

## 🛣️ Roadmap

- [x] Core chess mechanics
- [x] Core UI: name, elo, timer, bomb count
- [x] Bomb placement and detonation with animation
- [x] Crater overlay persists through move history navigation
- [x] Display captured pieces
- [x] Foley effects for placing a piece and invalid moves
- [x] Move history navigation with clickable SAN history
- [x] Resign and draw offer with confirm modal
- [x] Rematch and new game post-game flow
- [x] Opponent disconnect countdown
- [x] Matchmaking queue with time control selection
- [x] User authentication: creation, login, logout, guest play, password reset
- [x] Navigation sidebar with dark tactical theme
- [x] CI: GitHub Actions runs unit tests on every PR to main
- [x] Profile and search pages with dark tactical theme
- [x] Friends system: send/accept/reject/remove friend requests, post-game Add Friend
- [x] Cinematic detonation overlay: expanding rings, impact flash, board shake, flavor text
- [x] Win/loss/draw popup with meme GIF backgrounds and personality copy

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request