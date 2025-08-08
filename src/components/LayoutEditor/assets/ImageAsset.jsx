import React from 'react';
import { Image } from 'react-konva';
import useImage from 'use-image';

const ImageAsset = ({ src, ...props }) => {
  const [image, status] = useImage(src);

  const width = image ? image.width : 100;
  const height = image ? image.height : 100;

  if (status === 'loading') {
    return null;
  }

  return (
    <Image
      image={image}
      width={width}
      height={height}
      offsetX={width / 2}
      offsetY={height / 2}
      {...props}
    />
  );
};

export default ImageAsset;