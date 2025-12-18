# Dhon API Documentation

Base URL: `http://localhost:5000/api`

## Table of Contents
1. [Authentication](#authentication)
2. [KYC Management](#kyc-management)
3. [Job Management](#job-management)
4. [Car Management](#car-management)
5. [Booking Management](#booking-management)
6. [Common Response Formats](#common-response-formats)

---

## Authentication

### Register User
Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "owner",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "Dhaka",
    "state": "Dhaka Division",
    "zipCode": "1000",
    "country": "Bangladesh"
  }
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "owner",
    "isApproved": false
  }
}
```

### Login User
Authenticate and get access token.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "owner",
    "isApproved": true,
    "kyc": {
      "isVerified": false,
      "documents": []
    }
  }
}
```

### Get User Profile
Get current user's profile.

**Endpoint:** `GET /auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "60d5ec49f1b2c72b8c8e4f1a",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "owner",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "Dhaka",
    "state": "Dhaka Division",
    "zipCode": "1000",
    "country": "Bangladesh"
  },
  "isApproved": true,
  "kyc": {
    "isVerified": false,
    "documents": []
  },
  "createdAt": "2024-06-25T10:30:00.000Z"
}
```

### Update User Profile
Update current user's profile.

**Endpoint:** `PUT /auth/profile`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
name: "John Smith"
phone: "+1234567891"
profilePhoto: <file>
address[street]: "456 Oak Ave"
address[city]: "Dhaka"
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+1234567891",
    "profilePhoto": "uploads/profilePhoto-123456789.jpg"
  }
}
```

---

## KYC Management

### Upload KYC Document
Upload KYC verification documents.

**Endpoint:** `POST /kyc/upload`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
type: "id_proof" | "address_proof" | "license"
document: <file>
```

**Response (200):**
```json
{
  "message": "Document uploaded successfully",
  "kyc": {
    "isVerified": false,
    "documents": [
      {
        "type": "id_proof",
        "documentUrl": "uploads/document-123456789.pdf",
        "uploadedAt": "2024-06-25T10:30:00.000Z",
        "_id": "60d5ec49f1b2c72b8c8e4f1b"
      }
    ]
  }
}
```

### Verify KYC (Admin Only)
Verify a user's KYC documents.

**Endpoint:** `POST /kyc/verify/:userId`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "message": "KYC verified successfully",
  "kyc": {
    "isVerified": true,
    "verifiedAt": "2024-06-25T11:00:00.000Z",
    "verifiedBy": "60d5ec49f1b2c72b8c8e4f1c"
  }
}
```

### Approve User (Admin Only)
Approve a user account.

**Endpoint:** `POST /kyc/approve/:userId`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "message": "User approved successfully",
  "user": {
    "isApproved": true,
    "approvedAt": "2024-06-25T11:00:00.000Z",
    "approvedBy": "60d5ec49f1b2c72b8c8e4f1c"
  }
}
```

### Get Pending Approvals (Admin Only)
Get all users pending approval.

