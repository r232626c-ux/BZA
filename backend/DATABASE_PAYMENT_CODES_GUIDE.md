# Database Payment Codes System - Setup & Usage Guide

## What Changed

Previously, payment codes were hardcoded in `config.py` and could be used unlimited times.

Now, payment codes are:
- ✅ **Stored in database** for better management
- ✅ **Date-range validated** (only valid for specific 2-month periods)
- ✅ **One-time use only** (marked as used after verification)
- ✅ **Tracked and audited** (knows who used it and when)
- ✅ **Easy to manage** (create new codes via API or scripts)

---

## System Architecture

### Database Tables
```
payment_codes table:
├─ id (primary key)
├─ code (unique, indexed)
├─ validFrom (start of 2-month period)
├─ validUntil (end of 2-month period)
├─ period (e.g., "FEB-MAR-2026")
├─ licenseType (STANDARD, DEMO, ENTERPRISE)
├─ isUsed (boolean - True after first use)
├─ usedDate (timestamp when code was used)
├─ description (human-readable description)
├─ created_at
└─ updated_at
```

### Verification Flow
```
User enters code
  ↓
POST /system-settings/verify-payment/
  ↓
1. Check database for code matching:
   - Code value matches
   - Today's date is within validFrom-validUntil
   - isUsed = False (not yet used)
  ↓
2. If found:
   ├─ Mark isUsed = True
   ├─ Set usedDate = NOW
   ├─ Update system lastPaymentDate
   └─ Return success
  ↓
3. If not found:
   └─ Fall back to config codes (BIOZONE2024, etc.)
```

---

## Setup Instructions

### Step 1: Update Database Schema
The `payment_codes` table will be created automatically when you run:
```bash
cd backend
python init_db.py
```

Or manually with SQL:
```sql
CREATE TABLE IF NOT EXISTS payment_codes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    code            VARCHAR UNIQUE NOT NULL,
    validFrom       DATE NOT NULL,
    validUntil      DATE NOT NULL,
    period          VARCHAR NOT NULL,
    licenseType     VARCHAR DEFAULT 'STANDARD',
    isUsed          BOOLEAN DEFAULT 0,
    usedDate        DATETIME,
    description     VARCHAR,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_code ON payment_codes(code);
CREATE INDEX idx_valid_period ON payment_codes(validFrom, validUntil);
```

### Step 2: Populate Codes for 2026
```bash
cd backend
python populate_payment_codes.py
```

This script will:
1. Check if codes already exist
2. Insert 6 payment codes (one for each 2-month period)
3. Show summary of inserted codes

### Step 3: Verify in Database
```bash
# List all codes
sqlite3 biozone.db "SELECT code, period, validFrom, validUntil, isUsed FROM payment_codes;"

# Or via API
curl http://127.0.0.1:8000/payment-codes/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## The 6 Payment Codes for 2026

All codes are pre-generated and unique:

| Period | Code | Valid From | Valid Until |
|--------|------|-----------|------------|
| FEB-MAR 2026 | BZ-FEB2026-A7K9M2P5L1X3 | 2026-02-01 | 2026-03-31 |
| APR-MAY 2026 | BZ-APR2026-K4T8N1Q6R9S2 | 2026-04-01 | 2026-05-31 |
| JUN-JUL 2026 | BZ-JUN2026-P7L2M5X8Z3V1 | 2026-06-01 | 2026-07-31 |
| AUG-SEP 2026 | BZ-AUG2026-J9H4T6N1K8L5 | 2026-08-01 | 2026-09-30 |
| OCT-NOV 2026 | BZ-OCT2026-W2D5F7G9J3M8 | 2026-10-01 | 2026-11-30 |
| DEC 2026 | BZ-DEC2026-C6B1P4V8K2X9 | 2026-12-01 | 2026-12-31 |

---

## API Endpoints for Payment Codes

### 1. Get All Payment Codes
```bash
GET /payment-codes/?includeUsed=false
Authorization: Bearer TOKEN

Response:
{
  "codes": [
    {
      "id": 1,
      "code": "BZ-FEB2026-A7K9M2P5L1X3",
      "validFrom": "2026-02-01",
      "validUntil": "2026-03-31",
      "period": "FEB-MAR-2026",
      "licenseType": "STANDARD",
      "isUsed": false,
      "usedDate": null,
      "description": "Q1 2026 License (Feb-Mar)",
      "created_at": "2026-01-29T10:00:00",
      "updated_at": "2026-01-29T10:00:00"
    },
    ...
  ],
  "total": 6,
  "active": 6,
  "used": 0
}
```

### 2. Verify Payment Code
```bash
POST /system-settings/verify-payment/
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "code": "BZ-FEB2026-A7K9M2P5L1X3"
}

Response (Success):
{
  "success": true,
  "message": "Payment verified successfully! (FEB-MAR-2026 - STANDARD). System unlocked for 60 days.",
  "lastPaymentDate": "2026-01-29T10:30:00"
}

