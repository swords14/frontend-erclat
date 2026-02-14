import React from 'react';
import GifAsset from '../assets/GifAsset'; // Usando o componente de GIF

const BarGif = (props) => {
  return (
    <GifAsset 
      src="/img/bargif.gif" 
      width={250} 
      height={150}
      {...props} 
    />
  );
};
export default BarGif;