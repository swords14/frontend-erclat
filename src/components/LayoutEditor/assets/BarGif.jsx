import React from 'react';
import GifAsset from '../assets/GifAsset'; // Usando o componente de GIF

const BarGif = (props) => {
  // Supondo que o GIF tenha 250px de largura e 150px de altura
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