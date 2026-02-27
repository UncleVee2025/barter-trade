# Barter Trade Namibia - Voucher System Integration Guide

## Overview

This document provides comprehensive guidance for the voucher generation, storage, and redemption system used in the Barter Trade Namibia platform. The system is designed for production deployment on cPanel with MySQL.

## System Architecture

\`\`\`
┌───────��─────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                              │
│  ┌��────────────────────────────���───────────────────────────┐   │
│  ���  Voucher Generation Interface                            │   │
│  │  - Select denomination (N$10 - N$1000)                  │   │
│  │  - Specify quantity (1-1000)                            │   │
│  │  - Set expiry period                                    │   │
│  │  - Generate batch                                       │   │
│  └──────────────��──────────────────────────────────────────┘   │
└────────────────────────┬─────────────��──────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MySQL DATABASE                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  vouchers table                                          │   │
│  │  - id (UUID)                                            │   │
│  │  - code (10-digit NUMERIC, UNIQUE)                      │   │
│  │  - amount (DECIMAL)                                     │   │
│  │  - status (available/redeemed/expired/cancelled)        │   │
│  │  - created_by, redeemed_by, expires_at                  │   │
│  └─────────────────────���─────────────────────────────────���─┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
┌─────────���───────────┐     ┌─────────────────────────────────────┐
│   VENDOR SALES      │     │        USER DASHBOARD                │
│  ┌───────────────┐  │     │  ┌─────────────────────────────────┐│
│  │ Hard Vouchers │  │     │  │  Wallet Top-up                  ││
│  │ (Scratch Card)│  │     │  │  - Enter 10-digit numeric code  ││
│  │               │  │     │  │  - Real-time validation         ││
│  │ ┌───────────┐ │  │     │  │  - Instant balance credit       ││
│  │ │1234567890 │ │  │     │  └─────────────────────────────────┘│
│  │ │   N$50    │ │  │     └─────────────────────────────────────┘
│  │ └───────────┘ │  │
│  └────────────��──┘  │
└─────────────────────┘
\`\`\`

## Voucher Code Specifications

### Format Requirements
- **Length**: Exactly 10 digits
- **Characters**: Numeric only (0-9)
- **First Digit**: 1-9 (no leading zeros for readability)
- **Example**: `1234567890`, `5000000001`, `9876543210`

### Why Numeric-Only Codes?
1. **Easy Entry**: Users can quickly input on mobile numeric keypads
2. **Vendor Friendly**: Simple to communicate verbally
3. **Print Compatible**: Works well on scratch cards and receipts
4. **Error Reduction**: No confusion between O/0 or I/1/l characters

## Database Configuration

### Environment Variables
\`\`\`env
# MySQL Connection (cPanel hosted)
MYSQL_HOST=localhost
MYSQL_USER=barter_trade
MYSQL_PASSWORD=Freedom@2025
MYSQL_DATABASE=barter_trade

# Authentication
JWT_SECRET=my_super_secret_key_2026

# Socket Configuration (optional)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_SOCKET=false
\`\`\`

### Voucher Table Schema
\`\`\`sql
CREATE TABLE vouchers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(10) NOT NULL UNIQUE,       -- 10-digit numeric
    amount DECIMAL(15, 2) NOT NULL,
    status ENUM('available', 'redeemed', 'expired', 'cancelled') DEFAULT 'available',
    created_by VARCHAR(36) NOT NULL,
    redeemed_by VARCHAR(36),
    redeemed_at DATETIME,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_code (code),
    INDEX idx_status (status),
    INDEX idx_expires (expires_at)
);
\`\`\`

## Admin Voucher Generation

### API Endpoint
**POST** `/api/admin/vouchers`

### Request Body
\`\`\`json
{
  "amount": 50,        // N$10, N$20, N$50, N$100, N$200, N$500, N$1000
  "quantity": 100,     // 1-1000 vouchers per batch
  "expiryDays": 365    // Days until expiration
}
\`\`\`

### Response
\`\`\`json
{
  "success": true,
  "vouchers": [
    { "id": "uuid", "code": "1234567890", "amount": 50, "expiresAt": "2027-01-28" }
  ],
  "message": "100 voucher(s) created with total value N$5,000"
}
\`\`\`

### Code Generation Algorithm
\`\`\`javascript
function generateVoucherCode(): string {
  const array = new Uint8Array(10)
  crypto.getRandomValues(array)
  
  let code = ""
  for (let i = 0; i < 10; i++) {
    code += (array[i] % 10).toString()
  }
  
  // Ensure first digit is 1-9
  if (code.charAt(0) === "0") {
    code = ((array[0] % 9) + 1).toString() + code.slice(1)
  }
  
  return code
}
\`\`\`

## User Voucher Redemption

### API Endpoint
**POST** `/api/wallet/voucher`

### Request Body
\`\`\`json
{
  "code": "1234567890"
}
\`\`\`

### Validation Process
1. **Format Check**: Must be 10 numeric digits
2. **Existence Check**: Code must exist in database
3. **Status Check**: Must be "available"
4. **Expiry Check**: Must not be past expiration date
5. **Atomic Update**: Transaction ensures balance + voucher update together

### Response (Success)
\`\`\`json
{
  "success": true,
  "amount": 50,
  "newBalance": 550,
  "transaction": {
    "id": "tx-uuid",
    "type": "voucher",
    "amount": 50,
    "status": "completed"
  },
  "message": "N$50.00 voucher redeemed successfully!"
}
\`\`\`

## Security Best Practices

### 1. Input Validation
\`\`\`javascript
// Sanitize voucher code input
function sanitizeVoucherCode(code: string): string {
  return code.replace(/[^0-9]/g, "").slice(0, 10)
}

// Validate format
function isValidVoucherFormat(code: string): boolean {
  return /^\d{10}$/.test(code)
}
\`\`\`

### 2. SQL Injection Prevention
- All database queries use parameterized statements
- No string concatenation in SQL queries
- Input sanitization before any database operations

### 3. Transaction Safety
\`\`\`sql
START TRANSACTION;
-- Lock voucher row
SELECT * FROM vouchers WHERE code = ? FOR UPDATE;
-- Verify status and expiry
-- Update user balance
-- Mark voucher as redeemed
-- Create transaction record
COMMIT;
\`\`\`

### 4. Rate Limiting
- Implement rate limiting on redemption endpoint
- Track failed attempts per user/IP
- Temporary lockout after multiple failures

### 5. Audit Trail
Every voucher operation is logged:
- Creation (admin, batch size, total value)
- Redemption (user, amount, timestamp)
- Cancellation (admin, reason)
- Expiration (automated, count)

## Vendor Distribution Process

### Physical Voucher Cards
1. Admin generates batch of vouchers in dashboard
2. Export voucher codes as CSV/PDF
3. Print on scratch cards with codes hidden
4. Distribute to authorized vendors
5. Vendors sell cards to customers

### Digital Distribution
1. Admin generates vouchers
2. Export codes to vendor system
3. Vendor sends code via SMS/WhatsApp to customer
4. Customer redeems in app wallet

## Monitoring and Reporting

### Dashboard Statistics
- Total vouchers (by status)
- Available value outstanding
- Redeemed value (daily/monthly)
- Expiring soon alerts
- Usage by denomination

### SQL Queries for Reports
\`\`\`sql
-- Daily redemption report
SELECT 
    DATE(redeemed_at) as date,
    amount as denomination,
    COUNT(*) as count,
    SUM(amount) as total_value
FROM vouchers
WHERE status = 'redeemed'
AND redeemed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(redeemed_at), amount
ORDER BY date DESC;

-- Outstanding voucher value by expiry
SELECT 
    CASE 
        WHEN expires_at < DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'Expires in 30 days'
        WHEN expires_at < DATE_ADD(NOW(), INTERVAL 90 DAY) THEN 'Expires in 90 days'
        ELSE 'Expires later'
    END as expiry_window,
    COUNT(*) as count,
    SUM(amount) as total_value
FROM vouchers
WHERE status = 'available'
GROUP BY expiry_window;
\`\`\`

## Scheduled Maintenance

### Daily Cron Job (cPanel)
\`\`\`bash
# Run at midnight to expire old vouchers
0 0 * * * mysql -u barter_trade -p'Freedom@2025' barter_trade -e "CALL ExpireOldVouchers();"
\`\`\`

### Weekly Report
\`\`\`bash
# Generate weekly voucher statistics
0 9 * * 1 mysql -u barter_trade -p'Freedom@2025' barter_trade -e "CALL GetVoucherStats();" > /home/user/reports/voucher-stats-$(date +%Y%m%d).txt
\`\`\`

## Troubleshooting

### Common Issues

1. **"Invalid voucher code"**
   - Check code is exactly 10 digits
   - Verify no leading/trailing spaces
   - Confirm code exists in database

2. **"Voucher already redeemed"**
   - Check `redeemed_by` and `redeemed_at` fields
   - Review transaction history

3. **"Voucher expired"**
   - Check `expires_at` against current time
   - Consider timezone differences

4. **Database Connection Issues**
   - Verify MySQL credentials in environment
   - Check cPanel database user permissions
   - Confirm database exists and tables are created

### Debug Logging
Enable debug mode by checking server logs for `[v0]` prefixed messages:
\`\`\`
[v0] Database Mode: MySQL
[v0] MySQL Host: localhost
[v0] MySQL Database: barter_trade
\`\`\`

## Production Deployment Checklist

- [ ] Run `complete-database-setup.sql` to create all tables
- [ ] Run `production-voucher-system.sql` for stored procedures
- [ ] Set up cron job for voucher expiration
- [ ] Configure environment variables
- [ ] Test voucher generation as admin
- [ ] Test voucher redemption as user
- [ ] Verify transaction records created
- [ ] Set up monitoring alerts
- [ ] Document vendor distribution process
