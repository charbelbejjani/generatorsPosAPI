# Authentication System - Setup & Usage Guide

## 🎉 Implementation Complete!

Your OAuth2-compliant authentication system with JWT tokens and permissions is now fully implemented.

---

## 📋 Next Steps

### 1. Run Database Migrations

Execute the SQL file to create necessary tables:

```bash
mysql -u bejjany_pos_test -p bejjany_pos_test < auth_setup.sql
```

Or run it in your MySQL client/workbench.

### 2. Update Environment Variables

Edit `.env` and update the JWT_SECRET:

```env
JWT_SECRET=your-super-secret-key-change-this-in-production-min-32-characters
```

**Important:** Use a strong, random secret in production!

### 3. Configure Page IDs

Update the `USERS_PAGE_ID` in `src/routes/users.js` to match your `pages` table:

```javascript
const USERS_PAGE_ID = 1; // Change to actual page ID for users management
```

### 4. Start the Server

```bash
npm run dev
```

The server will start with nodemon and auto-restart on changes.

---

## 🔐 API Endpoints

### Authentication Endpoints (Public)

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "abc123...",
  "expires_in": 900,
  "token_type": "Bearer",
  "user": {
    "userid": 1,
    "username": "admin",
    "first_name": "Admin",
    "last_name": "User",
    "email": "admin@example.com",
    "group_id": 1,
    "groupname": "Administrators"
  },
  "permissions": {
    "permissions": { "1": 4, "2": 4 },
    "pages": [1, 2, 3, 5],
    "controls": [12, 15, 18]
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "abc123..."
}
```

### Protected Endpoints (Require Authentication)

All protected endpoints require the Authorization header:

```http
Authorization: Bearer <access_token>
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refresh_token": "abc123..."
}
```

#### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "current_password": "old_password",
  "new_password": "new_password"
}
```

#### Get All Users (Example Protected Route)
```http
GET /api/users
Authorization: Bearer <access_token>
```

---

## 🔑 JWT Token Structure

The access token contains:

```json
{
  "userid": 1,
  "username": "admin",
  "group_id": 1,
  "groupname": "Administrators",
  "permissions": {
    "1": 4,  // pageId: permission level
    "2": 3,
    "3": 2
  },
  "pages": [1, 2, 3, 5],        // Accessible page IDs
  "controls": [12, 15, 18],     // Accessible control IDs
  "type": "access",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Permission Levels:**
- 1 = READ
- 2 = EDIT
- 3 = ADD
- 4 = DELETE

---

## 🛡️ Using Authentication in Your Routes

### Protect a Route

```javascript
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// Require authentication only
router.get('/endpoint', authenticate, controller.method);

// Require authentication + permission check
router.get('/users', 
  authenticate, 
  authorize(PAGE_ID, 'read'), 
  controller.getAllUsers
);

router.post('/users', 
  authenticate, 
  authorize(PAGE_ID, 'add'), 
  controller.createUser
);
```

### Access User Data in Controllers

```javascript
exports.someController = async (req, res) => {
  // User data from JWT token
  const { userid, username, group_id } = req.user;
  
  // Page context (if using authorize middleware)
  const { pageId, permission } = req.pageContext;
  
  // Your logic here
};
```

---

## 🎨 Frontend Integration

### Store Tokens

```javascript
// After login
const response = await fetch('http://localhost:4000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

const data = await response.json();

// Store tokens
localStorage.setItem('access_token', data.access_token);
localStorage.setItem('refresh_token', data.refresh_token);
localStorage.setItem('user', JSON.stringify(data.user));
localStorage.setItem('permissions', JSON.stringify(data.permissions));
```

### Make Authenticated Requests

```javascript
const token = localStorage.getItem('access_token');

const response = await fetch('http://localhost:4000/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Check Permissions on Frontend

```javascript
// Decode JWT or use stored permissions
const permissions = JSON.parse(localStorage.getItem('permissions'));

// Check if user can access a page
if (permissions.pages.includes(pageId)) {
  // Show page
}

// Check if user can perform action
if (permissions.permissions[pageId] >= 3) {
  // Show "Add" button (ADD = 3)
}

// Check control access
if (permissions.controls.includes(controlId)) {
  // Show control
}
```

### Handle Token Expiration

```javascript
async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem('access_token');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });

  // If token expired, refresh it
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');
    const refreshResponse = await fetch('http://localhost:4000/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      localStorage.setItem('access_token', data.access_token);
      
      // Retry original request
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${data.access_token}`
        }
      });
    } else {
      // Refresh failed, redirect to login
      window.location.href = '/login';
    }
  }

  return response;
}
```

---

## 🧪 Testing the API

### Using cURL

```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# Get users (protected)
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman

