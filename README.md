# Dhon - Comprehensive Car Management Platform

A full-stack MERN (MongoDB, Express.js, React, Node.js) application for car management, driver hiring, bookings, marketplace, and community features.

## Features

### 🧍‍♂️ User Management
- **User Roles**: Owner, Driver, Admin
- **Secure Authentication**: JWT-based authentication
- **Profile Management**: Photo, license info, address, KYC details
- **KYC Verification**: Document and ID verification for drivers
- **Admin Approval**: Drivers/owners require approval before accessing services

### 🚘 Driver Hiring & Job System
- **Job Posting**: Owners can post job listings with location, salary, car model
- **Application System**: Drivers can apply through their dashboard
- **Application Status Tracking**: Pending, accepted, rejected statuses
- **Interview Scheduling**: Optional interview setup
- **Contract Signing**: E-sign system for hire confirmation

### 📅 Booking & Rate System
- **Calendar-Based Booking**: Intuitive scheduling interface
- **Hourly/Daily Rates**: Flexible payment options
- **Conflict Detection**: Prevents double booking
- **Rate Negotiation**: Chat-based system for pricing

### 📄 Document & Car Management
- **Document Upload**: RC, insurance, license, etc.
- **Expiry Tracking**: Auto reminders for expiring documents
- **Admin Verification**: Document approval system
- **Car Profiles**: Display specs, photos, availability

### 🛒 Marketplace & Cart
- **Product Catalog**: Car parts, tools, and accessories
- **Cart Management**: Add, remove, edit items
- **Order Processing**: Billing and invoice generation
- **Order History**: Track previous orders

### 🚗 Car Sales & Rentals
- **Car Listings**: Price, model, images, mileage, year
- **Search & Filter**: Brand, fuel type, transmission filters
- **Car Rentals**: Calendar-based scheduling
- **Deposit & Insurance**: Security verification for rentals

### 💳 Payment & Billing
- **Payment Gateways**: SSLCommerz, Stripe, bKash, Nagad
- **Invoice System**: Auto-generated PDF invoices
- **Transaction History**: Payment tracking
- **Refunds**: Full refund workflow

### ⭐ Review, Rating & Feedback
- **Rating System**: Star ratings for drivers, sellers, products
- **Feedback**: Text-based reviews from verified users
- **Moderation**: Admin filtering of inappropriate content

### 🗺️ Service Center & GPS Integration
- **Map View**: Display nearby service centers
- **Service Booking**: Schedule maintenance/repair slots
- **GPS Tracking**: Real-time tracking for rented cars
- **Maintenance Alerts**: Automatic service reminders

### 🧠 Admin Panel
- **User Management**: Manage users, roles, permissions
- **Moderation Tools**: Approve/reject content
- **Analytics Dashboard**: Revenue, users, bookings metrics
- **Notifications**: Push and email notifications
- **Reports**: Handle complaints and flags

### 💬 Community Forum
- **Social Feed**: Post, comment, like functionality
- **Tag Filters**: Browse by tags (repair, experience, etc.)
- **Moderation Tools**: Content management
- **Public/Private Posts**: Visibility control

### 🔔 Notifications
- **Multi-Channel**: SMS, Email, In-App alerts
- **Use Cases**: Booking updates, job replies, document expiry
- **Push Notifications**: Firebase integration

### 🧾 Communication & Support
- **In-App Chat**: Real-time messaging with Socket.io
- **FAQ Section**: Common questions
- **Ticket System**: Support request tracking

### 🌙 Other Features
- **Dark Mode**: Theme toggle
- **Accessibility**: Keyboard and screen-reader support
- **Responsive UI**: Mobile-optimized

## Tech Stack

### Backend
- **Node.js & Express.js**: Server framework
- **MongoDB & Mongoose**: Database and ODM
- **JWT**: Authentication
- **Bcrypt**: Password hashing
- **Socket.io**: Real-time communication
- **Multer**: File uploads
- **Nodemailer**: Email notifications

### Frontend
- **React**: UI library
- **React Router**: Navigation
- **Axios**: HTTP client
- **Socket.io Client**: Real-time features
- **CSS3**: Styling

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
- MongoDB URI
- JWT secret
- Payment gateway credentials
- Email configuration
- API keys

5. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with backend URL:
```
REACT_APP_API_URL=http://localhost:5000/api
```

5. Start the development server:
```bash
npm start
```

Frontend will run on `http://localhost:3000`

## Project Structure

```
dhon/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── kycController.js
│   │   │   ├── jobController.js
│   │   │   ├── carController.js
│   │   │   └── bookingController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── upload.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Job.js
│   │   │   ├── JobApplication.js
│   │   │   ├── Car.js
│   │   │   ├── Booking.js
│   │   │   ├── Product.js
│   │   │   ├── Order.js
│   │   │   ├── Payment.js
│   │   │   ├── Review.js
│   │   │   ├── ServiceCenter.js
│   │   │   ├── ServiceBooking.js
│   │   │   ├── ForumPost.js
│   │   │   ├── Notification.js
│   │   │   ├── Message.js
│   │   │   └── SupportTicket.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── kycRoutes.js
│   │   │   ├── jobRoutes.js
│   │   │   ├── carRoutes.js
│   │   │   └── bookingRoutes.js
│   │   ├── utils/
│   │   │   └── jwtUtils.js
│   │   └── server.js
│   ├── uploads/
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── Login.js
│   │   │   │   ├── Register.js
│   │   │   │   └── Auth.css
│   │   │   ├── dashboard/
│   │   │   │   ├── Dashboard.js
│   │   │   │   └── Dashboard.css
│   │   │   ├── jobs/
│   │   │   ├── cars/
│   │   │   ├── bookings/
│   │   │   ├── marketplace/
│   │   │   ├── admin/
│   │   │   ├── forum/
│   │   │   └── common/
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── .env.example
│   └── package.json
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### KYC
- `POST /api/kyc/upload` - Upload KYC documents
- `POST /api/kyc/verify/:userId` - Verify KYC (Admin)
- `POST /api/kyc/approve/:userId` - Approve user (Admin)
- `GET /api/kyc/pending` - Get pending approvals (Admin)

### Jobs
- `POST /api/jobs` - Create job posting (Owner)
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `PUT /api/jobs/:id` - Update job (Owner)
- `DELETE /api/jobs/:id` - Delete job (Owner)
- `POST /api/jobs/apply` - Apply for job (Driver)
- `GET /api/jobs/applications/my` - Get my applications (Driver)
- `PUT /api/jobs/applications/:applicationId` - Update application status (Owner)

### Cars
- `POST /api/cars` - Create car listing
- `GET /api/cars` - Get all cars
- `GET /api/cars/:id` - Get car by ID
- `PUT /api/cars/:id` - Update car
- `DELETE /api/cars/:id` - Delete car
- `POST /api/cars/:carId/documents` - Upload car document
- `POST /api/cars/:carId/documents/:documentId/verify` - Verify document (Admin)
- `POST /api/cars/:id/approve` - Approve car (Admin)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id/status` - Update booking status
- `PUT /api/bookings/:id/cancel` - Cancel booking

## Default User Roles

1. **Admin**: Full access to all features
2. **Owner**: Can post jobs, manage cars, view applications
3. **Driver**: Can browse and apply for jobs, manage profile

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- File upload validation
- Input validation with express-validator
- Protected routes and endpoints

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, email support@dhon.com or open an issue in the repository.