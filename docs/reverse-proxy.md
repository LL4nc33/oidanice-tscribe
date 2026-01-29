[<< Back to README](../README.md)

# Reverse Proxy Setup

TScribe works behind any reverse proxy out of the box. Proxy headers, relative API paths, and flexible CORS are all preconfigured.

## Cloudflare Tunnel (simplest)

```bash
cloudflared tunnel --url http://localhost:3001
```

## Custom Domain with Restricted CORS

```bash
# In .env
TSCRIBE_CORS_ORIGINS=["https://tscribe.yourdomain.com"]
```

## nginx Reverse Proxy

```nginx
server {
    listen 443 ssl;
    server_name tscribe.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
