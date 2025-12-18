# Dhon - Setup Guide

This guide will walk you through setting up the Dhon Car Management Platform on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** package manager
- **Git** (optional, for cloning)

## Quick Start

### 1. Clone or Download the Repository

```bash
git clone https://github.com/kopotrahman/dhon.git
cd dhon
```

### 2. Install All Dependencies

From the root directory, you can install all dependencies for both backend and frontend:

```bash
npm run install-all
```

Or install them separately:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Setup MongoDB

Make sure MongoDB is running on your system:

```bash
# For macOS (using Homebrew)
brew services start mongodb-community

# For Linux
sudo systemctl start mongod

# For Windows
# Start MongoDB service from Services application
# Or run: net start MongoDB
```

### 4. Configure Backend Environment

1. Navigate to the backend directory:
```bash
cd backend
```

2. Copy the example environment file:
```bash
cp .env.example .env
```

3. Edit `.env` file with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (Update if using a different MongoDB setup)
MONGODB_URI=mongodb://localhost:27017/dhon

# JWT Secret (Generate a secure random string)
JWT_SECRET=your_super_secret_jwt_key_here_change_this
JWT_EXPIRE=7d

# OAuth2 (Optional - for Google login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Payment Gateways (Optional - for production)
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
STRIPE_SECRET_KEY=your_stripe_secret_key
BKASH_APP_KEY=your_bkash_app_key
BKASH_APP_SECRET=your_bkash_app_secret

# Email Configuration (Optional - for email notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password

# SMS Configuration (Optional)
SMS_API_KEY=your_sms_api_key

# Google Maps API (Optional - for location features)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Firebase (Optional - for push notifications)
FIREBASE_SERVER_KEY=your_firebase_server_key

# Client URL
CLIENT_URL=http://localhost:3000
```

**Important Notes:**
- Replace `JWT_SECRET` with a strong, random string
- For development, the MongoDB URI can remain as `mongodb://localhost:27017/dhon`
- Payment gateway and API configurations are optional for development

### 5. Configure Frontend Environment

1. Navigate to the frontend directory:
```bash
cd ../frontend
```

2. Copy the example environment file:
```bash
cp .env.example .env
```

3. Edit `.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 6. Start the Application

You need to run both backend and frontend servers:

#### Terminal 1 - Backend Server

```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:5000`

#### Terminal 2 - Frontend Server

```bash
cd frontend
npm start
```

The frontend will start on `http://localhost:3000` and automatically open in your browser.

## Testing the Application

### 1. Register a New User

1. Open your browser and go to `http://localhost:3000`
2. You'll be redirected to the login page
3. Click "Register here" link
4. Fill in the registration form:
   - Choose "Car Owner" or "Driver" as role
   - Provide name, email, phone, and password
   - Fill in location details
5. Click "Register"

### 2. Explore the Dashboard

After registration, you'll be taken to the dashboard where you can:
- View your profile
- Access role-specific features
- Explore different sections (Jobs, Cars, Marketplace, etc.)

### 3. Test Admin Features

To test admin features, you'll need to create an admin account:

1. Register a new user with role "admin" (you may need to temporarily allow this in the registration form)
2. Or manually create an admin user in MongoDB:

```javascript
// Connect to MongoDB
use dhon

// Update an existing user to admin
db.users.updateOne(
  { email: "your_email@example.com" },
  { 
    $set: { 
      role: "admin",
      isApproved: true 
    } 
  }
)
```

## Common Issues and Solutions

### Issue: MongoDB Connection Error

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:**
- Ensure MongoDB is running: `sudo systemctl status mongod` (Linux) or `brew services list` (macOS)
- Check if MongoDB URI in `.env` is correct
- Try connecting to MongoDB directly: `mongosh` or `mongo`

### Issue: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
- Kill the process using the port:
  ```bash
  # Find the process
  lsof -i :5000  # macOS/Linux
  netstat -ano | findstr :5000  # Windows
  
  # Kill the process
  kill -9 <PID>  # macOS/Linux
  taskkill /PID <PID> /F  # Windows
  ```
- Or change the PORT in backend `.env` file

### Issue: Module Not Found

**Error:** `Cannot find module 'xyz'`

**Solution:**
- Delete `node_modules` and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### Issue: CORS Error in Browser

**Error:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution:**
- Ensure backend is running
- Check that `CLIENT_URL` in backend `.env` matches frontend URL
- Clear browser cache and restart both servers

## Development Tips

### Hot Reloading

- Backend uses `nodemon` for automatic restart on file changes
- Frontend uses React's built-in hot reloading
- Make sure to save files to see changes

### Debugging

- Backend logs appear in the terminal where you ran `npm run dev`
- Frontend console errors appear in browser DevTools (F12)
- Use `console.log()` for debugging

### Database Management

View your data using:
- MongoDB Compass (GUI): [Download](https://www.mongodb.com/products/compass)
- MongoDB Shell: `mongosh` or `mongo`

```bash
# Connect to your database
mongosh
use dhon
db.users.find()  # View all users
db.cars.find()   # View all cars
```

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in backend `.env`
2. Use production MongoDB URI (e.g., MongoDB Atlas)
3. Configure real payment gateways
4. Setup SSL certificates
5. Use a process manager like PM2 for the backend
6. Build frontend: `npm run build`
7. Serve frontend with Nginx or similar

Detailed deployment guide coming soon!

## Need Help?

If you encounter any issues:

1. Check this setup guide thoroughly
2. Review error messages carefully
3. Check the main README.md for additional information
4. Open an issue on GitHub with:
   - Detailed description of the problem
   - Error messages
   - Steps to reproduce
   - Your environment (OS, Node version, etc.)

## Next Steps

After successful setup:

1. Explore all features in the dashboard
2. Test job posting and applications
3. Try creating car listings
4. Test the booking system
5. Explore the marketplace
6. Try the community forum
7. Test admin features if you have admin access

Happy coding! 🚗💨
