import React from 'react';
import { Fingerprint } from 'lucide-react';

// Use lucide-react `Fingerprint` for a crisp icon
export default function FingerprintIcon({ size = 56, className = '' }) {
  return <Fingerprint size={size} className={className} aria-hidden="true" />;
}
