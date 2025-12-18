# Contributing to Dhon

Thank you for your interest in contributing to Dhon! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Commit Message Guidelines](#commit-message-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Reporting Bugs](#reporting-bugs)
9. [Suggesting Features](#suggesting-features)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We expect everyone to:

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- Git
- A code editor (VS Code recommended)

### Setup Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/dhon.git
   cd dhon
   ```

3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/kopotrahman/dhon.git
   ```

4. Install dependencies:
   ```bash
   npm run install-all
   ```

5. Set up environment variables:
   ```bash
   cd backend && cp .env.example .env
   cd ../frontend && cp .env.example .env
   ```

6. Start development servers:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm start
   ```

## Development Workflow

### Before Starting Work

1. Sync your fork with upstream:
   ```bash
   git checkout main
   git fetch upstream
   git merge upstream/main
   ```

2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

Examples:
- `feature/add-payment-gateway`
- `fix/booking-conflict-detection`
- `docs/update-api-documentation`

## Coding Standards

### Backend (Node.js/Express)

#### File Organization
```
backend/
├── src/
│   ├── config/       # Configuration files
│   ├── controllers/  # Route controllers
│   ├── middleware/   # Custom middleware
│   ├── models/       # Mongoose models
│   ├── routes/       # API routes
│   ├── utils/        # Utility functions
│   └── server.js     # Entry point
```

#### Naming Conventions

- **Files**: camelCase for utilities, PascalCase for models
  - `jwtUtils.js`
  - `User.js`
  - `authController.js`

- **Variables & Functions**: camelCase
  ```javascript
  const userProfile = getUserProfile();
  ```

- **Classes & Models**: PascalCase
  ```javascript
  class UserService { }
  const User = mongoose.model('User');
  ```

- **Constants**: UPPER_SNAKE_CASE
  ```javascript
  const MAX_LOGIN_ATTEMPTS = 5;
  ```

#### Code Style

- Use `const` for constants, `let` for variables (avoid `var`)
- Use arrow functions for callbacks and short functions
- Use async/await instead of promises chains
- Add JSDoc comments for functions
- Keep functions small and focused

Example:
```javascript
/**
 * Get user by ID
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} User object
 */
const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
};
```

#### Error Handling

Always use try-catch blocks for async operations:

```javascript
const createJob = async (req, res) => {
  try {
    // Logic here
    res.status(201).json({ message: 'Success', data });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};
```

### Frontend (React)

#### File Organization
```
frontend/src/
├── components/      # React components
│   ├── auth/
│   ├── dashboard/
│   └── common/
├── contexts/        # React contexts
├── utils/           # Utility functions
├── pages/           # Page components
└── App.js
```

#### Component Structure

- Use functional components with hooks
- One component per file
- Name file same as component

```javascript
// components/auth/Login.js
import React, { useState } from 'react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  
  return (
    <div className="login-container">
      {/* Component JSX */}
    </div>
  );
};

export default Login;
```

#### Naming Conventions

- **Components**: PascalCase
  - `LoginForm.js`
  - `UserProfile.js`

- **Utilities**: camelCase
  - `api.js`
  - `formatDate.js`

- **CSS Classes**: kebab-case
  ```css
  .login-container { }
  .user-profile-card { }
  ```

#### Code Style

- Use destructuring for props
- Keep components small and focused
- Use meaningful variable names
- Add PropTypes or TypeScript for type checking

Example:
```javascript
const UserCard = ({ user, onEdit, onDelete }) => {
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <button onClick={() => onEdit(user.id)}>Edit</button>
      <button onClick={() => onDelete(user.id)}>Delete</button>
    </div>
  );
};
```

### CSS/Styling

- Use BEM methodology or similar
- Keep styles modular (one CSS file per component)
- Use CSS variables for colors and common values
- Mobile-first responsive design

```css
/* Good */
.login-form { }
.login-form__input { }
.login-form__button--primary { }

/* Variables */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
}
```

## Testing Guidelines

### Writing Tests

(Testing framework to be added)

- Write unit tests for utilities and helpers
- Write integration tests for API endpoints
- Write component tests for React components
- Aim for at least 70% code coverage

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Commit Message Guidelines

Follow the Conventional Commits specification:

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(auth): add OAuth2 login support

Implement Google OAuth2 authentication flow
- Add Google strategy configuration
- Create OAuth callback route
- Update user model for OAuth fields

Closes #123
```

```
fix(booking): resolve conflict detection bug

Fix issue where overlapping bookings were not detected
when end time matched start time of another booking

Fixes #456
```

```
docs(api): update authentication endpoint documentation

Add examples for JWT token usage and error responses
```

### Best Practices

- Use imperative mood ("add" not "added")
- Keep subject line under 50 characters
- Wrap body at 72 characters
- Reference issues and PRs when relevant

## Pull Request Process

### Before Submitting

1. **Update your branch** with latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Test your changes** thoroughly:
   - Run all existing tests
   - Add new tests for your changes
   - Test manually in browser

3. **Check code quality**:
   - No console.log statements (use proper logging)
   - No commented-out code
   - Follow coding standards
   - Update documentation if needed

4. **Update documentation**:
   - Update README if needed
   - Update API.md for API changes
   - Update FEATURES.md for new features
   - Add code comments where necessary

### Submitting Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Go to GitHub and create a Pull Request

3. Fill out the PR template:
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   How has this been tested?
   
   ## Checklist
   - [ ] Code follows project style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings generated
   - [ ] Tests added/updated
   - [ ] All tests passing
   ```

4. Request review from maintainers

### Review Process

- At least one approval required
- All tests must pass
- No merge conflicts
- Follows coding standards
- Documentation updated

### After Approval

- Maintainer will merge using "Squash and merge"
- Your contribution will be in the next release
- Delete your feature branch

## Reporting Bugs

### Before Reporting

1. Check existing issues
2. Verify it's actually a bug
3. Try to reproduce consistently

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Screenshots**
If applicable

**Environment**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 91]
- Node version: [e.g., 16.0.0]

**Additional Context**
Any other relevant information
```

## Suggesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Proposed Solution**
How you think it should work

**Alternatives Considered**
Other solutions you've thought about

**Additional Context**
Screenshots, mockups, examples
```

## Questions?

- Open an issue for general questions
- Tag with `question` label
- Be specific and provide context

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in commit history

Thank you for contributing to Dhon! 🚗💨
