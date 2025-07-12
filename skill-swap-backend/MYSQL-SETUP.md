# MySQL Setup Guide for Skill Swap Backend

## 🐬 **Installing MySQL on Windows**

### **Method 1: MySQL Installer (Recommended)**

1. **Download MySQL Installer**
   - Go to: https://dev.mysql.com/downloads/installer/
   - Download "MySQL Installer for Windows" (mysql-installer-web-community-8.x.x.msi)
   - Choose the web installer (smaller download)

2. **Run MySQL Installer**
   - Run the downloaded `.msi` file as Administrator
   - Choose "Developer Default" setup type
   - Click "Next" through license agreement

3. **Install MySQL Components**
   - MySQL Server 8.0.x
   - MySQL Workbench (GUI tool)
   - MySQL Shell
   - Click "Execute" to download and install

4. **Configure MySQL Server**
   - **Config Type**: Development Computer
   - **Connectivity**: Keep default port 3306
   - **Authentication Method**: "Use Strong Password Encryption"
   - **Root Password**: Set a strong password (remember this!)
     - Example: `mysql123` or `root123`
   - **MySQL User Accounts**: You can create additional users or use root
   - Click "Next" and "Execute"

5. **Complete Installation**
   - Start MySQL Server
   - Click "Finish"

### **Method 2: XAMPP (Easy Alternative)**

If you want an all-in-one solution:

1. **Download XAMPP**
   - Go to: https://www.apachefriends.org/download.html
   - Download XAMPP for Windows

2. **Install XAMPP**
   - Run installer and install to `C:\xampp`
   - Select Apache, MySQL, and phpMyAdmin

3. **Start MySQL**
   - Open XAMPP Control Panel
   - Click "Start" next to MySQL
   - Default root password is empty (no password)

### **Method 3: Docker (Advanced)**

```bash
docker run --name mysql-skillswap -e MYSQL_ROOT_PASSWORD=mysql123 -p 3306:3306 -d mysql:8.0
```

## 🔧 **Post-Installation Setup**

### **Step 1: Verify MySQL Installation**

Open Command Prompt and test:

```bash
mysql --version
```

If command not found, add MySQL to PATH:
- Add `C:\Program Files\MySQL\MySQL Server 8.0\bin` to system PATH

### **Step 2: Connect to MySQL**

```bash
mysql -u root -p
```
Enter your root password when prompted.

### **Step 3: Create Database**

In MySQL command line:

```sql
-- Create the database
CREATE DATABASE skill_swap_db;

-- Create a user for the application (optional)
CREATE USER 'skillswap_user'@'localhost' IDENTIFIED BY 'skillswap123';

-- Grant permissions
GRANT ALL PRIVILEGES ON skill_swap_db.* TO 'skillswap_user'@'localhost';

-- Refresh privileges
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### **Step 4: Update Your .env File**

Update your backend `.env` file with your MySQL credentials:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=skill_swap_db
DB_USER=root
DB_PASSWORD=your_mysql_root_password

# Or if you created a separate user:
# DB_USER=skillswap_user
# DB_PASSWORD=skillswap123
```

### **Step 5: Test Database Connection**

In your skill-swap-backend directory:

```bash
npm run test-setup
```

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **"mysql command not found"**
   - Add MySQL bin directory to system PATH
   - Restart command prompt

2. **"Access denied for user 'root'"**
   - Check your password in .env file
   - Reset MySQL root password if needed

3. **"Can't connect to MySQL server"**
   - Make sure MySQL service is running
   - Check if port 3306 is in use

4. **"Unknown database 'skill_swap_db'"**
   - Create the database using the SQL commands above

### **Reset MySQL Root Password:**

If you forgot your root password:

1. Stop MySQL service
2. Start MySQL with `--skip-grant-tables`
3. Connect without password: `mysql -u root`
4. Reset password:
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
   FLUSH PRIVILEGES;
   ```

## 🛠 **MySQL Workbench (GUI Tool)**

If you installed MySQL Workbench:

1. Open MySQL Workbench
2. Click on "Local instance MySQL80"
3. Enter your root password
4. You can now manage databases visually

## 📊 **Verify Everything Works**

1. **Start your backend:**
   ```bash
   cd skill-swap-backend
   npm run setup-db
   npm run dev
   ```

2. **Check health endpoint:**
   - Visit: http://localhost:5000/health
   - Should return success message

3. **Test database:**
   - The setup-db script will create tables and admin user
   - Check for any error messages

## 🔄 **Key Differences from PostgreSQL**

Your backend has been updated for MySQL:

- ✅ Changed database dialect from 'postgres' to 'mysql'
- ✅ Replaced `pg` and `pg-hstore` with `mysql2`
- ✅ Updated port from 5432 to 3306
- ✅ Converted PostgreSQL arrays to JSON fields
- ✅ Changed `Op.iLike` to `Op.like` (MySQL is case-insensitive by default)
- ✅ Changed `Op.contains` to `Op.like` with JSON pattern matching

## 🚀 **Next Steps**

Once MySQL is set up:

1. Update your `.env` file with correct MySQL credentials
2. Run `npm run setup-db` to create tables and admin user
3. Start development: `npm run dev`
4. Your Skill Swap backend is ready with MySQL!

## 💡 **Pro Tips**

- **Use MySQL Workbench** for easy database management
- **Backup your database** regularly
- **Use environment variables** for different environments (dev/prod)
- **Consider connection pooling** for production (already configured)

Your backend is now fully converted to MySQL! 🎉
