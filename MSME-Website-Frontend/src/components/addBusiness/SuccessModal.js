import { FiCheckCircle } from 'react-icons/fi';

const SuccessModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-lg transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/10" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/10" />
          
          {/* Main content */}
          <div className="relative px-8 py-10">
            {/* Success icon */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
              <FiCheckCircle className="h-12 w-12 text-green-500" />
            </div>

            {/* Title */}
            <h3 className="mb-6 text-center text-2xl font-bold text-gray-900">
              Registration Successful!
            </h3>

            {/* Message content */}
            <div className="space-y-4 text-center">
              <p className="text-base text-gray-600">
                Thank you for registering your business on the MSME Platform!
              </p>
              <p className="text-base text-gray-600">
                Your registration request has been successfully submitted to the MSME Admin. Once approved, your business will be automatically listed on the platform.
              </p>
              <p className="text-base text-gray-600">
                You will receive all further updates and notifications via your registered email address.
              </p>
            </div>

            {/* Button */}
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-primary px-8 py-3 text-white transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <span className="relative text-base font-semibold">
                  Ok
                </span>
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-full w-full translate-y-full transform bg-white/20 transition-transform duration-300 group-hover:translate-y-0" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal