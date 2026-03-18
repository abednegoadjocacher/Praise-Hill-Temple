import React from 'react';
import Image from 'next/image';

interface MyImageProps {
  className?: string;
}

const ChurchImage = ({ className }: MyImageProps) => {
  return (
  <>
  <Image 
  src="/images/icgc-pht.jpeg" 
  alt="icgc-logo" 
  width={400} 
  height={400}
  priority />
  </>
  );
};

export default ChurchImage;
