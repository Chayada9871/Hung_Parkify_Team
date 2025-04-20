// config/FileUploadPro.js
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import toast from 'react-hot-toast';

const FileUploadPro = forwardRef(({ storageBucket = 'lessor_image', lessorId, oldImagePath }, ref) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        try {
            setUploading(true);
            if (!file) {
                toast.error('Please select a file');
                return null;
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('storageBucket', storageBucket);
            formData.append('lessorId', lessorId); // Link file to lessor if needed
            if (oldImagePath) formData.append('oldImagePath', oldImagePath); // Optional: delete old image

            const response = await fetch('/api/uploadLessorPic', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'File upload failed');

            toast.success('File uploaded successfully');
            return result.publicUrl; // Return the public URL for use in parent component
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Failed to upload file');
            return null;
        } finally {
            setUploading(false);
        }
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
                        <p className="text-xs text-gray-500">SVG, PNG, JPG, or GIF (MAX. 800x400px)</p>
                    </div>
                    <input id="dropzone-file" type="file" onChange={handleFileChange} className="hidden" />
                </label>
            </div>
            {uploading && <p>Uploading...</p>}
        </div>
    );
});

export default FileUploadPro;
