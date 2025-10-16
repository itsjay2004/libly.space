
'use client';

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client'; // Use createClient from your local file
import { useUser } from '@/hooks/use-user';
import NProgress from 'nprogress';

interface StudentImportProps {
  updateOnboardingStatus: (status: string) => void;
}

const StudentImport = ({ updateOnboardingStatus }: StudentImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const { user, isLoading: isUserHookLoading } = useUser();
  const supabase = createClient(); // Instantiate client once
  const [uploading, setUploading] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  const handleUpload = async () => {
    if (isUserHookLoading || !user || !user.id) {
      console.error("StudentImport: User not loaded or authenticated. Cannot upload file.", user);
      return;
    }
    if (!file) {
      console.error("StudentImport: No file selected for upload.");
      return;
    }

    NProgress.start();
    setUploading(true);

    // Explicitly get session to ensure the client has it before uploading
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("StudentImport: Error getting session before upload:", sessionError);
      NProgress.done();
      setUploading(false);
      return;
    }

    if (!session || !session.user) {
      console.error("StudentImport: No active session found before upload. RLS policy will likely fail.");
      NProgress.done();
      setUploading(false);
      return;
    }

    const filePath = `${user.id}/${file.name}`;
    console.log("StudentImport: Attempting to upload file to path:", filePath, "for user:", user.id);

    const { error } = await supabase.storage.from('student-imports').upload(filePath, file);

    if (error) {
      console.error('Error uploading file:', error);
    } else {
      console.log("StudentImport: File uploaded successfully. Updating onboarding status to 'importing'.");
      updateOnboardingStatus('importing');
    }
    NProgress.done();
    setUploading(false);
  };

  const handleSkip = () => {
    console.log("StudentImport: Skipping student import. Updating onboarding status to 'completed'.");
    updateOnboardingStatus('completed');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Import Students</h2>
      <p className="text-muted-foreground">Upload a .xls, .xlsx, or .csv file containing your student data. This will help you quickly populate your library.</p>
      <p className="text-sm text-blue-500">Need a template? <a href="#" className="underline">Download our template file here.</a></p>

      <div
        {...getRootProps()}
        className={`p-10 border-2 border-dashed rounded-md text-center cursor-pointer ${
          isDragActive ? 'border-primary' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <p>{file.name}</p>
        ) : (
          <p>Drag 'n' drop your student file here, or click to select a file</p>
        )}
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="ghost" onClick={handleSkip} disabled={uploading}>
          Skip for now
        </Button>
        <Button onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? 'Uploading...' : 'Upload and Continue'}
        </Button>
      </div>
    </div>
  );
};

export default StudentImport;
