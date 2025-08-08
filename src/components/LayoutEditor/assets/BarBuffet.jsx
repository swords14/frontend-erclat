import React from 'react';
import { Group, Rect } from 'react-konva';

const BarBuffet = (props) => {
  const width = 220;
  const height = 80;
  const counterColor = '#A0522D';
  const serviceAreaColor = '#D2B48C';

  return (
    <Group {...props} width={width} height={height} offsetX={width/2} offsetY={height/2}>
      {/* Balcão principal */}
      <Rect
        width={width}
        height={height}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: width, y: height }}
        fillLinearGradientColorStops={[0, counterColor, 1, '#8B4513']}
        cornerRadius={5}
        stroke={props.stroke || '#5C4033'}
        strokeWidth={props.strokeWidth}
        shadowColor={props.shadowColor}
        shadowBlur={props.shadowBlur}
        shadowOpacity={props.shadowOpacity}
        shadowOffsetX={props.shadowOffsetX}
        shadowOffsetY={props.shadowOffsetY}
      />
      {/* Área de serviço superior (mais clara) */}
      <Rect
        x={-width / 2 + 10}
        y={-height / 2 + 10}
        width={width - 20}
        height={20}
        fill={serviceAreaColor}
        cornerRadius={3}
      />
      {/* Detalhe frontal */}
      <Rect
        x={-width / 2 + 20}
        y={height / 2 - 15}
        width={width - 40}
        height={15}
        fill="#774229"
        cornerRadius={[0, 0, 3, 3]}
      />
    </Group>
  );
};

export default BarBuffet;