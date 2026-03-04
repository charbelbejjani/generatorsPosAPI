# Bruno API Collection - Import Guide

## 📁 Files Created

I've created your API collection in **3 formats**:

### 1. **Bruno Native Format** (Recommended) ✨
   - Location: `bruno/` folder
   - Contains `.bru` files organized by feature
   - **Best option for Bruno users**

### 2. **cURL Commands**
   - File: `bruno-collection.txt`
   - Copy-paste ready cURL commands

### 3. **JSON Format**
   - File: `bruno-collection.json`
   - Alternative import format

---

## 🚀 How to Import into Bruno

### Option 1: Open Bruno Collection (Easiest)

1. Open Bruno
2. Click **"Open Collection"**
3. Navigate to and select the `bruno` folder
4. Done! All requests will be loaded

### Option 2: Use cURL Commands

1. Open `bruno-collection.txt`
2. Copy any cURL command
3. In Bruno, click **"Import cURL"**
4. Paste and import

---

## 📋 Collection Structure

```
bruno/
├── environments/
│   └── Local.bru              # Environment variables
├── Auth/
│   ├── 1. Login.bru
│   ├── 2. Refresh Token.bru
│   ├── 3. Get Current User.bru
│   ├── 4. Logout.bru
│   └── 5. Change Password.bru
└── Users/
    ├── Get All Users.bru
    ├── Get User By ID.bru
    └── Create User.bru
```

---

## 🔧 Setup Environment Variables

After importing, set these variables in the **Local** environment:

1. `baseUrl` = `http://localhost:4000` (already set)
2. `access_token` = (will be filled after login)
3. `refresh_token` = (will be filled after login)

### To set tokens after login:

1. Run the **"1. Login"** request
2. Copy `access_token` from response
3. Go to **Environments** → **Local**
4. Paste into `access_token` variable
5. Repeat for `refresh_token`

Or use Bruno's **Scripts** feature to auto-save tokens:

```javascript
// Add this to the Login request's "Post Response" script
if (res.status === 200) {
  bru.setEnvVar('access_token', res.body.access_token);
  bru.setEnvVar('refresh_token', res.body.refresh_token);
}
```

---

## 📝 Request Order

### First Time Setup:
1. **Login** - Get your tokens
2. **Get Current User** - Verify authentication works
3. **Get All Users** - Test protected endpoint

### Working with Tokens:
- Access tokens expire after **15 minutes**
- Use **Refresh Token** when you get 401 errors
- **Logout** when done to invalidate refresh token

---

## 🔐 Authentication Flow

```
1. Login          → Get access_token & refresh_token
   ↓
2. Use API        → Include Bearer token in requests
   ↓
3. Token expires? → Use Refresh Token endpoint
   ↓
4. Logout         → Revoke refresh_token
```

---

## 📖 Request Details

### Auth Endpoints (Public - No Token Required)

**1. Login**
- Method: POST
- URL: `/api/auth/login`
- Body: `{ "username": "admin", "password": "password123" }`
- Returns: tokens + user info + permissions

**2. Refresh Token**
- Method: POST
- URL: `/api/auth/refresh`
- Body: `{ "refresh_token": "your_token" }`
- Returns: new access_token

### Auth Endpoints (Protected - Token Required)

**3. Get Current User**
- Method: GET
- URL: `/api/auth/me`
- Auth: Bearer Token
- Returns: user info + permissions

**4. Logout**
- Method: POST
- URL: `/api/auth/logout`
- Auth: Bearer Token
- Body: `{ "refresh_token": "your_token" }`

**5. Change Password**
- Method: POST
- URL: `/api/auth/change-password`
- Auth: Bearer Token
- Body: `{ "current_password": "old", "new_password": "new" }`

### Users Endpoints (Protected + Permissions Required)

**Get All Users**
- Method: GET
- URL: `/api/users`
- Auth: Bearer Token
- Requires: READ permission on users page

**Get User By ID**
- Method: GET
- URL: `/api/users/:id`
- Auth: Bearer Token
- Requires: READ permission on users page

**Create User**
- Method: POST
- URL: `/api/users`
- Auth: Bearer Token
- Body: User object with password
- Requires: ADD permission on users page

---

## 🎯 Quick Test Workflow

```bash
1. Start your server: npm run dev

2. Open Bruno and load the collection

3. Run "1. Login" request
   - Default credentials: admin / password123
   - Copy tokens to environment variables

4. Run "3. Get Current User"
   - Should return your user info

5. Run "Get All Users"
   - Should return list of users

6. Try other endpoints!
```

---

## ⚡ Pro Tips

1. **Auto-save tokens**: Add post-response scripts to Login request
2. **Test permissions**: Try requests with different user groups
3. **Handle expiry**: Set up auto-refresh logic in scripts
4. **Environment switching**: Create Dev, Staging, Production environments
5. **Documentation**: Each .bru file has a `docs` section with details

---

## 🐛 Troubleshooting

**401 Unauthorized?**
- Check if access_token is set in environment
- Token might be expired - use Refresh Token
- Check Authorization header format: `Bearer <token>`

**403 Forbidden?**
- User doesn't have required permission
- Check users_rights table in database
- Verify page is active in pages table

**500 Server Error?**
- Check server logs
- Verify database is running
- Check if tables exist (run auth_setup.sql)

---

## 📚 More Info

See [AUTH_GUIDE.md](AUTH_GUIDE.md) for complete authentication documentation.

Happy testing! 🚀
