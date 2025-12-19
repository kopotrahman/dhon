# Dhon - Features Documentation

This document provides detailed information about all features implemented in the Dhon Car Management Platform.

## Table of Contents

1. [User Management](#user-management)
2. [Driver Hiring & Job System](#driver-hiring--job-system)
3. [Booking & Rate System](#booking--rate-system)
4. [Document & Car Management](#document--car-management)
5. [Marketplace & Cart](#marketplace--cart)
6. [Car Sales & Rentals](#car-sales--rentals)
7. [Payment & Billing](#payment--billing)
8. [Review, Rating & Feedback](#review-rating--feedback)
9. [Service Center & GPS Integration](#service-center--gps-integration)
10. [Admin Panel](#admin-panel)
11. [Community Forum](#community-forum)
12. [Notifications](#notifications)
13. [Communication & Support](#communication--support)
14. [Other Features](#other-features)

---

## User Management

### User Roles

The platform supports three distinct user roles:

1. **Owner** - Car owners who want to hire drivers or rent out their vehicles
2. **Driver** - Professional drivers looking for employment opportunities
3. **Admin** - System administrators with full access

### Authentication System

- **Secure JWT Authentication**: Token-based authentication for API security
- **Password Hashing**: Using bcrypt for secure password storage
- **Token Expiration**: Configurable token expiry (default: 7 days)
- **Protected Routes**: Role-based access control for different endpoints

### Profile Management

Users can manage their profiles with:
- **Profile Photo**: Upload and update profile picture
- **Contact Information**: Name, email, phone number
- **Address Details**: Full address with city, state, zip code, country
- **Driver-Specific**: License information (number, expiry date, document)

### KYC Verification (Drivers)

Required for drivers to access full platform features:

1. **Document Upload**:
   - ID Proof (National ID, Passport)
   - Address Proof (Utility bill, Bank statement)
   - Driving License

2. **Verification Process**:
   - Documents are reviewed by admin
   - Admin can approve or reject documents
   - Verified status is tracked with timestamp and verifier

3. **Benefits**:
   - Access to job applications
   - Trust badge on profile
   - Priority in search results

### Admin Approval

- **Automatic for Admins**: Admin accounts are auto-approved
- **Manual for Others**: Owners and drivers need admin approval
- **Approval Status**: Clearly displayed on dashboard
- **Access Control**: Restricted features until approval

---

## Driver Hiring & Job System

### Job Posting (Owners)

Owners can create job listings with:
- **Job Title**: Position name
- **Description**: Detailed job requirements
- **Location**: Address and geographic coordinates
- **Salary**: Amount and period (hourly, daily, monthly)
- **Car Model**: Vehicle to be driven
- **Requirements**: List of qualifications
- **Duration**: Start and optional end date

### Job Browsing (Drivers)

Drivers can:
- Browse all open job listings
- Filter by location, car model, salary
- View detailed job information
- See company/owner details

### Application System

**For Drivers**:
- Apply for jobs with cover letter
- Track application status
- View application history
- See interview schedules

**For Owners**:
- View all applications for their jobs
- Review driver profiles and KYC status
- Accept or reject applications
- Schedule interviews

### Application Status Tracking

Four status levels:
1. **Pending**: Application submitted, awaiting review
2. **Interview Scheduled**: Owner has scheduled an interview
3. **Accepted**: Application approved
4. **Rejected**: Application declined

### Interview Scheduling

- **Optional Feature**: Owners can schedule interviews
- **Details Included**: Date/time, location, notes
- **Notifications**: Both parties receive updates

### Contract Signing (Optional)

- **E-Sign System**: Digital signature support
- **Contract Upload**: PDF contracts can be uploaded
- **Signed Status**: Track contract completion
- **Document Storage**: Secure storage of signed contracts

---

## Booking & Rate System

### Calendar-Based Booking

- **Date Selection**: Choose start and end dates
- **Visual Calendar**: (Frontend implementation pending)
- **Time Slots**: Hourly or daily bookings
- **Availability Check**: Real-time availability verification

### Hourly/Daily Rates

- **Flexible Pricing**: Set different rates for hourly/daily
- **Toggle System**: Easy switching between rate types
- **Custom Rates**: Owners set their own pricing
- **Calculation**: Automatic total amount calculation

### Conflict Detection

Advanced booking conflict prevention:
- **Database-Level Checks**: Ensures no overlapping bookings
- **Real-Time Validation**: Checks before confirming booking
- **Status Awareness**: Considers pending, confirmed, and active bookings
- **Error Messages**: Clear feedback when conflicts occur

### Rate Negotiation (Chat-Based)

- **In-App Messaging**: Real-time chat between parties
- **Bidding System**: (Implementation in progress)
- **Price Discussion**: Negotiate rates before booking
- **Agreement Tracking**: Record final agreed rates

---

## Document & Car Management

### Document Upload

Supported document types:
- **RC (Registration Certificate)**: Vehicle registration
- **Insurance**: Vehicle insurance papers
- **Pollution Certificate**: Emission test results
- **Permit**: Commercial vehicle permits

Each document includes:
- Document number
- Issue date
- Expiry date
- File upload (PDF, images)

### Expiry Tracking

- **Automatic Monitoring**: System tracks expiry dates
- **Advance Reminders**: Notifications before expiry
- **Status Indicators**: Visual warnings for expired documents
- **Renewal Tracking**: History of document renewals

### Admin Verification

- **Review Process**: Admin reviews uploaded documents
- **Verification Status**: Approved/pending/rejected
- **Verifier Tracking**: Records who verified
- **Timestamp**: When verification occurred

### Car Profiles

Comprehensive car information:
- **Basic Details**: Make, model, year, color
- **License Plate**: Unique identifier
- **Mileage**: Current odometer reading
- **Fuel Type**: Petrol, diesel, electric, hybrid
- **Transmission**: Manual or automatic
- **Images**: Multiple photos (up to 5)
- **Specifications**: Seating capacity, engine, features
- **Availability Status**: Available, rented, maintenance, sold

---

## Marketplace & Cart

### Product Catalog

Categories:
- **Parts**: Spare parts and components
- **Tools**: Maintenance and repair tools
- **Accessories**: Interior/exterior accessories
- **Other**: Miscellaneous items

Product Details:
- Name and description
- Price
- Stock quantity
- Images
- Specifications
- Vendor information
- Ratings and reviews

### Cart Management

Shopping cart features:
- **Add to Cart**: Quick add from product page
- **Update Quantity**: Increase/decrease items
- **Remove Items**: Delete unwanted products
- **Save for Later**: (Implementation pending)
- **Price Calculation**: Automatic subtotal and total

### Order Processing

Order workflow:
1. **Cart Review**: Verify items and quantities
2. **Shipping Details**: Enter delivery address
3. **Payment**: Choose payment method and pay
4. **Confirmation**: Receive order confirmation
5. **Tracking**: Track order status

### Order History

View past orders with:
- Order date and number
- Items purchased
- Total amount
- Payment status
- Delivery status
- Invoice download

### Vendor Onboarding (Optional)

- **Vendor Registration**: Sellers can register
- **Product Listing**: Vendors manage their products
- **Order Management**: Track and fulfill orders
- **Commission System**: (Implementation pending)
- **Ratings**: Vendors receive ratings

---

## Car Sales & Rentals

### Car Listings

Detailed car information for sale:
- **Price**: Sale price
- **Model Details**: Make, model, year
- **Images**: High-quality photos
- **Mileage**: Total kilometers driven
- **Condition**: New, used, certified
- **Features**: List of included features
- **Owner Contact**: Contact information

### Search & Filter

Advanced filtering options:
- **Brand**: Filter by manufacturer
- **Fuel Type**: Petrol, diesel, electric, hybrid
- **Transmission**: Manual or automatic
- **Price Range**: Min and max price
- **Year**: Manufacturing year range
- **Mileage**: Maximum mileage
- **Location**: City or region

### Test Drives (Optional)

- **Request System**: Interested buyers request test drives
- **Scheduling**: Owner sets time and location
- **Verification**: ID verification for test drivers
- **Tracking**: History of test drive requests

### Car Rentals

Rental-specific features:
- **Calendar Availability**: View available dates
- **Rental Rates**: Hourly or daily pricing
- **Pickup/Drop-off**: Location options
- **Duration Selection**: Choose rental period
- **Instant Booking**: Quick reservation

### Deposit & Insurance

**Security Deposit**:
- Amount set by owner
- Held during rental period
- Refunded after inspection
- Damage deduction capability

**Insurance Verification**:
- Required for rentals
- Document upload
- Verification by owner
- Expiry tracking

---

## Payment & Billing

### Payment Gateways

Integrated payment options:
1. **SSLCommerz**: Popular in Bangladesh
2. **Stripe**: International card payments
3. **bKash**: Mobile financial service (Bangladesh)
4. **Nagad**: Mobile financial service (Bangladesh)

### Payment Features

- **Multiple Currencies**: Support for BDT, USD, etc.
- **Secure Processing**: PCI compliant
- **Transaction IDs**: Unique identifier for each payment
- **Status Tracking**: Pending, completed, failed
- **Payment History**: All transactions viewable

### Invoice System

Auto-generated invoices include:
- Invoice number and date
- Customer details
- Itemized list
- Tax calculations
- Total amount
- Payment method
- Due date (if applicable)

**Features**:
- PDF generation
- Email delivery
- Download option
- Printable format

### Transaction History

Dashboard showing:
- All past transactions
- Date and time
- Amount and currency
- Payment method
- Status (success/failed)
- Invoice link
- Refund status

### Refunds & Cancellations

**Refund Process**:
1. Customer initiates refund request
2. Admin reviews reason
3. Approval/rejection
4. Refund processing
5. Status update

**Cancellation Policy**:
- Time-based rules
- Partial/full refund
- Automatic processing
- Notification to parties

---

## Review, Rating & Feedback

### Rating System

Star ratings (1-5) for:
- **Drivers**: Performance and professionalism
- **Products**: Quality and value
- **Cars**: Condition and experience
- **Sellers**: Service and reliability

### Feedback Components

- **Star Rating**: 1 to 5 stars
- **Written Review**: Detailed feedback
- **Reviewer Information**: Name and photo
- **Date**: When review was posted
- **Verified Badge**: For confirmed customers

### Moderation

Admin capabilities:
- **Review Approval**: Pre-approve or auto-approve
- **Content Filtering**: Remove inappropriate content
- **Flag System**: Users can flag reviews
- **Ban System**: Block abusive reviewers
- **Response System**: Allow replies

### Verified Reviews

Only from:
- Completed bookings
- Delivered orders
- Confirmed transactions
- Real users

---

## Service Center & GPS Integration

### Map View

Google Maps integration showing:
- Service center locations
- User's current location
- Distance calculation
- Directions
- Street view

### Service Center Features

Center information includes:
- Name and description
- Services offered
- Contact details
- Working hours
- Ratings and reviews
- Photos

### Service Booking

Booking process:
1. Select service center
2. Choose service type
3. Pick date and time slot
4. Provide car details
5. Add notes/requirements
6. Confirm booking

### Live GPS Tracking (Rentals)

Real-time features:
- **Current Location**: Live car position
- **Route History**: Travel path
- **Speed Monitoring**: Current speed
- **Geofencing**: Boundary alerts
- **Telematics Integration**: (Advanced feature)

### Maintenance Alerts

Automatic reminders for:
- **Oil Change**: Based on mileage
- **Tire Rotation**: Time-based
- **Inspection**: Annual checkups
- **Document Expiry**: License, insurance
- **Custom Reminders**: User-defined

---

## Admin Panel

### User Management

Admin capabilities:
- **View All Users**: Complete user list
- **User Details**: Full profile access
- **Role Management**: Change user roles
- **Approve/Reject**: User approval
- **Activate/Deactivate**: Account control
- **Delete Users**: Remove accounts

### Moderation Tools

Content moderation:
- **Job Postings**: Approve/reject jobs
- **Car Listings**: Verify car details
- **Products**: Approve marketplace items
- **Forum Posts**: Moderate community content
- **Reviews**: Filter inappropriate reviews

### Analytics Dashboard

Key metrics:
- **Total Users**: By role
- **Active Users**: Last 30 days
- **Revenue**: Total and period-based
- **Bookings**: Total and status breakdown
- **Jobs**: Posted and filled
- **Cars**: Listed and rented
- **Orders**: Marketplace transactions
- **Growth Charts**: Visual trends

### Notifications Management

Admin can send:
- **System Announcements**: Platform-wide
- **Role-Specific**: To owners/drivers
- **Individual**: To specific users
- **Scheduled**: Future notifications
- **Emergency Alerts**: Urgent messages

### Reports & Flags

Handle user reports:
- **Complaint Types**: Various categories
- **Priority Levels**: Low to urgent
- **Investigation**: Track status
- **Resolution**: Close with action
- **Statistics**: Report analytics

---

## Community Forum

### Social Feed

Facebook-like features:
- **Create Posts**: Text and images
- **Comment**: On others' posts
- **Like**: Show appreciation
- **Share**: (Implementation pending)
- **Follow**: Other users
- **Notifications**: Interaction alerts

### Tag System

Organize content by tags:
- **Repair**: Maintenance tips
- **Experience**: User stories
- **Suggestion**: Feature requests
- **Question**: Ask community
- **Review**: Product/service reviews
- **Custom Tags**: User-created

### Moderation Tools

Community management:
- **Content Guidelines**: Clear rules
- **Report System**: Flag inappropriate content
- **Auto-Moderation**: Keyword filtering
- **Manual Review**: Admin oversight
- **Ban System**: Temporary/permanent
- **Appeal Process**: Review decisions

### Post Visibility

Two options:
- **Public**: Visible to all users
- **Private**: Only followers see

### Group Chats (Optional)

Planned features:
- Topic-based groups
- Real-time discussions
- Member management
- File sharing
- Group announcements

---

## Notifications

### Multi-Channel Alerts

Three delivery methods:
1. **Email**: Via Nodemailer
2. **SMS**: Via SMS gateway API
3. **In-App**: Real-time notifications
4. **Push**: Via Firebase (optional)

### Use Cases

Notifications sent for:
- **Booking Updates**: Confirmation, changes, reminders
- **Job Replies**: Application status
- **Document Expiry**: Upcoming expiration
- **Payment**: Transaction confirmations
- **Messages**: New chat messages
- **Reviews**: New ratings
- **System**: Platform updates

### Notification Preferences

Users can control:
- Channel preferences (email, SMS, in-app)
- Frequency settings
- Topic subscriptions
- Quiet hours
- Mute options

### Push Notifications

Firebase Cloud Messaging features:
- **Real-Time**: Instant delivery
- **Offline Queue**: Delivered when online
- **Rich Content**: Images and actions
- **Deep Linking**: Direct to content
- **Analytics**: Delivery tracking

---

## Communication & Support

### In-App Chat

Real-time messaging using Socket.io:
- **One-on-One**: Direct messaging
- **Room-Based**: Grouped conversations
- **Online Status**: See who's active
- **Typing Indicators**: Show typing
- **Message History**: Stored messages
- **File Sharing**: (Implementation pending)

### FAQ Section

Self-service help:
- **Categories**: Organized topics
- **Search**: Find answers quickly
- **Popular Questions**: Most viewed
- **Detailed Answers**: Step-by-step guides
- **Related Articles**: Cross-references

### Ticket System

Support request workflow:
1. **Submit Ticket**: Describe issue
2. **Category Selection**: Technical, billing, etc.
3. **Priority Assignment**: Auto or manual
4. **Admin Assignment**: Ticket routing
5. **Response Thread**: Back-and-forth discussion
6. **Resolution**: Close with solution
7. **Feedback**: Rate support quality

### Ticket Features

- **Status Tracking**: Open, in progress, resolved, closed
- **Priority Levels**: Low, medium, high, urgent
- **Attachments**: Upload screenshots/files
- **Email Updates**: Notification on responses
- **SLA Tracking**: Response time goals

---

## Other Features

### Dark Mode

Theme toggle functionality:
- **Manual Switch**: User-controlled toggle
- **System Preference**: Match OS setting
- **Persistent**: Remember user choice
- **Smooth Transition**: Animated theme change
- **Accessibility**: Improved contrast

### Accessibility Features

Inclusive design:
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and roles
- **High Contrast**: Enhanced visibility
- **Font Scaling**: Adjustable text size
- **Focus Indicators**: Clear focus states
- **Alt Text**: Images described

### Responsive UI

Mobile-first design:
- **Breakpoints**: Tablet and mobile views
- **Touch-Friendly**: Large tap targets
- **Optimized Images**: Fast loading
- **Adaptive Layout**: Flexible grids
- **Mobile Navigation**: Hamburger menu
- **PWA Support** (Optional): Install as app

### Progressive Web App (Optional)

PWA capabilities:
- **Offline Mode**: Basic functionality offline
- **Install Prompt**: Add to home screen
- **App Shell**: Fast initial load
- **Service Worker**: Background sync
- **Push Notifications**: Mobile alerts

---

## Implementation Status

### Completed ✅
- User authentication and authorization
- User profile management
- KYC document upload system
- Job posting and application system
- Car listing and management
- Booking system with conflict detection
- Document management
- Basic payment structure
- Review and rating models
- Service center models
- Forum post structure
- Notification system
- Real-time chat foundation
- Support ticket system

### In Progress 🚧
- Frontend UI for all features
- Payment gateway integration
- GPS tracking implementation
- Advanced analytics dashboard
- Email notification system
- SMS integration
- Push notification setup

### Planned 📋
- Marketplace vendor system
- Advanced search and filtering
- Bidding/negotiation system
- Test drive scheduling
- Invoice PDF generation
- Advanced admin analytics
- Mobile app development
- API documentation

---

## Future Enhancements

- AI-powered car recommendations
- Blockchain-based contract signing
- IoT integration for car telematics
- Machine learning for price suggestions
- Video call support for interviews
- Multi-language support
- Currency conversion
- Advanced reporting tools
- Third-party integrations
- Automated chatbot support

---

*This document is regularly updated as new features are implemented.*
