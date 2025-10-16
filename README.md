# ATM Simulator Application

A full-stack ATM simulator application built with React (frontend) and Node.js/Express (backend) with MySQL database.

## Features

- 🔐 **Authentication**: Card validation and PIN verification
- 💰 **Transactions**: Withdraw, deposit, and transfer money
- 📊 **Balance Inquiry**: Check account balance
- 🔑 **PIN Management**: Change PIN with OTP verification
- 📄 **Mini Statement**: View transaction history
- 🌐 **Multi-language Support**: English, Hindi, Telugu
- 🧾 **Receipt Generation**: PDF receipts for transactions

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed

### 1. Clone and Setup
```bash
git clone <repository-url>
cd ATM_Simulator_Application
```

### 2. Run with Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Database**: localhost:3306

### 4. Test Credentials
- **Card Number**: 4111111111111111
- **PIN**: 1234

## Manual Setup (Development)

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Database Setup
1. Install MySQL 8.0
2. Create database: `atm_simulator`
3. Run schema and seed files from `backend/src/config/`

## Running Tests

### Backend Tests
```bash
cd backend
npm test
```

### Expected Output
```
✅ All 10 tests passed successfully!
```

## Docker Services

The application consists of three Docker services:

1. **atm-db**: MySQL 8.0 database
2. **atm-backend**: Node.js/Express API server
3. **atm-frontend**: React app served by nginx

## API Endpoints

### Authentication
- `POST /api/auth/card/validate` - Validate card number
- `POST /api/auth/pin/verify` - Verify PIN
- `POST /api/auth/token/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout

### Transactions
- `GET /api/tx/balance` - Get account balance
- `POST /api/tx/withdraw` - Withdraw money
- `POST /api/tx/deposit` - Deposit money
- `POST /api/tx/transfer` - Transfer money

### PIN Management
- `POST /api/pin/request-otp` - Request OTP for PIN change
- `POST /api/pin/change` - Change PIN

### Mini Statement
- `GET /api/mini/` - Get transaction history
- `GET /api/mini/pdf` - Download mini statement PDF

## Environment Variables

### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=atm_simulator
DB_USER=atm_user
DB_PASSWORD=atm_password
JWT_SECRET=your-super-secret-jwt-key
REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=90s
REFRESH_EXPIRES_IN=7d
NODE_ENV=development
PORT=4000
```

## Project Structure

```
ATM_Simulator_Application/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Authentication, validation
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utilities
│   │   └── __tests__/       # Unit tests
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   └── styles/          # CSS styles
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Health Checks

All services include health checks:
- Backend: `GET /health`
- Frontend: `GET /health`
- Database: MySQL ping

## Security Features

- JWT-based authentication
- Rate limiting
- Input validation
- SQL injection prevention
- CORS configuration
- Security headers
- Non-root Docker users

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Ensure MySQL container is running: `docker-compose ps`
   - Check database logs: `docker-compose logs atm-db`

2. **Frontend Not Loading**
   - Check if backend is running: `docker-compose logs atm-backend`
   - Verify nginx configuration

3. **Tests Failing**
   - Ensure all dependencies are installed
   - Check Jest configuration

### Useful Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Remove volumes (clean database)
docker-compose down -v

# Rebuild specific service
docker-compose up --build atm-backend
```

## License

This project is for educational purposes.
