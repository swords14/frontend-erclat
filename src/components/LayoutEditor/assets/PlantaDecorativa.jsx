import React from 'react';
import { Group, Circle, Rect, Ellipse } from 'react-konva';

const PlantaDecorativa = (props) => {
  const size = 40;
  const potColor = '#C04000';
  const leafColor1 = '#228B22';
  const leafColor2 = '#3CB371';

  return (
    <Group {...props} width={size * 1.5} height={size * 2} offsetX={size * 0.75} offsetY={size}>
      {/* Vaso */}
      <Rect
        x={-size / 2}
        y={size / 2}
        width={size}
        height={size}
        fill={potColor}
        cornerRadius={size / 4}
      />
      {/* Base do vaso */}
      <Ellipse
        x={0}
        y={size}
        radiusX={size / 2}
        radiusY={size / 4}
        fill="#8B0000"
      />
      {/* Folhas */}
      <Ellipse
        x={0}
        y={-size / 4}
        radiusX={size / 2}
        radiusY={size / 3}
        fill={leafColor1}
        rotation={30}
      />
      <Ellipse
        x={0}
        y={-size / 4}
        radiusX={size / 2}
        radiusY={size / 3}
        fill={leafColor2}
        rotation={-30}
      />
      <Circle
        x={0}
        y={-size / 2}
        radius={size / 3}
        fill={leafColor1}
      />
    </Group>
  );
};

export default PlantaDecorativa;