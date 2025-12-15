# Frontend Form Update Guide

## File: src/components/addBusiness/AddBusinessForm.js

## State Changes

### 1. Add to Initial State (~line 40)

```javascript
const [formData, setFormData] = useState({
    // ... existing fields ...
    organizationName: '',
    
    // NEW FIELDS
    ownershipType: 'Individual',
    owners: [{ gender: '' }],
    inkhundla: '',
    ruralUrbanClassification: '',
    telephoneNumber: '',
    
    // Existing fields continue...
    isRegistered: 'registered',
    // ... rest ...
});
```

### 2. Update initialFormData (~line 60)

```javascript
const initialFormData = {
    // ... existing ...
    ownershipType: 'Individual',
    owners: [{ gender: '' }],
    inkhundla: '',
    ruralUrbanClassification: '',
    telephoneNumber: '',
    // ... rest ...
};
```

## Handler Functions

### 3. Add Ownership Type Handler (after handleInputChange)

```javascript
const handleOwnershipTypeChange = (type) => {
    setFormData(prev => {
        let newOwners;
        if (type === 'Individual') {
            // Keep first owner if exists, otherwise empty
            newOwners = prev.owners[0] ? [prev.owners[0]] : [{ gender: '' }];
        } else {
            // Partnership: ensure at least 2 owners
            if (prev.owners.length < 2) {
                newOwners = [...prev.owners, { gender: '' }];
            } else {
                newOwners = prev.owners;
            }
        }
        return {
            ...prev,
            ownershipType: type,
            owners: newOwners
        };
    });
    
    // Clear validation errors
    setSectionErrors(prev => ({
        ...prev,
        ownershipType: '',
        owners: ''
    }));
};

const handleOwnerGenderChange = (index, gender) => {
    setFormData(prev => {
        const newOwners = [...prev.owners];
        newOwners[index] = { ...newOwners[index], gender };
        return { ...prev, owners: newOwners };
    });
};

const addOwner = () => {
    if (formData.owners.length < 5) {
        setFormData(prev => ({
            ...prev,
            owners: [...prev.owners, { gender: '' }]
        }));
    }
};

const removeOwner = (index) => {
    if (formData.owners.length > 2) {
        setFormData(prev => ({
            ...prev,
            owners: prev.owners.filter((_, i) => i !== index)
        }));
    }
};
```

## Validation Updates

### 4. Update validateSection Function

```javascript
const validateSection = (section) => {
    const errors = {};
    
    if (section === 'status') {
        // Existing validations...
        if (!formData.isRegistered) {
            errors.isRegistered = 'Registration status is required';
        }
        if (!formData.isDisabilityOwned) {
            errors.isDisabilityOwned = 'Disability owned status is required';
        }
        
        // NEW VALIDATIONS
        if (!formData.ownershipType) {
            errors.ownershipType = 'Ownership type is required';
        }
        
        // Validate owners based on ownership type
        if (formData.ownershipType === 'Individual') {
            if (formData.owners.length !== 1) {
                errors.owners = 'Individual ownership requires exactly 1 owner';
            } else if (!formData.owners[0].gender) {
                errors.owners = 'Owner gender is required';
            }
        } else if (formData.ownershipType === 'Partnership') {
            if (formData.owners.length < 2) {
                errors.owners = 'Partnership requires at least 2 owners';
            } else if (formData.owners.length > 5) {
                errors.owners = 'Partnership cannot have more than 5 owners';
            } else {
                // Check each owner has gender
                const missingGender = formData.owners.some(o => !o.gender);
                if (missingGender) {
                    errors.owners = 'All owners must have a gender selected';
                }
            }
        }
        
        // ... existing annual turnover, etc ...
    }
    
    if (section === 'contact') {
        // Existing validations...
        
        // NEW VALIDATIONS
        if (!formData.inkhundla || formData.inkhundla.trim() === '') {
            errors.inkhundla = 'Inkhundla is required';
        }
        
        if (!formData.ruralUrbanClassification) {
            errors.ruralUrbanClassification = 'Rural Urban Classification is required';
        }
        
        // Telephone is optional - no validation needed
    }
    
    if (section === 'directors') {
        // Existing validations...
        
        // NEW: Validate nationality
        formData.directors.forEach((director, index) => {
            if (!director.nationality) {
                errors.directors = `All directors must have a nationality`;
            }
        });
    }
    
    setSectionErrors(errors);
    return Object.keys(errors).length === 0;
};
```

