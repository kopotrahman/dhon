# Dhon - Quick Start Guide

Get up and running with Dhon in 5 minutes!

## Prerequisites

- Node.js v14+ installed
- MongoDB running locally
- Terminal/Command prompt

## 1. Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/kopotrahman/dhon.git
cd dhon

# Install all dependencies
npm run install-all
```

## 2. Configure Environment (1 minute)

### Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set at minimum:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dhon
JWT_SECRET=your-super-secret-key-change-this
CLIENT_URL=http://localhost:3000
```

### Frontend Configuration

```bash
cd ../frontend
cp .env.example .env
```

The default frontend `.env` should work:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 3. Start MongoDB (30 seconds)

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
# Start MongoDB service from Services app
```

## 4. Run the Application (1 minute)

Open two terminal windows:

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

You should see:
```
Server is running on port 5000
MongoDB Connected: localhost
```

### Terminal 2 - Frontend
```bash
cd frontend
npm start
```

Browser should automatically open to `http://localhost:3000`

## 5. Test It Out!

### Register a New User

1. Navigate to `http://localhost:3000`
2. Click "Register here"
3. Fill in the form:
   - Name: John Doe
   - Email: john@example.com
   - Phone: 1234567890
   - Role: Car Owner
   - Password: password123
   - City: Dhaka
   - Country: Bangladesh
4. Click "Register"

### You're In!

You should now see the dashboard with:
- Welcome message
- Role badge
- Navigation sidebar
- Feature cards

## What Can You Do Now?

### As an Owner:
- ✅ View your dashboard
- ✅ Browse available features
- 📋 Post jobs (API ready, UI coming soon)
- 🚗 Add cars (API ready, UI coming soon)

### As a Driver:
- ✅ View your dashboard
- ✅ See pending approval status
- 📋 Browse jobs (API ready, UI coming soon)
- 📝 Apply for jobs (API ready, UI coming soon)

### Test the API Directly

```bash
# Login and get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Use the token to access protected routes
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Next Steps

### Want to Build More Features?

1. **Check the Models** - All database schemas are ready in `backend/src/models/`
2. **Follow the Pattern** - Look at existing controllers and routes
3. **Build Frontend Components** - Use Dashboard.js as a template
4. **Read the Docs** - See FEATURES.md for what's available

### Example: Add a Job Listing Page

1. Create controller functions (pattern exists in jobController.js)
2. Frontend component:
```javascript
// frontend/src/components/jobs/JobList.js
import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const JobList = () => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      const response = await api.get('/jobs');
      setJobs(response.data);
    };
    fetchJobs();
  }, []);

  return (
    <div className="job-list">
      {jobs.map(job => (
        <div key={job._id} className="job-card">
          <h3>{job.title}</h3>
          <p>{job.location.city}</p>
          <p>Salary: {job.salary.amount} BDT/{job.salary.period}</p>
        </div>
      ))}
    </div>
  );
};

export default JobList;
```

3. Add route to App.js
4. Done!

## Troubleshooting

### MongoDB Connection Error?
```bash
# Check if MongoDB is running
# macOS
brew services list

# Linux
sudo systemctl status mongod
```

### Port 5000 already in use?
Change `PORT=5000` to `PORT=5001` in `backend/.env`

### Can't find module?
```bash
# Reinstall dependencies
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

### Frontend won't start?
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

## Resources

- **Full Setup Guide**: SETUP.md
- **Feature List**: FEATURES.md
- **API Documentation**: API.md
- **Contributing Guide**: CONTRIBUTING.md
- **Project Summary**: PROJECT_SUMMARY.md

## Getting Help

1. Check SETUP.md for detailed troubleshooting
2. Read the error message carefully
3. Search existing issues on GitHub
4. Open a new issue with:
   - What you tried to do
   - What happened
   - Error messages
   - Your environment (OS, Node version)

## Success! 🎉

You now have:
- ✅ A working MERN stack application
- ✅ User authentication system
- ✅ Role-based access control
- ✅ Complete backend API
- ✅ Responsive frontend
- ✅ Real-time communication ready
- ✅ Scalable architecture

**Start building your features!** 🚗💨

---

*This is just the beginning. The foundation is solid. The possibilities are endless.*
