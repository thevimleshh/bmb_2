# Windows Local Execution Guide for BMB (Book My Bus)

This guide walks you step-by-step through running the complete BMB stack locally on your Windows PC:
1. **Local MySQL Database**
2. **Java Spring Boot REST API**
3. **React Vite Frontend**

---

## 1. Prerequisites for Windows

Ensure the following tools are installed on your Windows machine:
1. **Java Development Kit (JDK 17 or higher)**:
   - Download from Oracle or Adoptium Temurin: `https://adoptium.net/temurin/releases/?version=17`
   - Verify in PowerShell/CMD: `java -version` and `javac -version`
2. **Apache Maven (3.8+)**:
   - Download from `https://maven.apache.org/download.cgi`
   - Add Maven `bin` to your Windows Environment Variables `Path`.
   - Verify: `mvn -v`
3. **MySQL Server 8.0+ or XAMPP**:
   - Download MySQL Community Server: `https://dev.mysql.com/downloads/installer/`
   - Alternatively, install **XAMPP** (with MySQL service enabled): `https://www.apachefriends.org/`
4. **Node.js (v18 or v20+) & npm**:
   - Download from `https://nodejs.org/`
   - Verify: `node -v` and `npm -v`

---

## 2. Step 1: Set Up MySQL Database

1. Open **MySQL Workbench**, **XAMPP phpMyAdmin**, or Windows **Command Prompt** (Run as Administrator):
   ```cmd
   mysql -u root -p
   ```
   (Press Enter and supply your MySQL root password, or press Enter if blank in XAMPP).

2. Run the provided schema script located in `/database/schema.sql`:
   ```sql
   SOURCE C:/path/to/project/database/schema.sql;
   ```
   *Or copy and paste the contents of `database/schema.sql` directly into MySQL Workbench / phpMyAdmin SQL tab.*

3. Verify tables were created:
   ```sql
   USE bmb_bus_booking;
   SHOW TABLES;
   SELECT * FROM buses;
   ```

---

## 3. Step 2: Configure and Run Java Spring Boot Backend

The Spring Boot project files are located in `/backend-spring-boot`.

1. Open `/backend-spring-boot/src/main/resources/application.properties` and verify your MySQL credentials:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/bmb_bus_booking?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
   spring.datasource.username=root
   spring.datasource.password=YOUR_MYSQL_PASSWORD

   # JWT Secret Key (min 32 characters)
   jwt.secret=bmb_super_secret_jwt_key_2026_book_my_bus_secure_token_key!

   # Razorpay Test Mode Credentials (get from dashboard.razorpay.com)
   razorpay.key.id=rzp_test_YOUR_KEY_ID
   razorpay.key.secret=YOUR_KEY_SECRET

   server.port=8080
   ```

2. Open Windows Terminal (PowerShell or CMD) and navigate to the Spring Boot folder:
   ```cmd
   cd backend-spring-boot
   ```

3. Build and launch Spring Boot:
   ```cmd
   mvn clean spring-boot:run
   ```
   The backend will start and listen on `http://localhost:8080`.

4. Test that the API is alive:
   Open your browser to:
   `http://localhost:8080/api/buses/cities`
   You should see the JSON array of available departure and destination hubs.

---

## 4. Step 3: Run the React Vite Frontend

1. Open a new Windows Terminal window and navigate to the project root directory:
   ```cmd
   cd C:/path/to/project
   ```

2. Install dependencies:
   ```cmd
   npm install
   ```

3. Start the Vite development server:
   ```cmd
   npm run dev
   ```

4. Open your browser at:
   `http://localhost:3000`

---

## 5. Live Preview vs Windows Execution

- **In AI Studio Preview**: The project includes an integrated Express engine (`server.ts`) that runs directly in the browser environment with live mock databases, real JWT session handlers, and seat locking so you can test all features right away.
- **On Your Windows PC**: You have the complete Java Spring Boot 3 + MySQL codebase in `/backend-spring-boot` connecting directly to your local MySQL instance.

---

## 6. Default Test Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@bmb.com` | `Password123!` |
| **Passenger User** | `rahul@example.com` | `Password123!` |