Response (Failure):
{
  "success": false,
  "message": "Invalid payment verification code. Please contact your administrator."
}
```

### 3. Create Single Payment Code (Admin)
```bash
POST /payment-codes/create/
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "code": "BZ-JAN2027-X1Y2Z3A4B5C6",
  "validFrom": "2027-01-01",
  "validUntil": "2027-02-28",
  "period": "JAN-FEB-2027",
  "licenseType": "STANDARD",
  "description": "Q1 2027 License"
}

Response:
{
  "id": 7,
  "code": "BZ-JAN2027-X1Y2Z3A4B5C6",
  "validFrom": "2027-01-01",
  "validUntil": "2027-02-28",
  "period": "JAN-FEB-2027",
  "licenseType": "STANDARD",
  "isUsed": false,
  "usedDate": null,
  "description": "Q1 2027 License",
  "created_at": "2026-01-29T11:00:00",
  "updated_at": "2026-01-29T11:00:00"
}
```

### 4. Bulk Create Payment Codes (Admin)
```bash
POST /payment-codes/bulk-create/
Authorization: Bearer TOKEN
Content-Type: application/json

[
  {
    "code": "BZ-JAN2027-X1Y2Z3A4B5C6",
    "validFrom": "2027-01-01",
    "validUntil": "2027-02-28",
    "period": "JAN-FEB-2027",
    "licenseType": "STANDARD",
    "description": "Q1 2027"
  },
  {
    "code": "BZ-MAR2027-P7Q8R9S1T2U3",
    "validFrom": "2027-03-01",
    "validUntil": "2027-04-30",
    "period": "MAR-APR-2027",
    "licenseType": "STANDARD",
    "description": "Q2 2027"
  }
]

Response:
{
  "success": true,
  "created": 2,
  "failed": 0,
  "created_codes": ["BZ-JAN2027-X1Y2Z3A4B5C6", "BZ-MAR2027-P7Q8R9S1T2U3"],
  "failed_codes": []
}
```

---

## Management Commands

### Check Code Status
```bash
# Show all codes and their usage
curl http://127.0.0.1:8000/payment-codes/ \
  -H "Authorization: Bearer TOKEN"

# Show all codes including used ones
curl http://127.0.0.1:8000/payment-codes/?includeUsed=true \
  -H "Authorization: Bearer TOKEN"
```

### Database Queries
```sql
-- See all codes
SELECT id, code, period, validFrom, validUntil, isUsed, usedDate 
FROM payment_codes 
ORDER BY validFrom;

-- See unused codes
SELECT code, period, validFrom, validUntil 
FROM payment_codes 
WHERE isUsed = 0 
ORDER BY validFrom;

-- See used codes with usage dates
SELECT code, period, usedDate, licenseType 
FROM payment_codes 
WHERE isUsed = 1 
ORDER BY usedDate DESC;

-- See codes valid in a specific month
SELECT code, period, validFrom, validUntil 
FROM payment_codes 
WHERE validFrom <= '2026-03-15' AND validUntil >= '2026-03-15';

-- Count statistics
SELECT 
  COUNT(*) as total_codes,
  SUM(CASE WHEN isUsed = 0 THEN 1 ELSE 0 END) as unused,
  SUM(CASE WHEN isUsed = 1 THEN 1 ELSE 0 END) as used
FROM payment_codes;
```

---

## How Codes Work

### Code Lifecycle

```
1. CODE CREATED
   ├─ code: "BZ-FEB2026-A7K9M2P5L1X3"
   ├─ validFrom: 2026-02-01
   ├─ validUntil: 2026-03-31
   ├─ isUsed: false
   └─ usedDate: NULL

2. USER ENTERS CODE (Feb 15, 2026)
   ├─ Code matches ✓
   ├─ Date in range ✓ (2026-02-15 between 2026-02-01 and 2026-03-31)
   ├─ Not yet used ✓ (isUsed = false)
   └─ Verification: SUCCESS

3. CODE MARKED AS USED
   ├─ isUsed: true
   ├─ usedDate: 2026-02-15 10:30:45
   └─ System unlocked for 60 days

4. CODE CANNOT BE USED AGAIN
   ├─ Next use attempt
   ├─ isUsed check fails
   └─ Verification: REJECTED
```

### Valid Date Ranges

```
Today: Jan 29, 2026

Code Status:
FEB-MAR:  Not yet active (starts Feb 1)
APR-MAY:  Not yet active (starts Apr 1)
JUN-JUL:  Not yet active (starts Jun 1)
AUG-SEP:  Not yet active (starts Aug 1)
OCT-NOV:  Not yet active (starts Oct 1)
DEC:      Not yet active (starts Dec 1)

Fallback codes available: BIOZONE2024, DEMO2024, etc.

