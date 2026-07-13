# 2026 Payment Codes - Quick Reference

## All 6 Payment Codes for 2026

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     BIOZONE LAB 2026 PAYMENT CODES                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Period 1: February - March 2026                                        │
│  Code:     BZ-FEB2026-A7K9M2P5L1X3                                      │
│  Valid:    2026-02-01 to 2026-03-31                                     │
│                                                                         │
│  Period 2: April - May 2026                                             │
│  Code:     BZ-APR2026-K4T8N1Q6R9S2                                      │
│  Valid:    2026-04-01 to 2026-05-31                                     │
│                                                                         │
│  Period 3: June - July 2026                                             │
│  Code:     BZ-JUN2026-P7L2M5X8Z3V1                                      │
│  Valid:    2026-06-01 to 2026-07-31                                     │
│                                                                         │
│  Period 4: August - September 2026                                      │
│  Code:     BZ-AUG2026-J9H4T6N1K8L5                                      │
│  Valid:    2026-08-01 to 2026-09-30                                     │
│                                                                         │
│  Period 5: October - November 2026                                      │
│  Code:     BZ-OCT2026-W2D5F7G9J3M8                                      │
│  Valid:    2026-10-01 to 2026-11-30                                     │
│                                                                         │
│  Period 6: December 2026                                                │
│  Code:     BZ-DEC2026-C6B1P4V8K2X9                                      │
│  Valid:    2026-12-01 to 2026-12-31                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Copy-Paste Format

```
BZ-FEB2026-A7K9M2P5L1X3
BZ-APR2026-K4T8N1Q6R9S2
BZ-JUN2026-P7L2M5X8Z3V1
BZ-AUG2026-J9H4T6N1K8L5
BZ-OCT2026-W2D5F7G9J3M8
BZ-DEC2026-C6B1P4V8K2X9
```

---

## Distribution Guide

### How to Give Codes to Customers

**For February:**
```
Subject: BIOZONE License Code - Feb/Mar 2026
Body:    Your payment code: BZ-FEB2026-A7K9M2P5L1X3
         Valid: February 1 - March 31, 2026
         Please enter this code in Settings > Payment Verification
```

**For April:**
```
Subject: BIOZONE License Code - Apr/May 2026
Body:    Your payment code: BZ-APR2026-K4T8N1Q6R9S2
         Valid: April 1 - May 31, 2026
         Please enter this code in Settings > Payment Verification
```

**For June:**
```
Subject: BIOZONE License Code - Jun/Jul 2026
Body:    Your payment code: BZ-JUN2026-P7L2M5X8Z3V1
         Valid: June 1 - July 31, 2026
         Please enter this code in Settings > Payment Verification
```

**For August:**
```
Subject: BIOZONE License Code - Aug/Sep 2026
Body:    Your payment code: BZ-AUG2026-J9H4T6N1K8L5
         Valid: August 1 - September 30, 2026
         Please enter this code in Settings > Payment Verification
```

**For October:**
```
Subject: BIOZONE License Code - Oct/Nov 2026
Body:    Your payment code: BZ-OCT2026-W2D5F7G9J3M8
         Valid: October 1 - November 30, 2026
         Please enter this code in Settings > Payment Verification
```

**For December:**
```
Subject: BIOZONE License Code - December 2026
Body:    Your payment code: BZ-DEC2026-C6B1P4V8K2X9
         Valid: December 1 - December 31, 2026
         Please enter this code in Settings > Payment Verification
```

---

## Technical Details

### How Each Code Works
- **Unique:** Each code is different
- **Date-Limited:** Only works during assigned 2-month period
- **One-Time Use:** Can only be used once
- **Tracked:** System records when code was used
- **Stored:** All codes stored in database table

### Database Location
```
Table: payment_codes
Columns:
  - code (BZ-FEB2026-A7K9M2P5L1X3)
  - validFrom (2026-02-01)
  - validUntil (2026-03-31)
  - period (FEB-MAR-2026)
  - licenseType (STANDARD)
  - isUsed (false initially, true after use)
  - usedDate (NULL initially, timestamp after use)
```

### Setup
```bash
# Step 1: Initialize database
python init_db.py

# Step 2: Populate codes
python populate_payment_codes.py

# Step 3: Verify codes were inserted
curl http://127.0.0.1:8000/payment-codes/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Usage Example

### User Perspective

1. **Receives Code:**
   ```
   Email: "Your code: BZ-FEB2026-A7K9M2P5L1X3"
   ```

2. **Opens Settings:**
   ```
   Click Settings → System Status & Payment
   ```

3. **Enters Code:**
   ```
   [Field] BZ-FEB2026-A7K9M2P5L1X3
   [Button] Verify
   ```

4. **System Activates:**
   ```
   ✅ Payment verified!
   System unlocked for 60 days
   Card turns GREEN
   ```

### Admin Perspective

1. **Check Available Codes:**
   ```bash
   curl http://127.0.0.1:8000/payment-codes/ \
     -H "Authorization: Bearer TOKEN"
   ```

2. **See Unused Codes:**
   ```bash
   curl http://127.0.0.1:8000/payment-codes/?includeUsed=false \
     -H "Authorization: Bearer TOKEN"
   ```

3. **Monitor Usage:**
   ```sql
   SELECT code, period, usedDate FROM payment_codes WHERE isUsed = 1;
   ```

4. **Give Customer Code:**
   ```
   Email customer the code for their payment period
   ```

---

## Calendar View - When Each Code Becomes Active

```
JANUARY 2026
Su Mo Tu We Th Fr Sa
             1  2  3
 4  5  6  7  8  9 10
