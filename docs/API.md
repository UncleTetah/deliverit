# DeliverIt API

Base URL: `http://localhost:4000/api`

Auth via `Authorization: Bearer <token>`.

## Roles

| Value      | UI label                    | Meaning                              |
|------------|-----------------------------|--------------------------------------|
| `customer` | Request delivery service    | Creates deliveries and tracks them   |
| `courier`  | Provide delivery service    | Accepts jobs, moves packages, earns  |
| `admin`    | *(not self-signup)*         | Full platform access                 |

---

## Auth

### POST /auth/register
```json
{
  "email": "a@b.com",
  "password": "password123",
  "full_name": "Alice",
  "role": "customer"
}