On Feb 1, 2026:
FEB-MAR:  ACTIVE ✓ (Feb 1 - Mar 31)
Others:   Still waiting

On Apr 1, 2026:
FEB-MAR:  Expired (but still usable if unused)
APR-MAY:  ACTIVE ✓ (Apr 1 - May 31)
```

---

## Advantages of Database System

### 1. **One-Time Use**
```
✓ Each code can only be used once
✓ Prevents sharing of payment codes
✓ Ensures secure licensing
```

### 2. **Date-Based Validation**
```
✓ Codes are only valid for their specific 2-month period
✓ Prevents using old codes
✓ Automatic expiration
```

### 3. **Tracking & Auditing**
```
✓ Know exactly when each code was used
✓ Track which customer has which license period
✓ Compliance and audit trail
```

### 4. **Easy Management**
```
✓ Create new codes via API
✓ Bulk create multiple codes at once
✓ View all codes and usage status
✓ Monitor active and expired codes
```

### 5. **Flexibility**
```
✓ Support for different license types
✓ Custom periods (not just 2 months)
✓ Descriptive code names
✓ Can generate codes for any future period
```

---

## Workflow Example

### Scenario: Customer Payment for Feb-Mar 2026

```
Step 1: Customer makes payment
  └─ You receive payment confirmation

Step 2: Provide code to customer
  └─ Email: "Your payment code: BZ-FEB2026-A7K9M2P5L1X3"

Step 3: Customer enters code
  └─ Opens Settings → Enters code → Clicks Verify

Step 4: System verifies code
  ├─ Checks database
  ├─ Code found and date valid ✓
  ├─ Code not used yet ✓
  └─ Verification SUCCESS

Step 5: System unlocks
  ├─ Marks code as used
  ├─ Records usage time: 2026-02-15 10:30:45
  ├─ Sets system active for 60 days
  └─ Customer can use system

Step 6: Code expires
  ├─ Customer tries to use same code again in May
  ├─ System checks: isUsed = True
  └─ Verification FAILS

Step 7: Provide new code for next period
  └─ Email: "Your new code: BZ-APR2026-K4T8N1Q6R9S2"
```

---

## Migration from Old System

If you had previously used config-based codes:

```
Old system: BIOZONE2024, DEMO2024, etc.
New system: BZ-FEB2026-A7K9M2P5L1X3, etc.

Both systems work together:
1. Check database codes first
2. Fall back to config codes if not in database
3. Config codes have no date restrictions (backward compatible)
4. New codes have full date/usage restrictions
```

---

## Security Notes

✅ **Good practices with this system:**
- Each code is unique (randomly generated)
- Each code can only be used once
- Codes are date-validated (no old codes)
- All usage is tracked with timestamps
- Support different license types
- Database-backed (not hardcoded)

⚠️ **Recommended improvements:**
- Use HTTPS in production
- Hash codes in database (optional)
- Implement rate limiting on verify endpoint
- Log all verification attempts
- Regular backup of payment_codes table
- Monitor for suspicious usage patterns

---

## Troubleshooting

### "Code not found"
```
Possible causes:
1. Code hasn't been inserted into database
   → Run: python populate_payment_codes.py

2. Code is misspelled
   → Check: SELECT code FROM payment_codes;

3. Today is before code's validFrom date
   → Check: Code is only valid after Feb 1, 2026

Solution:
- Verify code exists in database
- Check exact spelling (case-sensitive)
- Confirm today is within valid date range
```

### "Code already used"
```
Message: "Invalid payment verification code"
Reason: isUsed = True (code was already used)

Solutions:
- Provide next period's code
- For same period: Contact support to generate new code
- Cannot reuse same code (by design)
```

### "Date out of range"
```
If today is Jan 29, 2026:
✓ Works: BIOZONE2024 (config code, no date restrictions)
✗ Fails: BZ-FEB2026-A7K9M2P5L1X3 (not yet valid)

Wait until Feb 1, 2026 for FEB2026 code to activate
```

### Create emergency code
```bash
curl -X POST http://127.0.0.1:8000/payment-codes/create/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "BZ-EMERGENCY-20260129",
    "validFrom": "2026-01-29",
    "validUntil": "2026-02-28",
    "period": "EMERGENCY-JAN2026",
    "licenseType": "STANDARD",
    "description": "Emergency code"
  }'
```

---

## Summary

Your payment system now has:

✅ **6 pre-generated codes** for each 2-month period in 2026  
✅ **Database storage** for easy management  
✅ **Date-based validation** for each period  
✅ **One-time use** enforcement  
✅ **Usage tracking** with timestamps  
✅ **Easy API** for management  
✅ **Fallback support** for old config codes  

**Everything is ready to use!**

---

**Setup Date:** January 29, 2026  
**Codes Generated:** 6  
**Valid Through:** December 31, 2026  
**Status:** ✅ READY FOR DEPLOYMENT  
