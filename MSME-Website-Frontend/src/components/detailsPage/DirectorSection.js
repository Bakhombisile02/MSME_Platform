const DirectorSection = ({ directors }) => {
  return (
    <section className="md:px-4 lg:px-8 py-8 bg-white text-gray-800">
      <div className="w-full md:max-w-5xl mx-auto">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-8">
          Directors Information
        </h2>

        <div className="space-y-3 md:space-y-6">
          {directors?.map((director) => (
            <div
              key={director.id}
              className="bg-gradient-to-r from-white to-blue-50 rounded-xl w-full md:p-10 shadow-sm hover:shadow-md md:transition-all md:duration-300 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div className="md:flex-1 py-4 md:py-0 px-2 md:px-0">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800 capitalize">{director.name}</h3>
                  </div>
                  
                  <div className="flex flex-wrap items-center md:gap-6 mt-3 gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Age:</span>
                      <span className="font-medium text-gray-800">{director.age}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Gender:</span>
                      <span className="font-medium text-gray-800 capitalize">{director.gender}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Qualification:</span>
                      <span className="font-medium text-gray-800">{director.qualification}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DirectorSection