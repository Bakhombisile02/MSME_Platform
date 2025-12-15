# Schema Change Plan

## Overview
This document outlines the database schema changes required to implement the new MSME registration form fields per the requirements.

## New Fields Required

### MSMEBusiness Table Changes

#### 1. Ownership Type (NEW)
- **Column name**: `ownership_type`
- **Type**: STRING(20)
- **Values**: 'Individual', 'Partnership'
- **Required**: Yes (NOT NULL after migration)
- **Default for migration**: 'Individual'
- **Notes**: Controls how owner gender information is captured

#### 2. Inkhundla (NEW)
- **Column name**: `inkhundla`
- **Type**: STRING(100)
- **Required**: Yes (NOT NULL after migration)
- **Default for migration**: 'Unknown'
- **Notes**: Swaziland administrative division

#### 3. Rural Urban Classification (NEW)
- **Column name**: `rural_urban_classification`
- **Type**: STRING(20)
- **Values**: 'Rural', 'Urban', 'Semi Urban'
- **Required**: Yes (NOT NULL after migration)
- **Default for migration**: 'Unknown'
- **Notes**: Geographic classification

#### 4. Telephone Number (NEW)
- **Column name**: `telephone_number`
- **Type**: STRING(30)
- **Required**: No (NULL allowed)
- **Default**: NULL
- **Notes**: Optional landline number, distinct from mobile contact_number

#### 5. Owner Gender Summary (NEW)
- **Column name**: `owner_gender_summary`
- **Type**: STRING(20)
- **Values**: 'Male', 'Female', 'Both', NULL
- **Required**: No (computed field)
- **Default**: NULL
- **Notes**: Computed from owners table; 'Both' for partnerships with mixed genders

#### 6. Primary Contact Cell Number (RENAME)
- **Current**: `primary_contact_number`
- **Keep as is**: No name change needed in DB, only UI label changes
- **Notes**: UI will show as "Primary Contact Cell Number *"

### New Table: business_owners

Create a new table to handle multiple owners for partnerships.

```sql
CREATE TABLE business_owners (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  business_id BIGINT NOT NULL,
  gender VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (business_id) REFERENCES MSMEBusiness(id) ON DELETE CASCADE,
  INDEX idx_business_id (business_id)
);
```

**Notes**: 
- For Individual ownership: 1 row with the owner's gender
- For Partnership: 2-5 rows with each owner's gender
- Soft delete support (deleted_at for paranoid mode)

### directorsInfos Table Changes

#### 1. Nationality (NEW)
- **Column name**: `nationality`
- **Type**: STRING(20)
- **Values**: 'Swazi', 'Non Swazi'
- **Required**: Yes (NOT NULL after migration)
- **Default for migration**: 'Swazi'
- **Notes**: Required for each director

## Migration Strategy

### Phase 1: Add Columns with Defaults (Safe)

```sql
-- Add new columns to MSMEBusiness with safe defaults
ALTER TABLE MSMEBusiness 
  ADD COLUMN ownership_type VARCHAR(20) DEFAULT 'Individual',
  ADD COLUMN inkhundla VARCHAR(100) DEFAULT 'Unknown',
  ADD COLUMN rural_urban_classification VARCHAR(20) DEFAULT 'Unknown',
  ADD COLUMN telephone_number VARCHAR(30) NULL,
  ADD COLUMN owner_gender_summary VARCHAR(20) NULL;

-- Add nationality to directorsInfos
ALTER TABLE directorsInfos 
  ADD COLUMN nationality VARCHAR(20) DEFAULT 'Swazi';

-- Create business_owners table
CREATE TABLE IF NOT EXISTS business_owners (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  business_id BIGINT NOT NULL,
  gender VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (business_id) REFERENCES MSMEBusiness(id) ON DELETE CASCADE,
  INDEX idx_business_id (business_id)
);
```

### Phase 2: Backfill Data

```sql
-- Migrate existing ownerType (Male/Female) to business_owners table
-- For each existing business with ownerType set:
INSERT INTO business_owners (business_id, gender, created_at, updated_at)
SELECT id, ownerType, created_at, updated_at
FROM MSMEBusiness
WHERE ownerType IS NOT NULL AND ownerType != '';

-- Set owner_gender_summary based on migrated data
UPDATE MSMEBusiness 
SET owner_gender_summary = ownerType
WHERE ownerType IN ('Male', 'Female');

-- Set ownership_type to 'Individual' for all existing records (default already set)
-- No action needed as default handles this

-- Mark records needing review for rural_urban_classification
-- Admin panel should show 'Unknown' values for manual review
```

### Phase 3: Enforce Constraints (After Validation)

```sql
-- Make new required fields NOT NULL after backfill validation
ALTER TABLE MSMEBusiness 
  MODIFY COLUMN ownership_type VARCHAR(20) NOT NULL,
  MODIFY COLUMN inkhundla VARCHAR(100) NOT NULL,
  MODIFY COLUMN rural_urban_classification VARCHAR(20) NOT NULL;

ALTER TABLE directorsInfos 
  MODIFY COLUMN nationality VARCHAR(20) NOT NULL;

-- Optional: Keep ownerType for backward compatibility during transition
-- Later it can be deprecated:
-- ALTER TABLE MSMEBusiness DROP COLUMN ownerType;
```

### Rollback Plan

