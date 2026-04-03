import React from 'react';
import Image from 'next/image';

interface MyImageProps {
  className?: string;
}

const ChurchImage = ({ className }: MyImageProps) => {
  return (
  <>
  <Image 
  src="/images/ad-logo.png" 
  alt="ad-logo" 
  width={400} 
  height={400}
  priority />
  </>
  );
};

export default ChurchImage;
