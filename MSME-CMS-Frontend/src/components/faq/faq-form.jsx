import Swal from "sweetalert2";
import { createFaq } from "../../api/faq";
import { useState } from "react";
import ReactQuill from "react-quill-new";
import CustomInputField from "../CustomInputField";

const FaqForm = (closeForm) => {
  const [ question, setQuestion ] = useState( '' );
  const [ answer, setAnswer ] = useState( '' );

  const handleSubmit = async( e ) => {
    e.preventDefault();
    const trimmedQuestion = question.trim();
    const trimmedAnswer = answer.trim();
  
    if (trimmedQuestion.length < 3 || trimmedAnswer.length < 3) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Input",
        text: "Question and Answer must be more than 3 characters.",
      });
      return;
    }
  
    if (trimmedQuestion.length >= 700 || trimmedAnswer.length >= 2000) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Input",
        text: "Question and Answer must not exceed 700 and 2000 characters respectively.",
      });
      return;
    }
  
    try {
      const res = await createFaq({ question, answer });
      if (res.status === 201) {
        Swal.fire({
          icon: "success",
          title: "FAQ created successfully!",
          text: "",
        }).then(() => {
          closeForm.closeForm();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "FAQ not created",
          text: res?.data?.error || "Something went wrong",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.error || error.message || "Something went wrong!",
      });
    }
  };
  return <>
    <div className="bg-white shadow-lg text-sm md:text-base lg:text-lg rounded-lg p-4">
        <form onSubmit={ handleSubmit }>
          <div className="mb-4">
            <CustomInputField
              width="100%"
              height="40px"
              charLimit={135}
              label="Question"
              asterisk={true}
              required
              id="question"
              placeholder="Enter Question"
              name="question"
              value={question}
              onChange={( e ) => setQuestion( e.target.value )}
              note="Max 135 characters."
              className="w-full border rounded"
            />
          </div>

          <div className="mb-6 ">
            <CustomInputField
              width="100%"
              height="160px"
              charLimit={600}
              label="Answer"
              asterisk={true}
              textarea= {true}
              required
              placeholder="Enter Answer"
              name="answer"
              value={answer}
              onChange={(e) => setAnswer( e.target.value )}
              note="Max 600 characters."
              className="w-full"
            />
          </div>

          <button className='bg-primary-950 mt-16 shadow-xl shadow-black/30 px-5 py-2 text-white rounded-md font-medium '>
            Submit
          </button>
        </form>
      </div>
  </>;
};
export default FaqForm;