```sql
-- Reverse Phase 3: Remove constraints
ALTER TABLE MSMEBusiness 
  MODIFY COLUMN ownership_type VARCHAR(20) NULL,
  MODIFY COLUMN inkhundla VARCHAR(100) NULL,
  MODIFY COLUMN rural_urban_classification VARCHAR(20) NULL;

ALTER TABLE directorsInfos 
  MODIFY COLUMN nationality VARCHAR(20) NULL;

-- Reverse Phase 2: No automatic rollback; manual data cleanup if needed

-- Reverse Phase 1: Drop new columns and table
ALTER TABLE MSMEBusiness 
  DROP COLUMN ownership_type,
  DROP COLUMN inkhundla,
  DROP COLUMN rural_urban_classification,
  DROP COLUMN telephone_number,
  DROP COLUMN owner_gender_summary;

ALTER TABLE directorsInfos 
  DROP COLUMN nationality;

DROP TABLE IF EXISTS business_owners;
```

## API Changes

### Request Payload Additions

```json
{
  "ownership_type": "Individual | Partnership",
  "owners": [
    {
      "gender": "Male | Female"
    }
  ],
  "inkhundla": "string",
  "rural_urban_classification": "Rural | Urban | Semi Urban",
  "telephone_number": "string (optional)",
  "directorsInfo": [
    {
      "name": "string",
      "age": "string",
      "gender": "string",
      "qualification": "string",
      "nationality": "Swazi | Non Swazi"
    }
  ]
}
```

### Backend Processing Logic

1. **Validate ownership_type** matches owners array:
   - Individual: Exactly 1 owner
   - Partnership: 2-5 owners

2. **Compute owner_gender_summary**:
   - If all owners are Male: "Male"
   - If all owners are Female: "Female"
   - If mixed: "Both"
   - Server computes this; do not trust client

3. **Validate required fields**:
   - inkhundla must be non-empty
   - rural_urban_classification must be one of the valid values
   - Each director must have nationality

4. **Store owners**:
   - Save business first
   - Insert owner records with business_id FK
   - Update owner_gender_summary on business record

## Testing Checklist

- [ ] Migration runs successfully on empty database
- [ ] Migration runs successfully on database with existing data
- [ ] Backfill correctly migrates ownerType to business_owners
- [ ] Individual ownership: creates 1 owner record
- [ ] Partnership ownership: creates 2-5 owner records
- [ ] owner_gender_summary computed correctly for all cases
- [ ] Director nationality defaults to 'Swazi' for existing records
- [ ] Rollback migration restores original schema
- [ ] API validates ownership_type + owners consistency
- [ ] API validates inkhundla and rural_urban_classification
- [ ] API validates director nationality
- [ ] Telephone number can be NULL/empty
- [ ] Foreign key constraints work correctly
- [ ] Soft delete (paranoid) works on business_owners table

## Database Technology

- **ORM**: Sequelize
- **Database**: MySQL/MariaDB (inferred from SQL syntax)
- **Migration Tool**: Sequelize migrations (to be created)

## File Locations

### Models to Update/Create
- `/root/MSME Full Code Backup/MSME-Backend/models/MSMEBusinessModel.js` - Add new fields
- `/root/MSME Full Code Backup/MSME-Backend/models/DirectorsInfoModel.js` - Add nationality
- `/root/MSME Full Code Backup/MSME-Backend/models/BusinessOwnersModel.js` - NEW FILE

### Controller to Update
- `/root/MSME Full Code Backup/MSME-Backend/controllers/msmeBusiness.contoller.js` - Update add/update logic

### Migration Files to Create
- `/root/MSME Full Code Backup/MSME-Backend/migrations/YYYYMMDDHHMMSS-add-ownership-and-location-fields.js`
- `/root/MSME Full Code Backup/MSME-Backend/migrations/YYYYMMDDHHMMSS-backfill-ownership-data.js`

## Data Validation Rules

### Ownership Type + Owners
```javascript
if (ownership_type === 'Individual') {
  assert(owners.length === 1, 'Individual ownership requires exactly 1 owner');
} else if (ownership_type === 'Partnership') {
  assert(owners.length >= 2 && owners.length <= 5, 'Partnership requires 2-5 owners');
}
```

### Phone Number Formats
- **telephone_number**: Optional, local format (e.g., "2123456" or "+268 2123456")
- **contact_number**: 8 digits numeric (existing validation)
- **primary_contact_number**: 8 digits numeric (existing validation)

### Rural Urban Classification
```javascript
const validClassifications = ['Rural', 'Urban', 'Semi Urban'];
assert(validClassifications.includes(rural_urban_classification));
```

### Director Nationality
```javascript
const validNationalities = ['Swazi', 'Non Swazi'];
assert(validNationalities.includes(nationality));
```

## Notes

1. **Backward Compatibility**: Keep `ownerType` column for now during transition period. Can be deprecated after confirming all systems use new structure.

2. **Gender Summary Computation**: Always compute on server side:
   ```javascript
   const genders = owners.map(o => o.gender);
   const uniqueGenders = [...new Set(genders)];
   const summary = uniqueGenders.length > 1 ? 'Both' : uniqueGenders[0];
   ```

3. **UI State Preservation**: When user switches between Individual and Partnership, preserve entered owners in memory but don't submit invalid data.

4. **Admin Review**: Records with `rural_urban_classification = 'Unknown'` from backfill should be flagged for manual review in admin panel.

5. **Indexing**: Consider adding index on `ownership_type` and `rural_urban_classification` if filtering by these fields is common.
