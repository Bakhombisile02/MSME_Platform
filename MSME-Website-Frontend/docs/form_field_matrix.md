# MSME Form Field Matrix

## Current Form Fields (Before Changes)

### 1. Business Information Section

| Field Label | Field Name | Type | Required | Source File | Notes |
|------------|-----------|------|----------|-------------|-------|
| Name of Organization * | organizationName | text | Yes | AddBusinessForm.js:~800 | Max 50 chars |
| Brief Company Description * | companyDescription | textarea | Yes | AddBusinessForm.js | Min 50 words |
| Business Category * | businessCategoryId / businessCategoryName | select | Yes | AddBusinessForm.js | |
| Business Sub-Category | businessSubCategoryId / businessSubCategoryName | select | No | AddBusinessForm.js | |
| Services Offered * | servicesOffered | textarea | Yes | AddBusinessForm.js | |
| Products Offered * | productsOffered | textarea | Yes | AddBusinessForm.js | |

### 2. Business Status Section

| Field Label | Field Name | Type | Required | Source File | Notes |
|------------|-----------|------|----------|-------------|-------|
| Registration Status * | isRegistered | radio | Yes | AddBusinessForm.js:~1000 | registered/unregistered |
| Disability Owned * | isDisabilityOwned | radio | Yes | AddBusinessForm.js:~1000 | yes/no |
| Owner's Gender? * | ownerType | radio | Yes | AddBusinessForm.js:~1100 | Male/Female |
| Annual Turnover * | annualTurnover | select | Yes | AddBusinessForm.js:~1100 | micro/small/medium |
| Year of Establishment * | yearOfEstablishment | number | Yes | AddBusinessForm.js:~1100 | |
| Number of Employees * | numberOfEmployees | number | Yes | AddBusinessForm.js:~1100 | |

### 3. Contact Information Section

| Field Label | Field Name | Type | Required | Source File | Notes |
|------------|-----------|------|----------|-------------|-------|
| Email Address * | emailAddress | email | Yes | AddBusinessForm.js:~1200 | Used as login ID |
| Password * | password | password | Yes | AddBusinessForm.js:~1200 | Hidden when logged in |
| Contact Number * | contactNumber | text | Yes | AddBusinessForm.js:~1200 | Max 8 digits, numeric only |
| Street Address * | streetAddress | text | Yes | AddBusinessForm.js:~1300 | Part of address section |
| Town * | town | text | Yes | AddBusinessForm.js:~1300 | |
| Region * | region | select | Yes | AddBusinessForm.js:~1300 | Hhohho/Lubombo/Manzini/Shiselweni |
| Latitude | latitude | text | No | AddBusinessForm.js:~1300 | Google Maps coordinates |
| Longitude | longitude | text | No | AddBusinessForm.js:~1300 | Google Maps coordinates |

### 4. Primary Contact Details Section

| Field Label | Field Name | Type | Required | Source File | Notes |
|------------|-----------|------|----------|-------------|-------|
| First Name * | primaryContactFirstName | text | Yes | AddBusinessForm.js:~1430 | |
| Last Name * | primaryContactLastName | text | Yes | AddBusinessForm.js:~1430 | |
| Contact Number * | primaryContactNumber | text | Yes | AddBusinessForm.js:~1440 | Max 8 digits |

### 5. Directors Information Section

| Field Label | Field Name | Type | Required | Source File | Notes |
|------------|-----------|------|----------|-------------|-------|
| First Name * | directors[i].firstName | text | Yes | AddBusinessForm.js:~1500 | Repeatable, min 1 director |
| Last Name * | directors[i].lastName | text | Yes | AddBusinessForm.js:~1500 | |
| Age * | directors[i].age | select | Yes | AddBusinessForm.js:~1500 | 18-25/25-40/40+ |
| Gender * | directors[i].gender | radio | Yes | AddBusinessForm.js:~1500 | male/female/other, with deselect |
| Highest Qualification * | directors[i].qualification | select | Yes | AddBusinessForm.js:~1500 | High School/Undergraduate/Postgraduate/PHD |

### 6. Required Documents Section

| Field Label | Field Name | Type | Required | Source File | Notes |
|------------|-----------|------|----------|-------------|-------|
| Business Profile Document (PDF) * | businessProfile | file | Yes | AddBusinessForm.js | PDF only |
| Business Image * | businessImage | file | Yes | AddBusinessForm.js | Image file |
| Certificate of Incorporation | certificateOfIncorporation | file | Conditional | AddBusinessForm.js | Required for registered businesses, N/A for unregistered |

## API Contract (Current)

### POST /msme-business/add

**Request Payload:**
```json
{
  "name_of_organization": "string",
  "brief_company_description": "string",
  "business_category_id": "string (default: All)",
  "business_category_name": "string",
  "business_sub_category_id": "string",
  "business_sub_category_name": "string (default: N/A)",
  "service_offered": "string",
  "product_offered": "string",
  "business_type": "string (Registered/Unregistered)",
  "disability_owned": "string (Yes/No)",
  "turnover": "string",
  "ownerType": "string (Male/Female)",
  "establishment_year": "string",
  "employees": "string",
  "contact_number": "string",
  "email_address": "string",
  "street_address": "string",
  "town": "string",
  "region": "string (default: All)",
  "lat": "string",
  "longe": "string",
  "primary_contact_name": "string (firstName + lastName)",
  "primary_contact_number": "string",
  "primary_contact_email": "string",
  "business_profile_url": "string (uploaded file URL)",
  "business_image_url": "string (uploaded file URL)",
  "incorporation_image_url": "string (uploaded file URL)",
  "password": "string",
  "is_verified": "1",
  "directorsInfo": [
    {
      "name": "string (firstName + lastName)",
      "age": "string",
      "gender": "string",
      "qualification": "string"
    }
  ]
}
```

## Database Schema (Current)

### MSMEBusiness Table
- name_of_organization: STRING(70), required
- brief_company_description: TEXT
- business_category_id: BIGINT, required
- business_category_name: STRING(200), required
- business_sub_category_id: BIGINT
- business_sub_category_name: STRING(200)
- service_offered: STRING(600)
- product_offered: STRING(600)
- business_type: STRING(50)
- ownerType: STRING(50)
- disability_owned: STRING(20)
- turnover: STRING(200)
- establishment_year: STRING(20)
- employees: STRING(20)
- contact_number: STRING(50)
- email_address: STRING(200)
- street_address: STRING(300)
- town: STRING(100)
- region: STRING(200)
- primary_contact_name: STRING(200)
- primary_contact_number: STRING(30)
- primary_contact_email: STRING(200)
- lat: STRING(100)
- longe: STRING(100)
- business_profile_url: STRING(600)
- business_image_url: STRING(600)
- incorporation_image_url: STRING(600)
- password: STRING(400)
- is_verified: STRING(20), required

### directorsInfos Table
- id: BIGINT, primary key, auto-increment
- name: STRING(200), required
- age: STRING(20), required
- gender: STRING(20), required
- qualification: STRING(200), required
- business_id: BIGINT, required (FK to MSMEBusiness)
