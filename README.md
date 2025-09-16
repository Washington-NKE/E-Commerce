# E-Commerce Project


A simple full-stack e-commerce application with a Node.js/Express backend and a modern frontend (Vite + Tailwind CSS).

## .env Example (Backend)
Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
REDIS_URL=your_redis_url
```

Adjust variable names/values as needed for your environment and integrations.

## Features
- User authentication
- Product management
- Cart and order system
- Coupon and payment integration
- Analytics

## Project Structure
```
E-Commerce/
├── backend/      # Node.js/Express API
├── frontend/     # Vite + Tailwind CSS frontend
├── package.json  # Project metadata
├── postman.json  # API collection
```

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn

### Backend Setup
1. Navigate to the backend folder:
   ```sh
   cd backend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Configure environment variables (e.g., `.env` for DB, Stripe, Cloudinary, etc.).
4. Start the backend server:
   ```sh
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend folder:
   ```sh
   cd frontend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the frontend dev server:
   ```sh
   npm run dev
   ```

## API Testing
- Use `postman.json` with Postman to test API endpoints.

## Customization
- Update environment variables and configuration files as needed.
- Add or modify features in the `backend/` and `frontend/` folders.

## License
This project is for educational/demo purposes. Feel free to use, copy, or modify as needed.

---

Made by Washington M. Mwangi
