import React, { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

/**
 * CustomInputField component
 * Props:
 * - width: string or number (CSS width)
 * - height: string or number (CSS height)
 * - charLimit: number (max character limit)
 * - label: string (optional, label for the input)
 * - asterisk: boolean (optional, if true, show * for required)
 * - note: string (optional, note below the input)
 * - textarea: boolean (optional, if true, render ReactQuill instead of input)
 * - ...rest: other input props (e.g., value, onChange, placeholder, etc.)
 */
const CustomInputField = ( {
  width = '100%',
  height = '40px',
  charLimit = 100,
  label,
  asterisk,
  note,
  textarea = false,
  value: propValue,
  onChange,
  ...rest
} ) => {
  const [ value, setValue ] = useState( propValue || '' );

  // Sync with controlled value
  React.useEffect( () => {
    if ( typeof propValue === 'string' && propValue !== value ) {
      setValue( propValue );
    }
  }, [ propValue ] );

  const handleChange = ( e ) => {
    const newValue = e.target.value.slice( 0, charLimit );
    setValue( newValue );
    if ( onChange ) onChange( e );
  };

  // For ReactQuill
  const handleQuillChange = ( content, delta, source, editor ) => {
    let text = editor.getText();
    if ( text.length > charLimit + 1 ) { // +1 because Quill adds a trailing '\n'
      // Truncate plain text and set as value
      const truncated = text.slice( 0, charLimit );
      // Remove extra chars from HTML content
      // let html = editor.getHTML(); // Remove unused variable
      // Fallback: just set plain text if over limit
      setValue( truncated );
      if ( onChange ) onChange( { target: { value: truncated, name: rest.name } } );
    } else {
      setValue( content );
      if ( onChange ) onChange( { target: { value: content, name: rest.name } } );
    }
  };

  return (
    <div style={ { width } }>
      { label && (
        <label style={ { display: 'block', marginBottom: 4 } }>
          { label } { asterisk && <span style={ { color: 'red' } }>*</span> }
        </label>
      ) }
      { textarea ? (
        <div style={{ marginBottom: 44 }}>
          <ReactQuill
            value={ value }
            onChange={ handleQuillChange }
            style={ { width: '100%', height } }
            maxLength={charLimit}
            { ...rest }
          />
        </div>
      ) : (
        <input
          type="text"
          value={ value }
          onChange={ handleChange }
          maxLength={ charLimit }
          style={ { width: '100%', height, boxSizing: 'border-box', padding: '8px' } }
          { ...rest }
        />
      ) }
      <div className='flex flex-row justify-between mb-1'>
        { note && (
          <div style={ { fontSize: 12, color: '#888', marginTop: 2 } }>{ note }</div>
        ) }
        <div 
          style={{ fontSize: 12, color: (textarea ? (value.replace(/<[^>]+>/g, '').replace(/\n/g, '').length >= charLimit) : (value.length >= charLimit)) ? 'red' : '#666', marginTop: 2 }}
        >
          {textarea
            ? value.replace(/<[^>]+>/g, '').replace(/\n/g, '').length
            : value.length
          } / {charLimit} characters
        </div>
      </div>
    </div>
  );
};

export default CustomInputField; 