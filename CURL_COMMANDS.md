# Customer Support Backend API - cURL Commands

## Base URL
```
http://localhost:8000
```

---

## AUTH ENDPOINTS

### 1. Register User
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 2. Login User
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

### 3. Get Current User
```bash
curl -X GET http://localhost:8000/api/v1/auth/current-user \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Logout User
```bash
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## USER ENDPOINTS

### 1. Get All Users
```bash
curl -X GET http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## DATA ENTRY ENDPOINTS

### 1. Create Data Entry
```bash
curl -X POST http://localhost:8000/api/v1/data-entries \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Sample Data Entry" \
  -F "description=This is a sample data entry" \
  -F "image=@/path/to/image.jpg"
```

### 2. Get All Data Entries
```bash
curl -X GET http://localhost:8000/api/v1/data-entries
```

### 3. Get Data Entry by ID
```bash
curl -X GET http://localhost:8000/api/v1/data-entries/ENTRY_ID
```

### 4. Update Data Entry
```bash
curl -X PUT http://localhost:8000/api/v1/data-entries/ENTRY_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Updated Title" \
  -F "description=Updated description" \
  -F "image=@/path/to/image.jpg"
```

### 5. Delete Data Entry
```bash
curl -X DELETE http://localhost:8000/api/v1/data-entries/ENTRY_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## TICKET ENDPOINTS

### 1. Get Ticket Statistics
```bash
curl -X GET http://localhost:8000/api/v1/tickets/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. Create Ticket
```bash
curl -X POST http://localhost:8000/api/v1/tickets \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Support Ticket Title" \
  -F "description=Ticket description with details" \
  -F "priority=high" \
  -F "category=technical" \
  -F "attachments=@/path/to/file1.pdf" \
  -F "attachments=@/path/to/file2.pdf"
```

### 3. Get All Tickets
```bash
curl -X GET "http://localhost:8000/api/v1/tickets?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### With Filtering
```bash
curl -X GET "http://localhost:8000/api/v1/tickets?page=1&limit=10&status=open&priority=high" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Get Ticket by ID
```bash
curl -X GET http://localhost:8000/api/v1/tickets/TICKET_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Update Ticket
```bash
curl -X PUT http://localhost:8000/api/v1/tickets/TICKET_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Updated Ticket Title" \
  -F "description=Updated ticket description" \
  -F "status=resolved" \
  -F "priority=medium" \
  -F "attachments=@/path/to/file.pdf"
```

### 6. Delete Ticket
```bash
curl -X DELETE http://localhost:8000/api/v1/tickets/TICKET_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 7. Add Ticket Message
```bash
curl -X POST http://localhost:8000/api/v1/tickets/TICKET_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "message=This is a response message" \
  -F "attachments=@/path/to/file.pdf"
```

### 8. Get Ticket Messages
```bash
curl -X GET http://localhost:8000/api/v1/tickets/TICKET_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## NOTES

1. **Replace Placeholders:**
   - `YOUR_TOKEN_HERE`: Replace with the JWT token received from login
   - `ENTRY_ID`: Replace with actual data entry ID
   - `TICKET_ID`: Replace with actual ticket ID
   - `/path/to/file.pdf`: Replace with actual file paths

2. **Authentication:**
   - Login first to get a token
   - Use the token in the Authorization header for protected routes

3. **File Upload:**
   - Use `-F` flag for form-data (multipart) requests
   - Use `-F "field=@/path/to/file"` for file uploads

4. **Query Parameters:**
   - Pagination: `page=1&limit=10`
   - Filtering: `status=open&priority=high`

5. **Content Types:**
   - `-H "Content-Type: application/json"` for JSON requests
   - For form-data (files), curl automatically sets the correct header

---

## Testing Workflow

1. **Register/Login**: Get an authentication token
2. **Create Resources**: Create tickets and data entries
3. **Read Resources**: Retrieve tickets and data entries
4. **Update Resources**: Modify existing resources
5. **Delete Resources**: Remove resources as needed

---

## Example Workflow

```bash
# 1. Register a new user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Pass123!","firstName":"Test","lastName":"User"}'

# 2. Login to get token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Pass123!"}'

# 3. Use the token from step 2 in subsequent requests
# Example: Create a ticket
curl -X POST http://localhost:8000/api/v1/tickets \
  -H "Authorization: Bearer <token_from_step_2>" \
  -F "title=My Issue" \
  -F "description=Issue description" \
  -F "priority=high" \
  -F "category=technical"

# 4. Get all tickets
curl -X GET http://localhost:8000/api/v1/tickets \
  -H "Authorization: Bearer <token_from_step_2>"
```

