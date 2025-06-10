# Quiz App

A full-stack quiz application built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Project Structure

- `client/` - Frontend React application (runs on http://localhost:3000)
- `server/` - Backend Node.js/Express server (runs on http://localhost:5000)

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- MongoDB (local or MongoDB Atlas)

## Local Development Setup

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the server directory with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/quizapp
   JWT_SECRET=your_jwt_secret
   PORT=5000
   NODE_ENV=development
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   The server will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the client directory with:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```
4. Start the development server:
   ```bash
   npm start
   ```
   The application will automatically open in your browser at `http://localhost:3000`

## Running the Application

1. Make sure MongoDB is running locally
2. Start the backend server (from the server directory):
   ```bash
   npm run dev
   ```
3. In a new terminal, start the frontend (from the client directory):
   ```bash
   npm start
   ```
4. Access the application at `http://localhost:3000`

## Database Setup

### Local MongoDB
1. Install MongoDB Community Edition from [MongoDB's website](https://www.mongodb.com/try/download/community)
2. Start MongoDB service
3. Create a database named `quizapp`

### MongoDB Atlas (Alternative)
If you prefer using MongoDB Atlas:
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Add your IP to the IP whitelist
5. Update the `MONGODB_URI` in the server's `.env` file with your connection string

## Environment Variables

### Backend (server/.env)
```
MONGODB_URI=mongodb://localhost:27017/quizapp
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
```

### Frontend (client/.env)
```
REACT_APP_API_URL=http://localhost:5000
```
