#!/bin/bash

# Script to generate HTTPS certificates for Slack OAuth

CERT_DIR="$HOME/.slack-mcp"
CERT_PATH="$CERT_DIR/localhost.crt"
KEY_PATH="$CERT_DIR/localhost.key"

echo "🔒 Generating HTTPS certificates for Slack OAuth..."

# Create directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Check if certificates already exist
if [ -f "$CERT_PATH" ] && [ -f "$KEY_PATH" ]; then
    echo "✅ Certificates already exist at $CERT_DIR"
    exit 0
fi

# Generate self-signed certificate
if command -v openssl >/dev/null 2>&1; then
    echo "📝 Generating self-signed certificate with OpenSSL..."
    
    openssl req -x509 -newkey rsa:2048 \
        -keyout "$KEY_PATH" \
        -out "$CERT_PATH" \
        -days 365 \
        -nodes \
        -subj "/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
    
    # Set proper permissions
    chmod 600 "$KEY_PATH"
    chmod 644 "$CERT_PATH"
    
    echo "✅ Certificates generated successfully!"
    echo "📁 Certificate: $CERT_PATH"
    echo "🔑 Private key: $KEY_PATH"
    echo ""
    echo "⚠️  Your browser will show a security warning for self-signed certificates."
    echo "    Click 'Advanced' → 'Proceed to localhost (unsafe)' during OAuth."
    
else
    echo "❌ OpenSSL not found. Please install OpenSSL:"
    echo "   macOS: brew install openssl"
    echo "   Ubuntu/Debian: sudo apt-get install openssl"
    echo "   CentOS/RHEL: sudo yum install openssl"
    exit 1
fi