**Endpoint:** `GET /kyc/pending`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
[
  {
    "_id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "driver",
    "isApproved": false,
    "kyc": {
      "isVerified": true
    },
    "createdAt": "2024-06-25T10:30:00.000Z"
  }
]
```

---

## Job Management

### Create Job (Owner Only)
Post a new job listing.

**Endpoint:** `POST /jobs`

**Headers:**
```
Authorization: Bearer <owner-token>
```

**Request Body:**
```json
{
  "title": "Personal Driver Needed",
  "description": "Looking for an experienced driver for personal use",
  "location": {
    "address": "Gulshan, Dhaka",
    "city": "Dhaka",
    "state": "Dhaka Division",
    "coordinates": {
      "lat": 23.7808875,
      "lng": 90.4201466
    }
  },
  "salary": {
    "amount": 25000,
    "period": "monthly"
  },
  "carModel": "Toyota Corolla",
  "requirements": [
    "Valid driving license",
    "5+ years experience",
    "Knowledge of Dhaka routes"
  ],
  "startDate": "2024-07-01T00:00:00.000Z"
}
```

**Response (201):**
```json
{
  "message": "Job posted successfully",
  "job": {
    "_id": "60d5ec49f1b2c72b8c8e4f1d",
    "owner": "60d5ec49f1b2c72b8c8e4f1a",
    "title": "Personal Driver Needed",
    "description": "Looking for an experienced driver for personal use",
    "location": {
      "address": "Gulshan, Dhaka",
      "city": "Dhaka",
      "state": "Dhaka Division",
      "coordinates": {
        "lat": 23.7808875,
        "lng": 90.4201466
      }
    },
    "salary": {
      "amount": 25000,
      "period": "monthly"
    },
    "carModel": "Toyota Corolla",
    "status": "open",
    "applications": [],
    "createdAt": "2024-06-25T11:00:00.000Z"
  }
}
```

### Get All Jobs
Browse all job listings.

**Endpoint:** `GET /jobs`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): "open" | "closed" | "filled"
- `location` (optional): City name
- `carModel` (optional): Car model to filter

**Example:** `GET /jobs?status=open&location=Dhaka`

**Response (200):**
```json
[
  {
    "_id": "60d5ec49f1b2c72b8c8e4f1d",
    "owner": {
      "_id": "60d5ec49f1b2c72b8c8e4f1a",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "title": "Personal Driver Needed",
    "location": {
      "city": "Dhaka"
    },
    "salary": {
      "amount": 25000,
      "period": "monthly"
    },
    "status": "open",
    "createdAt": "2024-06-25T11:00:00.000Z"
  }
]
```

### Get Job By ID
Get detailed information about a specific job.

**Endpoint:** `GET /jobs/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "60d5ec49f1b2c72b8c8e4f1d",
  "owner": {
    "_id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "title": "Personal Driver Needed",
  "description": "Looking for an experienced driver for personal use",
  "location": {
    "address": "Gulshan, Dhaka",
    "city": "Dhaka",
    "coordinates": {
      "lat": 23.7808875,
      "lng": 90.4201466
    }
  },
  "salary": {
    "amount": 25000,
    "period": "monthly"
  },
  "carModel": "Toyota Corolla",
  "requirements": [
    "Valid driving license",
    "5+ years experience"
  ],
  "status": "open",
  "applications": [],
  "createdAt": "2024-06-25T11:00:00.000Z"
}
```

### Apply for Job (Driver Only)
Submit an application for a job.

**Endpoint:** `POST /jobs/apply`

**Headers:**
```
Authorization: Bearer <driver-token>
```

**Request Body:**
```json
{
  "jobId": "60d5ec49f1b2c72b8c8e4f1d",
  "coverLetter": "I am an experienced driver with 7 years of experience..."
}
```

**Response (201):**
```json
{
  "message": "Application submitted successfully",
  "application": {
    "_id": "60d5ec49f1b2c72b8c8e4f1e",
    "job": "60d5ec49f1b2c72b8c8e4f1d",
    "driver": "60d5ec49f1b2c72b8c8e4f1b",
    "coverLetter": "I am an experienced driver with 7 years of experience...",
    "status": "pending",
    "appliedAt": "2024-06-25T12:00:00.000Z"
  }
}
```

### Get My Applications (Driver Only)
Get all applications submitted by the driver.

**Endpoint:** `GET /jobs/applications/my`

**Headers:**
```
Authorization: Bearer <driver-token>
```

**Response (200):**
```json
[
  {
    "_id": "60d5ec49f1b2c72b8c8e4f1e",
    "job": {
      "_id": "60d5ec49f1b2c72b8c8e4f1d",
      "title": "Personal Driver Needed",
      "location": {
        "city": "Dhaka"
      }
    },
    "status": "pending",
    "appliedAt": "2024-06-25T12:00:00.000Z"
  }
]
```

### Update Application Status (Owner Only)
Update the status of an application.

**Endpoint:** `PUT /jobs/applications/:applicationId`

**Headers:**
```
Authorization: Bearer <owner-token>
```

**Request Body:**
```json
{
  "status": "accepted",
  "interview": {
    "scheduledAt": "2024-06-30T10:00:00.000Z",
    "location": "123 Main St, Dhaka",
    "notes": "Please bring your license and certificates"
  }
}
```

**Response (200):**
```json
{
  "message": "Application status updated",
  "application": {
    "_id": "60d5ec49f1b2c72b8c8e4f1e",
    "status": "interview_scheduled",
    "interview": {
      "scheduledAt": "2024-06-30T10:00:00.000Z",
      "location": "123 Main St, Dhaka",
      "notes": "Please bring your license and certificates"
    },
    "updatedAt": "2024-06-25T13:00:00.000Z"
  }
}
```

---

## Car Management

### Create Car Listing
Add a new car to the platform.

**Endpoint:** `POST /cars`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
make: "Toyota"
model: "Corolla"
year: 2020
color: "White"
licensePlate: "DHA-1234"
mileage: 25000
fuelType: "petrol"
transmission: "automatic"
forRent: true
rentRates[hourly]: 500
rentRates[daily]: 5000
images: <file1>
images: <file2>
```

**Response (201):**
```json
{
  "message": "Car created successfully",
  "car": {
    "_id": "60d5ec49f1b2c72b8c8e4f1f",
    "owner": "60d5ec49f1b2c72b8c8e4f1a",
    "make": "Toyota",
    "model": "Corolla",
    "year": 2020,
    "color": "White",
    "licensePlate": "DHA-1234",
    "mileage": 25000,
    "fuelType": "petrol",
    "transmission": "automatic",
    "forRent": true,
    "rentRates": {
      "hourly": 500,
      "daily": 5000
    },
    "images": [
      "uploads/images-123456789.jpg",
      "uploads/images-123456790.jpg"
    ],
    "availability": {
      "status": "available"
    },
    "isApproved": false,
    "createdAt": "2024-06-25T14:00:00.000Z"
  }
}
```

### Get All Cars
Browse all approved car listings.

**Endpoint:** `GET /cars`

**Query Parameters:**
- `make` (optional): Car manufacturer
- `model` (optional): Car model
- `fuelType` (optional): "petrol" | "diesel" | "electric" | "hybrid"
- `transmission` (optional): "manual" | "automatic"
- `forSale` (optional): "true" | "false"
- `forRent` (optional): "true" | "false"
- `minPrice` (optional): Minimum sale price
- `maxPrice` (optional): Maximum sale price

**Example:** `GET /cars?make=Toyota&forRent=true`

**Response (200):**
```json
[
  {
    "_id": "60d5ec49f1b2c72b8c8e4f1f",
    "owner": {
      "_id": "60d5ec49f1b2c72b8c8e4f1a",
      "name": "John Doe",
      "phone": "+1234567890"
    },
    "make": "Toyota",
    "model": "Corolla",
    "year": 2020,
    "forRent": true,
    "rentRates": {
      "hourly": 500,
      "daily": 5000
    },
    "availability": {
      "status": "available"
    }
  }
]
```

### Upload Car Document
Upload car-related documents.

**Endpoint:** `POST /cars/:carId/documents`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
type: "rc" | "insurance" | "pollution" | "permit"
documentNumber: "ABC123456"
issueDate: "2024-01-01"
expiryDate: "2025-01-01"
document: <file>
```

**Response (200):**
```json
{
  "message": "Document uploaded successfully",
  "car": {
    "documents": [
      {
        "type": "rc",
        "documentNumber": "ABC123456",
        "documentUrl": "uploads/document-123456789.pdf",
        "issueDate": "2024-01-01T00:00:00.000Z",
        "expiryDate": "2025-01-01T00:00:00.000Z",
        "isVerified": false
      }
    ]
  }
}
```

---

## Booking Management

### Create Booking
Book a car for rent.

**Endpoint:** `POST /bookings`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "carId": "60d5ec49f1b2c72b8c8e4f1f",
  "startDate": "2024-07-01T09:00:00.000Z",
  "endDate": "2024-07-03T18:00:00.000Z",
  "rateType": "daily",
  "pickupLocation": {
    "address": "123 Main St, Dhaka",
    "coordinates": {
      "lat": 23.7808875,
      "lng": 90.4201466
    }
  },
  "dropoffLocation": {
    "address": "456 Oak Ave, Dhaka",
    "coordinates": {
      "lat": 23.7908875,
      "lng": 90.4301466
    }
  }
}
```

**Response (201):**
```json
{
  "message": "Booking created successfully",
  "booking": {
    "_id": "60d5ec49f1b2c72b8c8e4f20",
    "car": "60d5ec49f1b2c72b8c8e4f1f",
    "customer": "60d5ec49f1b2c72b8c8e4f1b",
    "startDate": "2024-07-01T09:00:00.000Z",
    "endDate": "2024-07-03T18:00:00.000Z",
    "rateType": "daily",
    "totalAmount": 15000,
    "status": "pending",
    "createdAt": "2024-06-25T15:00:00.000Z"
  }
}
```

### Get All Bookings
Get bookings (user sees their own, admin sees all).

**Endpoint:** `GET /bookings`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): "pending" | "confirmed" | "active" | "completed" | "cancelled"

