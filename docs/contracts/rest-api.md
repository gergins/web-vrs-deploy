# REST API

## `POST /auth/local`

Local prototype authentication for seeded users only.

### Request body

- `userId: string`

### Success response

```json
{
  "ok": true,
  "identity": {
    "userId": "user-signer-1",
    "role": "signer"
  }
}
```

### Error responses

- `400 invalid_request`
- `404 user_not_found`

## Notes

- This route is local-prototype only.
- It does not implement signup, passwords, OAuth, or external identity providers.
- Queue, interpreter, and call pages use the returned identity as the shared HTTP and WebSocket identity source.