## UI Components

### 5. Business Information Section (~line 800)

**Change label:**
```javascript
<label htmlFor="organizationName" className="...">
    Company/Organization Name *
</label>
```

### 6. Business Status Section - Add Before Owner Gender (~line 1000)

```javascript
{/* NEW: Ownership Type */}
<motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
    <label className="block text-sm font-medium text-gray-700 mb-3">
        Ownership Type *
    </label>
    <div className="flex gap-6">
        <label className="flex items-center space-x-2 cursor-pointer">
            <input
                type="radio"
                name="ownershipType"
                value="Individual"
                checked={formData.ownershipType === 'Individual'}
                onChange={(e) => handleOwnershipTypeChange(e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-700">Individual</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
            <input
                type="radio"
                name="ownershipType"
                value="Partnership"
                checked={formData.ownershipType === 'Partnership'}
                onChange={(e) => handleOwnershipTypeChange(e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-700">Partnership</span>
        </label>
    </div>
    {sectionErrors.ownershipType && (
        <p className="mt-1 text-xs text-red-600">{sectionErrors.ownershipType}</p>
    )}
</motion.div>

{/* NEW: Owner(s) Gender - Conditional Rendering */}
<motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
    <label className="block text-sm font-medium text-gray-700 mb-3">
        Owner(s) Gender *
    </label>
    
    {formData.ownershipType === 'Individual' ? (
        // Single owner for Individual
        <div className="flex gap-6">
            <label className="flex items-center space-x-2 cursor-pointer">
                <input
                    type="radio"
                    name="ownerGender"
                    value="Male"
                    checked={formData.owners[0]?.gender === 'Male'}
                    onChange={() => handleOwnerGenderChange(0, 'Male')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">Male</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
                <input
                    type="radio"
                    name="ownerGender"
                    value="Female"
                    checked={formData.owners[0]?.gender === 'Female'}
                    onChange={() => handleOwnerGenderChange(0, 'Female')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">Female</span>
            </label>
        </div>
    ) : (
        // Multiple owners for Partnership
        <div className="space-y-4">
            {formData.owners.map((owner, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">
                        Owner {index + 1}:
                    </span>
                    <div className="flex gap-4 flex-1">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name={`ownerGender${index}`}
                                value="Male"
                                checked={owner.gender === 'Male'}
                                onChange={() => handleOwnerGenderChange(index, 'Male')}
                                className="w-4 h-4 text-blue-600 border-gray-300"
                            />
                            <span className="text-gray-700">Male</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name={`ownerGender${index}`}
                                value="Female"
                                checked={owner.gender === 'Female'}
                                onChange={() => handleOwnerGenderChange(index, 'Female')}
                                className="w-4 h-4 text-blue-600 border-gray-300"
                            />
                            <span className="text-gray-700">Female</span>
                        </label>
                    </div>
                    {index > 1 && (
                        <button
                            type="button"
                            onClick={() => removeOwner(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                        >
                            Remove
                        </button>
                    )}
                </div>
            ))}
            {formData.owners.length < 5 && (
                <button
                    type="button"
                    onClick={addOwner}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                    + Add Owner
                </button>
            )}
        </div>
    )}
    
    {sectionErrors.owners && (
        <p className="mt-1 text-xs text-red-600">{sectionErrors.owners}</p>
    )}
</motion.div>
```

### 7. Contact Section - Add New Fields (~line 1300)

