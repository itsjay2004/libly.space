
import React from 'react';

const ImportStatusBanner = () => {
  return (
    <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
      <p className="font-bold">Import in Progress</p>
      <p>Your student data is being imported. This can take a few minutes. We will notify you once it's complete.</p>
    </div>
  );
};

export default ImportStatusBanner;