1. Create a POST request to `/api/auth/login`
2. Set body to JSON: `{"username": "admin", "password": "password123"}`
3. Copy the `access_token` from response
4. For protected routes, add header: `Authorization: Bearer <access_token>`

---

## ⚠️ Important Security Notes

1. **Change JWT_SECRET**: Use a strong, random secret in production
2. **HTTPS Only**: Always use HTTPS in production
3. **Password Requirements**: Update password validation in `passwordHelper.js`
4. **Rate Limiting**: Consider adding rate limiting to login endpoint
5. **Database Permissions**: Backend always validates against database
6. **Token Storage**: Never commit tokens to git

---

## 🔧 Adding Protection to New Routes

When creating new routes:

```javascript
// 1. Import middleware
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// 2. Define page ID (from pages table)
const CLIENTS_PAGE_ID = 2;

// 3. Protect routes
router.get('/clients', 
  authenticate,                        // Verify token
  authorize(CLIENTS_PAGE_ID, 'read'),  // Check permission
  clientController.getAll
);

router.post('/clients', 
  authenticate, 
  authorize(CLIENTS_PAGE_ID, 'add'), 
  clientController.create
);
```

---

## 📊 Database Tables Used

- `users` - User accounts and credentials
- `users_groups` - User groups (roles)
- `users_rights` - Page permissions per group
- `tblusers_controls` - Control access per group
- `pages` - Application pages
- `tblcontrols` - Application controls
- `refresh_tokens` - Store refresh tokens
- `tbluserlogin` - Login/logout audit log

---

## 🐛 Troubleshooting

### "INVALID_CREDENTIALS" Error
- Check username and password are correct
- Verify user exists in database
- Ensure password is hashed with bcrypt

### "ACCOUNT_LOCKED" Error
- User exceeded max login attempts (5)
- Unlock by setting `locked = 0` in users table

### "INSUFFICIENT_PERMISSIONS" Error
- Check `users_rights` table for user's group
- Verify page is active in `pages` table
- Ensure permission level is sufficient

### "TOKEN_EXPIRED" Error
- Use refresh token to get new access token
- If refresh token expired, user must login again

---

## 📝 Creating First User

Since passwords must be hashed, create first user via API or use this helper:

```javascript
// Run this once to create admin user
const bcrypt = require('bcryptjs');
const password = await bcrypt.hash('admin123', 10);
console.log(password); // Use this hash in INSERT query
```

Then:
```sql
INSERT INTO users (username, password, first_name, last_name, email, group_id, active)
VALUES ('admin', '$2a$10$...hashedpassword...', 'Admin', 'User', 'admin@example.com', 1, 1);
```

---

## 🎯 What's Implemented

✅ OAuth2 Resource Owner Password Credentials flow
✅ JWT access tokens (15 min expiry)
✅ Refresh tokens (7 day expiry, stored in DB)
✅ Password hashing with bcrypt
✅ Login attempt tracking and account locking
✅ Permission-based authorization
✅ Permissions embedded in JWT for FE
✅ Backend permission validation
✅ Login/logout audit logging
✅ Change password functionality
✅ Token refresh mechanism
✅ Protected routes with middleware

---

## 📞 Need Help?

Check the error messages - they're descriptive:
- JWT errors: Check token format and expiration
- Permission errors: Verify users_rights table
- Login errors: Check credentials and account status

Good luck! 🚀
