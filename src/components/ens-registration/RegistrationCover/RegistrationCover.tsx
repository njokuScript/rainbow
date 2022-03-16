import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import Spinner from '../../Spinner';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import Skeleton from '../../skeleton/Skeleton';
import {
  Box,
  Cover,
  Text,
  useForegroundColor,
} from '@rainbow-me/design-system';
import {
  useENSRegistration,
  useENSRegistrationForm,
  useSelectImageMenu,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';

export default function RegistrationCover() {
  const {
    images: { coverUrl: initialCoverUrl },
  } = useENSRegistration();
  const {
    isLoading,
    values,
    onBlurField,
    setDisabled,
  } = useENSRegistrationForm();

  const [coverUrl, setCoverUrl] = useState(initialCoverUrl || values?.cover);
  useEffect(() => {
    setCoverUrl(initialCoverUrl || values?.cover);
  }, [initialCoverUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const accentColor = useForegroundColor('accent');

  const { ContextMenu, isUploading } = useSelectImageMenu({
    menuItems: ['library'],
    onChangeImage: ({ image }) => {
      setCoverUrl(image?.path);
    },
    onUploadError: () => {
      setDisabled(false);
    },
    onUploading: ({ image }) => {
      onBlurField({ key: 'cover', value: image.path });
      setDisabled(true);
    },
    onUploadSuccess: ({ data }) => {
      onBlurField({ key: 'cover', value: data.url });
      setDisabled(false);
    },
    uploadToIPFS: true,
  });

  if (isLoading) {
    return (
      <Box height="126px">
        <Skeleton animated>
          <Box background="body" height="126px" />
        </Skeleton>
      </Box>
    );
  }
  return (
    <ContextMenu>
      <ButtonPressAnimation scaleTo={1}>
        <Box
          alignItems="center"
          as={ios ? RadialGradient : View}
          height="126px"
          justifyContent="center"
          {...(ios
            ? {
                colors: [accentColor + '10', accentColor + '33'],
                stops: [0.6, 0],
              }
            : {
                style: { backgroundColor: accentColor + '10' },
              })}
        >
          {coverUrl ? (
            <>
              <Box
                as={ImgixImage}
                height="126px"
                source={{ uri: coverUrl }}
                style={{
                  opacity: isUploading ? 0.3 : 1,
                }}
                width="full"
              />
              {isUploading && (
                <Cover alignHorizontal="center" alignVertical="center">
                  <Spinner
                    color={accentColor}
                    duration={1000}
                    size={'large' as 'large'}
                  />
                </Cover>
              )}
            </>
          ) : (
            <Text color="accent" size="18px" weight="heavy">
              􀣵 Add Cover
            </Text>
          )}
        </Box>
      </ButtonPressAnimation>
    </ContextMenu>
  );
}