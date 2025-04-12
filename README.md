# Minesweeper Chess ♟️💣

A real-time online chess variant where strategy meets surprise through hidden bombs on the board.

## 🎮 Game Description

Minesweeper Chess follows standard chess rules with an explosive twist. Before the game begins, each player secretly places three bombs on their half of the board:
- White places bombs within ranks 3 and 4
- Black places bombs within ranks 5 and 6

If any piece (friend or foe) lands on a square containing a bomb, the bomb detonates, removing both the piece and the bomb from play. Each player can see how many of their bombs remain active through a counter display.

## 🏗️ System Architecture

### Frontend
- React.js with TypeScript for a responsive single-page application
- Chess UI built with react-chessboard
- Redux for state management
- Tailwind CSS for styling
- Socket.io client for real-time gameplay

### Backend
- Node.js with Express for API endpoints
- Socket.io for real-time game state updates
- JWT for authentication and session management

### Database
- PostgreSQL for user accounts, game history, and rankings
- Redis for real-time game states and matchmaking queue

### Infrastructure
- Docker containers for consistent deployment
- AWS ECS for hosting
- AWS RDS for PostgreSQL database
- ElastiCache for Redis instance
- CloudFront for static content delivery

## 🔧 Technical Features

### Authentication System
- Email/password registration and login
- JWT token-based session management
- Password reset functionality
- Optional OAuth integration (Google, Facebook, etc.)

### Game Engine
- Chess rule validation with custom bomb mechanics
- Real-time move synchronization between players
- Bomb placement and detonation logic
- Game state persistence

### User Features
- Player profiles with statistics
- ELO rating system
- Game history and replay functionality
- Matchmaking system

## 💻 Local Development

### Prerequisites
- Node.js (v16+)
- Docker and Docker Compose
- PostgreSQL (optional if using Docker)
- Redis (optional if using Docker)

### Setup
1. Clone this repository
```
git clone https://github.com/yourusername/bomb-chess.git
cd bomb-chess
```

2. Install dependencies
```
npm install
```

3. Start the development environment
```
docker-compose up -d
npm run dev
```

4. Visit `http://localhost:3000` to view the application

### Environment Variables
Create a `.env` file in the root directory with the following variables:
```
# Server
PORT=8080
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bombchess
DB_USER=postgres
DB_PASSWORD=yourpassword

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRY=24h
```

## 🚀 Deployment

### Production Build
```
npm run build
```

### Docker Deployment
```
docker build -t bomb-chess .
docker run -p 8080:8080 bomb-chess
```

### AWS Deployment
1. Push Docker image to ECR
2. Configure ECS Task Definition
3. Deploy to ECS Cluster
4. Set up RDS and ElastiCache
5. Configure CloudFront distribution

## 📈 Scaling Considerations

- Horizontal scaling through multiple game server instances
- Database connection pooling for increased throughput
- Redis caching for frequently accessed data
- WebSocket connection management across multiple instances

## 🔗 API Documentation

API documentation is available at `/api/docs` when running the server.

## 🛣️ Roadmap

- [x] Core chess mechanics
- [ ] Bomb placement and detonation
- [ ] User authentication
- [ ] Matchmaking system
- [ ] Rating system
- [ ] Game replay functionality
- [ ] Mobile responsive design
- [ ] Tournament support

## 🧪 Testing

```
npm test
```

Tests include:
- Unit tests for game logic
- Integration tests for API endpoints
- E2E tests for critical user flows

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request