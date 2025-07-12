# JWT Authentication Guide - Complete Tutorial

## 🎯 **Understanding JWT in Your Skill Swap Backend**

### **What You Already Have:**

Your backend already has complete JWT authentication implemented! Here's what's working:

## 📋 **How JWT Works in Your App**

```
1. User Registration/Login
   ↓
2. Server creates JWT token
   ↓
3. Token sent to frontend
   ↓
4. Frontend stores token
   ↓
5. Frontend sends token with each request
   ↓
6. Server verifies token
   ↓
7. Access granted/denied
```

## 🔧 **Your Current JWT Setup**

### **1. Environment Configuration**

Your `.env` file should have:
```env
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
```

**⚠️ IMPORTANT**: Change this to a secure random string!

### **2. JWT Token Generation (Already Done)**

In `authController.js`, when user logs in:
```javascript
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
```

### **3. JWT Verification Middleware (Already Done)**

In `authMiddleware.js`:
```javascript
const authenticateToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN
  // Verifies token and attaches user to req.user
};
```

## 🚀 **How to Use JWT Authentication**

### **Step 1: Set Secure JWT Secret**

Update your `.env` file with a strong secret:

```env
JWT_SECRET=sk_live_51abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567
```

**Generate a secure secret:**
```bash
# In your terminal:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **Step 2: Test User Registration**

**API Call:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "skillsOffered": ["JavaScript", "React"],
    "skillsWanted": ["Python", "Django"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### **Step 3: Test Login**

**API Call:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### **Step 4: Use Token for Protected Routes**

**With Token:**
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Without Token (Will Fail):**
```bash
curl -X GET http://localhost:5000/api/auth/profile
# Returns: 401 Unauthorized
```

## 🌐 **Frontend Integration Examples**

### **JavaScript/React Example:**

```javascript
// 1. Store token after login
const login = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Store token in localStorage
    localStorage.setItem('authToken', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
  }
};

// 2. Send token with requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};

// 3. Get user profile
const getUserProfile = async () => {
  const response = await makeAuthenticatedRequest('http://localhost:5000/api/auth/profile');
  return response.json();
};

// 4. Create swap request
const createSwap = async (swapData) => {
  const response = await makeAuthenticatedRequest('http://localhost:5000/api/swaps', {
    method: 'POST',
    body: JSON.stringify(swapData),
  });
  return response.json();
};
```

### **HTML/Vanilla JS Example:**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Skill Swap Auth Test</title>
</head>
<body>
    <div id="auth-section">
        <h2>Login</h2>
        <input type="email" id="email" placeholder="Email">
        <input type="password" id="password" placeholder="Password">
        <button onclick="login()">Login</button>
    </div>
    
    <div id="profile-section" style="display:none;">
        <h2>Profile</h2>
        <div id="user-info"></div>
        <button onclick="getProfile()">Get Profile</button>
        <button onclick="logout()">Logout</button>
    </div>

    <script>
        let authToken = localStorage.getItem('authToken');
        
        if (authToken) {
            showProfile();
        }
        
        async function login() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });
                
                const data = await response.json();
                
                if (data.success) {
                    authToken = data.data.token;
                    localStorage.setItem('authToken', authToken);
                    localStorage.setItem('user', JSON.stringify(data.data.user));
                    showProfile();
                } else {
                    alert('Login failed: ' + data.message);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        async function getProfile() {
            try {
                const response = await fetch('http://localhost:5000/api/auth/profile', {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                    },
                });
                
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('user-info').innerHTML = `
                        <p><strong>Name:</strong> ${data.data.user.name}</p>
                        <p><strong>Email:</strong> ${data.data.user.email}</p>
                        <p><strong>Skills Offered:</strong> ${data.data.user.skillsOffered.join(', ')}</p>
                    `;
                } else {
                    alert('Failed to get profile: ' + data.message);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        function showProfile() {
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('profile-section').style.display = 'block';
        }
        
        function logout() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            authToken = null;
            document.getElementById('auth-section').style.display = 'block';
            document.getElementById('profile-section').style.display = 'none';
        }
    </script>
</body>
</html>
```

## 🛡️ **Security Best Practices**

### **1. Secure JWT Secret**
```bash
# Generate a strong secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **2. Token Expiration**
Your tokens expire in 7 days. For production, consider shorter expiration:
```javascript
// In authController.js
jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
```

### **3. Refresh Tokens (Advanced)**
For production apps, implement refresh tokens for better security.

## 🔍 **Testing Your JWT Setup**

### **Test Registration & Login:**

```bash
# 1. Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'

# 2. Copy the token from response
# 3. Test protected route
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🐛 **Common Issues & Solutions**

### **1. "Invalid token" Error**
- Check if token is being sent correctly
- Verify JWT_SECRET is set in .env
- Ensure token format: `Bearer <token>`

- Format: `Authorization: Bearer <your-token>`

- Implement token refresh logic


## 🎯 **Next Steps**

1. **Update JWT Secret**: Set a secure random string in .env
2. **Start Backend**: `npm run dev`
3. **Test with Postman**: Import the API endpoints
4. **Build Frontend**: Use the examples above
5. **Add Token Storage**: Use localStorage or secure cookies

## 🔗 **Your Available Endpoints**

**Public (No Auth Required):**
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/users` - Browse public profiles
- `PUT /api/auth/profile` - Update profile
- `POST /api/swaps` - Create swap request
- `PUT /api/users/:id/ban` - Ban users
