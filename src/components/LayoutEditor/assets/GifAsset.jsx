import React, { useRef } from 'react';
import { Image } from 'react-konva';

const GifAsset = ({ src, ...props }) => {
  const imageRef = useRef(null);

  return (
    <Image
      image={new window.Image()}
      src={src}
      ref={imageRef}
      offsetX={props.width / 2}
      offsetY={props.height / 2}
      {...props}
    />
  );
};

export default GifAsset;
