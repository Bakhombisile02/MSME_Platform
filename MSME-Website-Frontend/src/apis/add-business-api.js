import instance from "@/utils/axios-instanse";

export const AddNewBusiness = async (business) => {
  const payload = {
    name_of_organization: business.organizationName,
    brief_company_description: business.companyDescription,
    business_category_id: business.businessCategoryId || "All",
    business_sub_category_id: business.businessSubCategoryId,
    business_sub_category_name: business.businessSubCategoryName || "N/A",
    business_category_name: business.businessCategoryName,
    service_offered: business.servicesOffered,
    product_offered: business.productsOffered,
    business_type: business.isRegistered === 'registered' ? 'Registered' : business.isRegistered === 'unregistered' ? 'Unregistered' : '',
    disability_owned: business.isDisabilityOwned === 'yes' ? 'Yes' : business.isDisabilityOwned === 'no' ? 'No' : '',
    turnover: `${business.annualTurnover}` || "",
    ownerType: business.ownerType,
    ownership_type: business.ownershipType ? business.ownershipType.charAt(0).toUpperCase() + business.ownershipType.slice(1) : '',
    owners: (business.owners || []).map(owner => ({
      gender: owner.gender ? owner.gender.charAt(0).toUpperCase() + owner.gender.slice(1).toLowerCase() : ''
    })),
    telephone_number: business.telephoneNumber,
    inkhundla: business.inkhundla,
    rural_urban_classification: business.ruralUrbanClassification,
    establishment_year: business.yearOfEstablishment,
    employees: business.numberOfEmployees.toString(),
    contact_number: business.contactNumber,
    email_address: business.emailAddress,
    street_address: business.streetAddress,
    town: business.town,
    region: business.region || "All",
    lat: business.latitude,
    longe: business.longitude,
    primary_contact_name: `${business.primaryContactFirstName} ${business.primaryContactLastName}`.trim(),
    primary_contact_number: business.primaryContactNumber,
    primary_contact_email: business.primaryContactEmail,
    business_profile_url: business.businessProfileUrl || '',
    business_image_url: business.businessImageUrl || '',
    incorporation_image_url: business.certificateOfIncorporationUrl || '',
    password: business.password,
    is_verified: '1', // Default to not verified
    directorsInfo: business.directors.map(director => ({
      name: `${director.firstName} ${director.lastName}`.trim(),
      age: director.age,
      gender: director.gender,
      qualification: director.qualification,
      nationality: director.nationality
    }))
  };
  
  const response = await instance.post(`/msme-business/add`, payload);
  return response.data;
};

export const updateBusiness = async (id, business) => {
  const payload = {
    name_of_organization: business.organizationName,
    brief_company_description: business.companyDescription,
    business_category_id: business.businessCategoryId,
    business_sub_category_id: business.businessSubCategoryId,
    business_sub_category_name: business.businessSubCategoryName || 'N/A',
    business_category_name: business.businessCategoryName,
    service_offered: business.servicesOffered,
    product_offered: business.productsOffered,
    business_type: business.isRegistered === 'registered' ? 'Registered' : 'Unregistered',
    disability_owned: business.isDisabilityOwned === 'yes' ? 'Yes' : 'No',
    ownerType: business.ownerType,
    ownership_type: business.ownershipType ? business.ownershipType.charAt(0).toUpperCase() + business.ownershipType.slice(1) : '',
    owners: (business.owners || []).map(owner => ({
      gender: owner.gender ? owner.gender.charAt(0).toUpperCase() + owner.gender.slice(1).toLowerCase() : ''
    })),
    telephone_number: business.telephoneNumber,
    inkhundla: business.inkhundla,
    rural_urban_classification: business.ruralUrbanClassification,
    turnover: `${business.annualTurnover}` || '',
    establishment_year: business.yearOfEstablishment,
    employees: business.numberOfEmployees.toString(),
    contact_number: business.contactNumber,
    email_address: business.emailAddress,
    street_address: business.streetAddress,
    town: business.town,
    region: business.region,
    lat: business.latitude,
    longe: business.longitude,
    primary_contact_name: `${business.primaryContactFirstName} ${business.primaryContactLastName}`.trim(),
    primary_contact_number: business.primaryContactNumber,
    primary_contact_email: business.primaryContactEmail,
    business_profile_url: business.businessProfileUrl || '',
    business_image_url: business.businessImageUrl || '',
    incorporation_image_url: business.certificateOfIncorporationUrl || '',
    // password: business.password,
    is_verified: '1', // Default to not verified
    directorsInfo: business.directors.map(director => ({
      name: `${director.firstName} ${director.lastName}`.trim(),
      age: director.age,
      gender: director.gender,
      qualification: director.qualification,
      nationality: director.nationality
    }))
  };
  const response = await instance.put(`/msme-business/update/${id}`, payload);
  return response.data;
};

export const getBusinessDetailsById = async (id) => {
  const response = await instance.get(`/msme-business/msme-details/${id}`);
  return response.data;
};

export const uploadBusinessProfilePdf = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await instance.post("/upload/business-profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });  
  return response;
}

export const uploadBusinessImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await instance.post("/upload/business-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });  
  return response;
}

export const uploadCertificateOfIncorporation = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await instance.post("/upload/incorporation-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response;
}

export const checkEmailExists = async (email) => {
  const response = await instance.get(`/msme-business/check-email-exists/${email}`);
  return response;
}