11 12 13 14 15 16 17
18 19 20 21 22 23 24
25 26 27 28 29 30 31
                      ← Use fallback codes

FEBRUARY 2026
Su Mo Tu We Th Fr Sa
 1  2  3  4  5  6  7
 8  9 10 11 12 13 14
15 16 17 18 19 20 21
22 23 24 25 26 27 28
↓ BZ-FEB2026-A7K9M2P5L1X3 ACTIVE ↓

MARCH 2026
Su Mo Tu We Th Fr Sa
 1  2  3  4  5  6  7
 8  9 10 11 12 13 14
15 16 17 18 19 20 21
22 23 24 25 26 27 28
29 30 31
↓ BZ-FEB2026-A7K9M2P5L1X3 ACTIVE ↓

APRIL 2026
Su Mo Tu We Th Fr Sa
          1  2  3  4
 5  6  7  8  9 10 11
12 13 14 15 16 17 18
19 20 21 22 23 24 25
26 27 28 29 30
↓ BZ-APR2026-K4T8N1Q6R9S2 ACTIVE ↓

[Pattern continues through December...]
```

---

## Printable Table

| Date | Month | Code | Valid From | Valid Until |
|------|-------|------|-----------|------------|
| Early 2026 | Feb-Mar | BZ-FEB2026-A7K9M2P5L1X3 | 2026-02-01 | 2026-03-31 |
| Q2 H1 | Apr-May | BZ-APR2026-K4T8N1Q6R9S2 | 2026-04-01 | 2026-05-31 |
| Q2 H2 | Jun-Jul | BZ-JUN2026-P7L2M5X8Z3V1 | 2026-06-01 | 2026-07-31 |
| Q3 | Aug-Sep | BZ-AUG2026-J9H4T6N1K8L5 | 2026-08-01 | 2026-09-30 |
| Q4 H1 | Oct-Nov | BZ-OCT2026-W2D5F7G9J3M8 | 2026-10-01 | 2026-11-30 |
| Q4 H2 | Dec | BZ-DEC2026-C6B1P4V8K2X9 | 2026-12-01 | 2026-12-31 |

---

## Database Setup

### SQL to Create Table
```sql
CREATE TABLE IF NOT EXISTS payment_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR UNIQUE NOT NULL,
    validFrom DATE NOT NULL,
    validUntil DATE NOT NULL,
    period VARCHAR NOT NULL,
    licenseType VARCHAR DEFAULT 'STANDARD',
    isUsed BOOLEAN DEFAULT 0,
    usedDate DATETIME,
    description VARCHAR,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_code ON payment_codes(code);
CREATE INDEX idx_period ON payment_codes(validFrom, validUntil);
```

### SQL to Insert Codes
```sql
INSERT INTO payment_codes (code, validFrom, validUntil, period, licenseType, description)
VALUES
  ('BZ-FEB2026-A7K9M2P5L1X3', '2026-02-01', '2026-03-31', 'FEB-MAR-2026', 'STANDARD', 'Q1 2026'),
  ('BZ-APR2026-K4T8N1Q6R9S2', '2026-04-01', '2026-05-31', 'APR-MAY-2026', 'STANDARD', 'Q2 H1 2026'),
  ('BZ-JUN2026-P7L2M5X8Z3V1', '2026-06-01', '2026-07-31', 'JUN-JUL-2026', 'STANDARD', 'Q2 H2 2026'),
  ('BZ-AUG2026-J9H4T6N1K8L5', '2026-08-01', '2026-09-30', 'AUG-SEP-2026', 'STANDARD', 'Q3 2026'),
  ('BZ-OCT2026-W2D5F7G9J3M8', '2026-10-01', '2026-11-30', 'OCT-NOV-2026', 'STANDARD', 'Q4 H1 2026'),
  ('BZ-DEC2026-C6B1P4V8K2X9', '2026-12-01', '2026-12-31', 'DEC-2026', 'STANDARD', 'Q4 H2 2026');
```

---

## Keys Points to Remember

✅ **Each code is unique**
✅ **Each code is valid for exactly 2 months**
✅ **Each code can only be used once**
✅ **Codes are stored in database**
✅ **System tracks when codes are used**
✅ **Easy to create new codes if needed**
✅ **Works with 60-day payment cycle**
✅ **Automatic date validation**

---

## Need More Codes?

To generate codes for 2027:

```bash
# Edit: generate_payment_codes_2026.py
# Change dates from 2026 to 2027
# Run: python generate_payment_codes_2026.py

# Or create manually via API:
curl -X POST http://127.0.0.1:8000/payment-codes/create/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "BZ-JAN2027-X1Y2Z3A4B5C6",
    "validFrom": "2027-01-01",
    "validUntil": "2027-02-28",
    "period": "JAN-FEB-2027",
    "licenseType": "STANDARD",
    "description": "Q1 2027"
  }'
```

---

## Support

For questions or issues, refer to:
- **Setup:** `DATABASE_PAYMENT_CODES_GUIDE.md`
- **Complete Details:** `DATABASE_PAYMENT_CODES_COMPLETE.md`
- **Original Codes List:** `PAYMENT_CODES_2026.md`

---

**Generated:** January 29, 2026  
**Codes Valid:** Feb 1 - Dec 31, 2026  
**Total Codes:** 6  
**Status:** ✅ READY FOR USE  
