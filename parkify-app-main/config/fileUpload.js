// FileUpload.js
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import toast from 'react-hot-toast';
import supabase from './supabaseClient';

const FileUpload = forwardRef(({ storageBucket, fileName, setFileURL }, ref) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = () => {
        return new Promise(async (resolve, reject) => {
          try {
            setUploading(true);
      
            if (!file) {
              toast.error('Please select a file');
              reject('No file selected');
              return;
            }
      
            const fileExt = file.name.split('.').pop();
            const generatedFileName = fileName || `${Math.random()}.${fileExt}`;
            const filePath = `${generatedFileName}`;
      
            const { data, error } = await supabase
              .storage
              .from(storageBucket)
              .upload(filePath, file);
      
            if (error) throw error;
      
            const { data: urlData, error: urlError } = supabase
              .storage
              .from(storageBucket)
              .getPublicUrl(filePath);
      
            if (urlError) throw urlError;
      
            const publicUrl = urlData.publicUrl;
            toast.success('File uploaded successfully');
            setFileURL(publicUrl);
            resolve(); // Resolve once fileURL is set
          } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Failed to upload file');
            reject(error); // Reject on error
          } finally {
            setUploading(false);
          }
        });
      };
      
    // Expose handleUpload to the parent component via ref
    useImperativeHandle(ref, () => ({
        handleUpload,
    }));

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-100 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-300">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-6 h-6 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                    </div>
                    <input id="dropzone-file" type="file" onChange={handleFileChange} className="hidden" />
                </label>
            </div>
        </div>
    );
});

// Don't forget to export the component
export default FileUpload;
