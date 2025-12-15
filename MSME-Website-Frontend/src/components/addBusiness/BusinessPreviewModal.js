import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const BusinessPreviewModal = ({ isOpen, onClose, formData, onConfirm }) => {
  if (!isOpen) return null;

  const sections = [
    {
      title: 'Business Information',
      fields: [
        { label: 'Organization Name', value: formData.organizationName },
        { label: '', value: '' },
        { label: 'Company Description', value: formData.companyDescription },
        { label: 'Business Category', value: formData.businessCategoryName },
        { label: 'Business Sub-Category', value: formData.businessSubCategoryName ? formData.businessSubCategoryName : 'N/A' },
        { label: 'Services Offered', value: formData.servicesOffered },
        { label: 'Products Offered', value: formData.productsOffered },
      ]
    },
    {
      title: 'Business Status',
      fields: [
        { label: 'Registration Status', value: formData.isRegistered === 'registered' ? 'Registered' : 'Unregistered' },
        { label: 'Disability-Owned', value: formData.isDisabilityOwned === 'yes' ? 'Yes' : 'No' },
        { label: 'Owner Type', value: formData.ownerType },
        { label: 'Year of Establishment', value: formData.yearOfEstablishment },
        { label: 'Number of Employees', value: formData.numberOfEmployees },
        { label: 'Annual Turnover', value: `${formData.annualTurnover.toLocaleString() == 'micro' ? 'Micro: 0 - 60,000 SZL' : formData.annualTurnover.toLocaleString() == 'small' ? 'Small: 60,000 - 3,000,000 SZL' : formData.annualTurnover.toLocaleString() == 'medium' ? 'Medium: 3,000,000 - 8,000,000 SZL' :  formData.annualTurnover.toLocaleString()}` },
      ]
    },
    {
      title: 'Contact Information',
      fields: [
        { label: 'Contact Number', value: formData.contactNumber },
        { label: 'Email Address', value: formData.emailAddress },
        { label: 'Street Address', value: formData.streetAddress },
        { label: 'Town', value: formData.town },
        { label: 'Region', value: formData.region },
        { label: 'Latitude', value: formData.latitude },
        { label: 'Longitude', value: formData.longitude },
      ]
    },
    {
      title: 'Primary Contact',
      fields: [
        { label: 'Full Name', value: `${formData.primaryContactFirstName} ${formData.primaryContactLastName}` },
        { label: 'Contact Number', value: formData.primaryContactNumber },
        { label: 'Email', value: formData.primaryContactEmail },
      ]
    },
    {
      title: 'Directors',
      fields: formData.directors.map((director, index) => ({
        label: `Director ${index + 1}`,
        value: `${director.firstName} ${director.lastName} | Qualification: ${director.qualification || 'N/A'} </br> Age: ${director.age || 'N/A'} | Gender: ${director.gender || 'N/A'}`
      }))
    }
  ];

  // Document section (if any document URLs are present)
  const documentFields = [];
  if (formData.businessProfileUrl) {
    documentFields.push({ label: 'Business Profile', value: <a href={formData.businessProfileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Document</a> });
  }
  if (formData.businessImageUrl) {
    documentFields.push({ label: 'Business Image', value: <a href={formData.businessImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Image</a> });
  }
  if (formData.certificateOfIncorporationUrl) {
    documentFields.push({ label: 'Certificate of Incorporation', value: <a href={formData.certificateOfIncorporationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Document</a> });
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-500/20 backdrop-blur-sm bg-opacity-50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900">Business Details Preview</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <FiX className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {sections.map((section, index) => (
              <div key={index} className="space-y-4">
                <h3 className="text-xl font-medium text-gray-900 border-b pb-2">
                  {section.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.fields.map((field, fieldIndex) => (
                    <div key={fieldIndex} className={`space-y-1 ${field.label == "Company Description" && "col-span-2"}`}>
                      <p className="text-sm font-medium text-gray-500">{field.label}</p>
                      <p className="text-base text-gray-900" dangerouslySetInnerHTML={{ __html: field.value }} ></p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {documentFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-gray-900 border-b pb-2">Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documentFields.map((field, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">{field.label}</p>
                      <p className="text-base text-gray-900">{field.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Handle form submission here
                onConfirm();
              }}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              Confirm & Submit
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BusinessPreviewModal