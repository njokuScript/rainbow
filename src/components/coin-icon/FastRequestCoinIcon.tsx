import React, { useCallback } from 'react';
// @ts-ignore
import { CircularProgress } from 'react-native-circular-progress';
import { useTheme } from '../../context/ThemeContext';
import FastRequestVendorLogoIcon from './FastRequestVendorLogoIcon';

const RequestCoinIconSize = 48;

const RequestCoinIcon = ({
  dappName,
  expirationColor,
  imageUrl,
  percentElapsed,
  size = RequestCoinIconSize,
}: {
  dappName: string;
  expirationColor: string;
  imageUrl: string;
  percentElapsed: number;
  size?: number;
}) => {
  const { colors } = useTheme();
  const renderIcon = useCallback(
    // react-native-circular-progress expects a single function child.
    () => (
      <FastRequestVendorLogoIcon
        backgroundColor={colors.white}
        borderRadius={size}
        dappName={dappName}
        imageUrl={imageUrl}
      />
    ),
    [colors.white, dappName, imageUrl, size]
  );

  return (
    <CircularProgress
      childrenContainerStyle={{
        overflow: 'visible',
      }}
      fill={percentElapsed}
      lineCap="round"
      prefill={percentElapsed}
      rotation={0}
      size={size}
      tintColor={expirationColor}
      width={2}
    >
      {renderIcon}
    </CircularProgress>
  );
};

export default React.memo(RequestCoinIcon);
