The project was created on the Nest framework.
npm istall - install server
npm start - start server
npm run test:e2e - run e2e tests; database must contain a user (test3@mail.com 123456) to obtain the token.

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

POST "api/file/upload" - upload file for contact, contact can have only one file. return contactId and url.
Authorization token required
body {
  contactId: string, (required)
  file: file type (jpg, jpeg, png, webp) (required)
}

GET "api/file/:contactId" - return file data, contactId and url.
Authorization token required

DELETE "api/file/:contactId" - delete file for contact.
Authorization token required

to view the file, use the following formats: server_address/upload/file_url