**Response (200):**
```json
[
  {
    "_id": "60d5ec49f1b2c72b8c8e4f20",
    "car": {
      "_id": "60d5ec49f1b2c72b8c8e4f1f",
      "make": "Toyota",
      "model": "Corolla"
    },
    "customer": {
      "_id": "60d5ec49f1b2c72b8c8e4f1b",
      "name": "Jane Smith",
      "phone": "+1234567891"
    },
    "startDate": "2024-07-01T09:00:00.000Z",
    "endDate": "2024-07-03T18:00:00.000Z",
    "totalAmount": 15000,
    "status": "confirmed",
    "createdAt": "2024-06-25T15:00:00.000Z"
  }
]
```

### Cancel Booking
Cancel a booking.

**Endpoint:** `PUT /bookings/:id/cancel`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Booking cancelled successfully",
  "booking": {
    "_id": "60d5ec49f1b2c72b8c8e4f20",
    "status": "cancelled"
  }
}
```

---

## Common Response Formats

### Success Response
```json
{
  "message": "Operation successful",
  "data": { }
}
```

### Error Response
```json
{
  "message": "Error message",
  "error": "Detailed error description"
}
```

### Validation Error Response
```json
{
  "errors": [
    {
      "msg": "Email is required",
      "param": "email",
      "location": "body"
    }
  ]
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Get the token by calling the `/auth/login` or `/auth/register` endpoints.

## Rate Limiting

(To be implemented)
- 100 requests per 15 minutes per IP
- 1000 requests per hour per user

## Pagination

(To be implemented)
Query parameters for paginated endpoints:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

---

*For more information, see the main README.md and FEATURES.md documentation.*
