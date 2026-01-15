const ContactSection = ( { businessDetails } ) => {
  const latitude = businessDetails?.lat || -26.3054;
  const longitude = businessDetails?.longe || 31.1367;
  const embedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=14&output=embed`;
  const mapUrl = `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${latitude},${longitude}&zoom=14&maptype=roadmap`;
  return (
    <section className="px-4 md:px-8 py-8 bg-white text-gray-800">
      {/* Heading */ }
      <h2 className="text-3xl font-semibold mb-4">
        <span className="">Get in Touch</span>
      </h2>

      {/* Google Map */ }
      <div className="w-full h-[23rem] mb-12 rounded-lg overflow-hidden">
        <iframe
          className="w-full h-full"
          src={ embedUrl }
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>

      {/* Contact Info */ }
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
        {/* Phone */ }
        <div className="flex items-center  gap-5 border-b border-primary/40">
          <p className="text-primary font-semibold mb-1">Phone:</p>
          <p className="text-gray-600">{ businessDetails?.contact_number }</p>
        </div>

        {/* Email */ }
        <div className="flex items-center  gap-5 border-b border-primary/40">
          <p className="text-primary font-semibold mb-1">Email:</p>
          <p className="text-gray-600">{ businessDetails?.email_address }</p>
        </div>

        {/* Address */ }
        <div className="flex col-span-2 items-center  gap-5 border-b border-primary/40">
          <p className="text-primary font-semibold mb-1">Street Address:</p>
          <p className="text-gray-600">{ businessDetails?.street_address }</p>
        </div>
        <div className="flex items-center  gap-5 border-b border-primary/40">
          <p className="text-primary font-semibold mb-1">Town:</p>
          <p className="text-gray-600">{ businessDetails?.town }</p>
        </div>
        <div className="flex items-center  gap-5 border-b border-primary/40">
          <p className="text-primary font-semibold mb-1">Region:</p>
          <p className="text-gray-600">{ businessDetails?.region }</p>
        </div>
      </div>
    </section>
  );
};

export default ContactSection