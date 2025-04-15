# Minesweeper Chess Frontend ♟️💣

A real-time online chess variant where strategy meets surprise through hidden bombs on the board. Click [here](https://github.com/azhang4216/minesweeper-chess-backend) for the backend repo.

## 🎮 Game Description

Minesweeper Chess follows standard chess rules with an explosive twist. Before the game begins, each player secretly places three bombs on their half of the board:
- White places bombs within ranks 3 and 4
- Black places bombs within ranks 5 and 6

If any piece (friend or foe) lands on a square containing a bomb, the bomb detonates, removing both the piece and the bomb from play. Each player can see how many of their bombs remain active through a counter display.

## 🏗️ Tech Stack
- React.js with JavaScript for a responsive single-page application
- Chess UI built with react-chessboard
- Chess logic implemented with chess.js
- Redux toolkit for state management
- Tailwind CSS for styling
- Socket.io client for real-time gameplay

## 💻 Local Development

### Prerequisites
- Node.js (v16+)
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
- [ ] Core UI: name, elo, timer, bomb count
- [ ] Bomb placement
- [ ] Bomb detonation & animation
- [ ] Display captured pieces
- [ ] Foley effects for placing a piece & incorrect movies
- [ ] Collapsable left menu
- [ ] Move history tracking

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request