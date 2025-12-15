import instance from "../utils/axios";

// Login User function
const loginUser = async (data) => {
  try {
    const response = await instance.post("admin/login", data);

    const token = response?.data?.token;
    console.log(response)
    if (token) {

      // Set Token in localStorage
      localStorage.setItem("authToken", token);

      // Set default Authorization header for future requests
      instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    return response;
  } catch (error) {
    throw  error;
  }
};

 const signout = (onSuccess) => {
    localStorage.removeItem("authToken");
    if (typeof onSuccess === "function") {
      onSuccess();  
    }
  };
  

export { loginUser ,signout};
