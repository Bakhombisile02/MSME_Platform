import AddBusinessForm from "@/components/addBusiness/AddBusinessForm";
import Partners from "@/components/Partners";
import Image from "next/image";

const Page = () => {
  
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="w-full h-[600px] relative">
        <Image src="/images/add_business/add_business_banner.jpg" alt="add-business" fill className="object-center object-cover"/>
      </div>
      
      {/* Add Business Form */}
      <div className="w-full">
        <AddBusinessForm />
      </div>
      {/* partner section */}
      <div className="w-full">
        <Partners />
      </div>
    </div>
  );
};

export default Page