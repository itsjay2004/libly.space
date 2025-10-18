
'use client';

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import NProgress from 'nprogress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentImportProps {
  updateOnboardingStatus: (status: string) => void;
}

const StudentImport = ({ updateOnboardingStatus }: StudentImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const { user, isLoading: isUserHookLoading } = useUser();
  const supabase = createClient();
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
    const { error } = await supabase.storage.from('student-imports').upload(filePath, file);

    if (error) {
      console.error('Error uploading file:', error);
    } else {
      updateOnboardingStatus('importing');
    }
    NProgress.done();
    setUploading(false);
  };

  const handleSkip = () => {
    updateOnboardingStatus('ready');
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Import Your Student Roster</CardTitle>
        <CardDescription>
          Effortlessly add all your students at once by uploading a spreadsheet file.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <p className="text-sm font-medium">Please ensure your spreadsheet includes the following columns:</p>
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <h4 className="text-md font-semibold">Mandatory Columns:</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li><span className="font-medium">student_name</span></li>
                <li><span className="font-medium">phone_number</span></li>
                <li><span className="font-medium">shift_name</span> (must match an existing shift name from your library setup)</li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold">Recommended Columns:</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li><span className="font-medium">join_date</span> (YYYY-MM-DD)</li>
                <li><span className="font-medium">seat_number</span></li>
                <li><span className="font-medium">student_id_number</span></li>
                <li><span className="font-medium">email</span></li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Columns must be named exactly as listed above. Extra columns will be ignored.</p>
        </div>

        <div
          {...getRootProps()}
          className={cn(
            "p-10 border-2 border-dashed rounded-md text-center transition-all cursor-pointer",
            isDragActive
              ? "border-primary bg-primary/10 text-primary"
              : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-muted-foreground hover:border-primary hover:text-primary"
          )}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex items-center justify-center gap-2 text-primary font-medium">
              <CheckCircle className="h-5 w-5" />
              <span>{file.name}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <FileUp className="h-8 w-8" />
              <p className="font-medium">Drag and drop your file here or click to browse</p>
              <p className="text-sm text-muted-foreground">Supported formats: .xls, .xlsx, .csv</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => updateOnboardingStatus('step1')} disabled={uploading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
            <div className="flex space-x-2">
              <Button variant="ghost" onClick={handleSkip} disabled={uploading}>
                Skip for now
              </Button>
              <Button onClick={handleUpload} disabled={!file || uploading}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploading ? 'Uploading...' : 'Upload and Continue'}
              </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentImport;
