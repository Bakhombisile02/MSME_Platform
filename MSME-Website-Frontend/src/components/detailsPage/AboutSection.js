const AboutSection = ({ businessDetails }) => {
  // Split services and products into arrays
  const services = businessDetails?.service_offered?.split(', ') || [];
  const products = businessDetails?.product_offered?.split(', ') || [];

  return (
    <section className="md:px-4 lg:px-8 py-8 bg-white text-gray-800 rounded-lg shadow-md">
      {/* Business Name and description */}
      <div className="px-4 md:px-0">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold capitalize font-montserrat">
          {businessDetails?.name_of_organization}
        </h1>
        <div className="mt-5">
        <div
            dangerouslySetInnerHTML={{
              __html: (businessDetails?.brief_company_description || '')
                .split('\n\n')
                .map(p => `<p>${p.trim()}</p>`)
                .join('')
            }}
          />

        </div>
      </div>
      <hr className="my-10 text-primary/5" />
      {/* Business Category */}
      <div className="flex flex-col items-start justify-between bg-gray-50/50 p-4 rounded-lg shadow-sm">
        <div className="flex w-full flex-col md:flex-row items-center justify-between">
          <h2 className="text-xl whitespace-nowrap font-semibold">
            Business Category:
          </h2>
          <div className="min-w-fit border-t border-gray-500/20"></div>
          <p className="text-gray-700 text-lg whitespace-nowrap font-semibold italic">{businessDetails?.business_category_name}</p>
        </div>
        {businessDetails.business_sub_category_name && ( 
          <div className="flex w-full flex-col md:flex-row items-center justify-between mt-4">
            <h2 className="text-xl whitespace-nowrap font-semibold">
              Business Sub-Category:
            </h2>
            <div className="min-w-fit border-t border-gray-500/20"></div>
            <p className="text-gray-700 text-lg whitespace-nowrap font-semibold italic">{businessDetails?.business_sub_category_name}</p>
          </div>
        )}
      </div>
      <hr className="my-10 text-primary/5" />
      {/* services and product offered */}
      <div className="flex flex-col px-4 md:px-0">
        {/* Services offered */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold">
            Services Offered
          </h2>
          <div className="flex flex-row flex-wrap w-fit gap-2 mt-4">
            {services.map((service, index) => (
              <div key={index} className="text-gray-700 bg-gray-100/90 text-sm border rounded-md px-4 py-1 shadow-sm hover:shadow-md transition-shadow">
                {service}
              </div>
            ))}
          </div>
        </div>
        {/* Products offered */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold">
            Products Offered
          </h2>
          <div className="flex flex-row flex-wrap w-fit gap-2 mt-4">
            {products.map((product, index) => (
              <div key={index} className="text-gray-700 bg-gray-100/90 text-sm border rounded-md px-4 py-1 shadow-sm hover:shadow-md transition-shadow">
                {product}
              </div>
            ))}
          </div>
        </div>
      </div>
      <hr className="my-10 text-primary/5" />
      {/* Financial Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold px-4 md:px-0">
          Financial Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Year of Establishment */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
            <div className="flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {businessDetails?.establishment_year}
              </div>
              <h3 className="text-lg text-center font-semibold text-gray-700">Year of Establishment</h3>
            </div>
          </div>

          {/* Annual Turnover */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
            <div className="flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-primary mb-2 uppercase">
                {businessDetails?.turnover}
              </div>
              <span className="text-sm text-gray-600 text-center mb-2">
                {businessDetails?.turnover == "micro" ? '(0 - 60,000 SZL)' : 
                 businessDetails?.turnover == "small" ? '(60,000 to 3,000,000 SZL)' : 
                 businessDetails?.turnover == "medium" ? '(3,000,000 to 8,000,000 SZL)' : ''}
              </span>
              <h3 className="text-lg text-center font-semibold text-gray-700">Annual Financial Turnover</h3>
            </div>
          </div>

          {/* Number of Employees */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
            <div className="flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {businessDetails?.employees}
              </div>
              <h3 className="text-lg text-center font-semibold text-gray-700">Number of Employees</h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
};
export default AboutSection