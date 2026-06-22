import React from 'react';
import { Loader } from 'lucide-react';

export default function Spinner({ className = '' }) {
  return <Loader className={`spinner-icon ${className}`} />;
}
