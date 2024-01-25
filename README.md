The project was created on the Nest framework.

POST "api/auth/register" - user registration, return user email.
body {
  "email": string, (required)
  "password": string (required)
}

POST "api/auth/login" - user login, return jwt token (contain email and id)
body {
  "email": string, (required)
  "password": string (required)
}

POST "api/contact/create" - create new contact for user, need token to request, return new contact with all propertis and id.
Authorization token required
body {
  name: string, (required)
  phone: string, (required)
  address: string (required)
}

GET "api/contact" - return all contacts for user
Authorization token required

GET "api/contact/:id" - return contact by id for user
Authorization token required

PATCH "api/contact/:id" - update contact by id for user and return it
Authorization token required
body {
  name?: string,
  phone?: string,
  address?: string
}

DELETE "api/contact/:id" - delete contact by id for user
Authorization token required