**After Town field, add:**
```javascript
{/* NEW: Inkhundla */}
<motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
    <label htmlFor="inkhundla" className="block text-sm font-medium text-gray-700 mb-1">
        Inkhundla *
    </label>
    <input
        type="text"
        id="inkhundla"
        name="inkhundla"
        value={formData.inkhundla}
        onChange={handleInputChange}
        required
        className="w-full px-4 py-3 border border-gray-300 rounded-lg..."
        placeholder="Enter inkhundla"
    />
    {sectionErrors.inkhundla && (
        <p className="mt-1 text-xs text-red-600">{sectionErrors.inkhundla}</p>
    )}
</motion.div>
```

**After Region field, add:**
```javascript
{/* NEW: Rural Urban Classification */}
<motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
    <label className="block text-sm font-medium text-gray-700 mb-3">
        Rural Urban Classification *
    </label>
    <div className="flex gap-4">
        {['Rural', 'Urban', 'Semi Urban'].map(classification => (
            <label key={classification} className="flex items-center space-x-2 cursor-pointer">
                <input
                    type="radio"
                    name="ruralUrbanClassification"
                    value={classification}
                    checked={formData.ruralUrbanClassification === classification}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300"
                />
                <span className="text-gray-700">{classification}</span>
            </label>
        ))}
    </div>
    {sectionErrors.ruralUrbanClassification && (
        <p className="mt-1 text-xs text-red-600">{sectionErrors.ruralUrbanClassification}</p>
    )}
</motion.div>

{/* NEW: Telephone Number (Optional) */}
<motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
    <label htmlFor="telephoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
        Telephone Number
    </label>
    <input
        type="text"
        id="telephoneNumber"
        name="telephoneNumber"
        value={formData.telephoneNumber}
        onChange={handleInputChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg..."
        placeholder="Optional landline number"
    />
</motion.div>
```

### 8. Primary Contact Details (~line 1440)

**Change label:**
```javascript
<label htmlFor="primaryContactNumber" className="...">
    Primary Contact Cell Number *
</label>
```

### 9. Directors Section - Add Nationality (~line 1500)

**After Highest Qualification field for each director:**
```javascript
{/* NEW: Nationality */}
<div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
        Nationality *
    </label>
    <div className="flex gap-4">
        <label className="flex items-center space-x-2 cursor-pointer">
            <input
                type="radio"
                name={`directorNationality${index}`}
                value="Swazi"
                checked={director.nationality === 'Swazi'}
                onChange={(e) => handleDirectorChange(index, 'nationality', e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300"
            />
            <span className="text-gray-700">Swazi</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
            <input
                type="radio"
                name={`directorNationality${index}`}
                value="Non Swazi"
                checked={director.nationality === 'Non Swazi'}
                onChange={(e) => handleDirectorChange(index, 'nationality', e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300"
            />
            <span className="text-gray-700">Non Swazi</span>
        </label>
    </div>
</div>
```

## Submit Handler Update

### 10. Update handleSubmit Function

```javascript
const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ... existing validation ...
    
    // Prepare payload
    const payload = {
        name_of_organization: formData.organizationName,
        // ... existing mappings ...
        
        // NEW FIELDS
        ownership_type: formData.ownershipType,
        owners: formData.owners,
        inkhundla: formData.inkhundla,
        rural_urban_classification: formData.ruralUrbanClassification,
        telephone_number: formData.telephoneNumber || null,
        
        directorsInfo: formData.directors.map(d => ({
            name: `${d.firstName} ${d.lastName}`,
            age: d.age,
            gender: d.gender,
            qualification: d.qualification,
            nationality: d.nationality  // NEW
        })),
        
        // ... rest of payload ...
    };
    
    // ... rest of submit logic ...
};
```

## Testing Steps

1. Test Individual ownership with 1 owner
2. Test Partnership ownership with 2-5 owners
3. Test switching between Individual and Partnership
4. Verify owners array persists during switch
5. Test form submission with new fields
6. Test validation for each new required field
7. Test optional telephone number (empty and filled)
8. Test director nationality for each director

## Next Steps

After frontend is complete:
- Run backend migrations
- Test end-to-end flow
- Update preview modal if needed
- Test on mobile responsive layout
