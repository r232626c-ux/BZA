# BIOZONE LAB 2026 - PAYMENT CODES (6 Periods)

## Overview
Your BIOZONE Lab system now has **6 unique payment codes** for 2026, one for each 2-month period.

- Each code is different and unique
- Each code is valid for exactly 2 months
- Each code can only be used once
- Codes are stored in the database for easy verification
- System automatically marks codes as "Used" after verification

---

## All 2026 Payment Codes

### Period 1: February - March 2026
```
Code:           BZ-FEB2026-A7K9M2P5L1X3
Valid From:     February 1, 2026
Valid Until:    March 31, 2026
License Type:   STANDARD
Description:    Q1 2026 License (Feb-Mar)
```

### Period 2: April - May 2026
```
Code:           BZ-APR2026-K4T8N1Q6R9S2
Valid From:     April 1, 2026
Valid Until:    May 31, 2026
License Type:   STANDARD
Description:    Q2 First Half 2026 License (Apr-May)
```

### Period 3: June - July 2026
```
Code:           BZ-JUN2026-P7L2M5X8Z3V1
Valid From:     June 1, 2026
Valid Until:    July 31, 2026
License Type:   STANDARD
Description:    Q2 Second Half 2026 License (Jun-Jul)
```

### Period 4: August - September 2026
```
Code:           BZ-AUG2026-J9H4T6N1K8L5
Valid From:     August 1, 2026
Valid Until:    September 30, 2026
License Type:   STANDARD
Description:    Q3 2026 License (Aug-Sep)
```

### Period 5: October - November 2026
```
Code:           BZ-OCT2026-W2D5F7G9J3M8
Valid From:     October 1, 2026
Valid Until:    November 30, 2026
License Type:   STANDARD
Description:    Q4 First Half 2026 License (Oct-Nov)
```

### Period 6: December 2026
```
Code:           BZ-DEC2026-C6B1P4V8K2X9
Valid From:     December 1, 2026
Valid Until:    December 31, 2026
License Type:   STANDARD
Description:    Q4 Final Month 2026 License (Dec)
```

---

## How It Works

### Payment Code Format
```
BZ-PERIOD-RANDOMSTRING
├─ BZ = BIOZONE identifier
├─ PERIOD = Month/Year (e.g., FEB2026)
└─ RANDOMSTRING = 12 random alphanumeric characters
```

### Database Storage
Each code is stored in the `payment_codes` table with:
- Unique code
- Valid from date
- Valid until date
- License type (STANDARD, DEMO, ENTERPRISE)
- Description
- isUsed flag (marked True after first use)
- usedDate timestamp

### Verification Process
1. **User enters code** in Settings
2. **Frontend sends code** to backend
3. **Backend checks:**
   - Code exists in database
   - Code is valid for current date range
   - Code hasn't been used yet
4. **On valid code:**
   - Mark code as "Used"
   - Record usedDate timestamp
   - Set system active for 60 days
5. **On invalid code:**
   - Show error message
   - Code remains unused

---

## Setup Instructions

### Step 1: Generate Codes
The codes have already been generated for you! They're all listed above.

### Step 2: Populate Database
```bash
cd backend
python populate_payment_codes.py
```

This will:
- Create the payment_codes table (if not exists)
- Insert all 6 codes into the database
- Show summary of codes added

### Step 3: Verify Codes in Database
```bash
# List all codes
curl http://127.0.0.1:8000/payment-codes/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 4: Distribute to Customers
Give customers the appropriate code for their current period:
- Feb-Mar 2026? → `BZ-FEB2026-A7K9M2P5L1X3`
- Apr-May 2026? → `BZ-APR2026-K4T8N1Q6R9S2`
- etc.

---

## Usage Timeline

```
Timeline:
Jan 29, 2026   → Current date
   ↓
Feb 1, 2026    → Code 1 becomes active (FEB2026 code)
   ↓
Apr 1, 2026    → Code 2 becomes active (APR2026 code)
                  Code 1 expires (still works for old entries)
   ↓
Jun 1, 2026    → Code 3 becomes active (JUN2026 code)
   ↓
Aug 1, 2026    → Code 4 becomes active (AUG2026 code)
   ↓
Oct 1, 2026    → Code 5 becomes active (OCT2026 code)
   ↓
