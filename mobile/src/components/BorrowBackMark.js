import React from 'react';
import Svg, { Path } from 'react-native-svg';

const BorrowBackMark = ({ size = 40, style }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
    <Path d="M8 19V8h24v8" stroke="#ff493e" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
    <Path d="m27 12 5 5 5-5" stroke="#ff493e" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
    <Path d="M40 29v11H16v-8" stroke="#f4f4f5" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
    <Path d="m21 36-5-5-5 5" stroke="#f4f4f5" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
    <Path d="M13 24h22" stroke="#ff493e" strokeWidth="2" strokeLinecap="square" opacity=".7" />
  </Svg>
);

export default BorrowBackMark;