Dec 1, 2026    → Code 6 becomes active (DEC2026 code)
   ↓
Dec 31, 2026   → All codes expire (2026 ends)
```

---

## Database Management

### Check Code Status
```sql
-- See all codes
SELECT code, period, validFrom, validUntil, isUsed, usedDate 
FROM payment_codes;

-- See unused codes
SELECT code, period, validFrom, validUntil 
FROM payment_codes 
WHERE isUsed = 0;

-- See used codes
SELECT code, period, validFrom, usedDate, licenseType 
FROM payment_codes 
WHERE isUsed = 1;
```

### API Endpoints

#### Get All Codes
```bash
GET /payment-codes/
Response: {
  "codes": [...],
  "total": 6,
  "active": 6,
  "used": 0
}
```

#### Get Codes (Including Used)
```bash
GET /payment-codes/?includeUsed=true
```

#### Verify a Code
```bash
POST /system-settings/verify-payment/
Body: {"code": "BZ-FEB2026-A7K9M2P5L1X3"}
```

#### Create New Code (Admin)
```bash
POST /payment-codes/create/
Body: {
  "code": "BZ-JAN2027-X1Y2Z3A4B5C6",
  "validFrom": "2027-01-01",
  "validUntil": "2027-02-28",
  "period": "JAN-FEB-2027",
  "licenseType": "STANDARD",
  "description": "Q1 2027 License"
}
```

#### Bulk Create Codes (Admin)
```bash
POST /payment-codes/bulk-create/
Body: [{code_data1}, {code_data2}, ...]
```

---

## Reference Card

### Print This!
```
BIOZONE LAB 2026 - QUICK REFERENCE
================================================================================

FEB-MAR 2026:  BZ-FEB2026-A7K9M2P5L1X3
APR-MAY 2026:  BZ-APR2026-K4T8N1Q6R9S2
JUN-JUL 2026:  BZ-JUN2026-P7L2M5X8Z3V1
AUG-SEP 2026:  BZ-AUG2026-J9H4T6N1K8L5
OCT-NOV 2026:  BZ-OCT2026-W2D5F7G9J3M8
DEC-2026:      BZ-DEC2026-C6B1P4V8K2X9

Each code:
✓ Valid for 2 months only
✓ Can only be used once
✓ Works offline after first verification
✓ Automatically marked as "Used" after verification

================================================================================
```

---

## Key Points

✅ **6 unique codes** - One for each 2-month period  
✅ **Stored in database** - Easy to verify and track  
✅ **Date-based validation** - Code only works for its period  
✅ **One-time use** - Each code can only be used once  
✅ **Automatic tracking** - System records when code was used  
✅ **Easy distribution** - Just give customer the code for their period  
✅ **Easy creation** - Can generate new codes via API anytime  

---

## Troubleshooting

### "Code is invalid"
- Check code is typed exactly (case-sensitive: use uppercase)
- Verify today's date is within code's valid range
- Check code hasn't been used already
- Ensure database was populated with `populate_payment_codes.py`

### "Code already used"
- Each code can only be used once
- If customer needs renewal, give them next period's code
- Codes are tracked in database with usedDate

### "Code not found in database"
- Run `populate_payment_codes.py` to insert codes
- Or manually create code via POST `/payment-codes/create/`

### Generate new codes
- Use `generate_payment_codes_2026.py` to create more codes
- Or create manually via API endpoint

---

## Files

- **Codes List:** This file (PAYMENT_CODES_2026.md)
- **Generation Script:** `generate_payment_codes_2026.py`
- **Population Script:** `populate_payment_codes.py`
- **Model:** `app/models.py` → PaymentCode class
- **Schema:** `app/schemas.py` → PaymentCodeOut, etc.
- **API:** `app/main.py` → Endpoints for code management

---

## Support

For issues or questions:
1. Check: PAYMENT_SYSTEM_DOCS.md
2. Check: QUICK_REFERENCE.md
3. Verify: Database has payment_codes table
4. Test: Try POST /payment-codes/create/ endpoint

---

**Generated:** January 29, 2026  
**Valid Through:** December 31, 2026  
**Total Codes:** 6  
**Status:** ✅ Ready for distribution  

**All codes are unique and stored in the database for easy verification!** 🎉
