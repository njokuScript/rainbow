import { useRoute } from '@react-navigation/core';
import React, { useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';
import Spinner from '../components/Spinner';
import { Centered, FlexItem } from '../components/layout';
import { reserveWyreOrder } from '../handlers/wyre';
import { StatusBarService } from '../services';
import { useAccountSettings } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';

const Container = styled(FlexItem)({
  backgroundColor: ({ theme: { colors } }) => colors.white,
});

const StyledWebView = styled(WebView)({
  backgroundColor: ({ theme: { colors } }) => colors.white,
});

export default function WyreWebview() {
  const { params } = useRoute();
  const [url, setUrl] = useState(null);
  const { accountAddress, network } = useAccountSettings();

  useEffect(() => {
    StatusBarService.setBackgroundColor('transparent', false);
    StatusBarService.setTranslucent(true);
    StatusBarService.setDarkContent();
  }, []);

  useEffect(() => {
    const getReservationId = async () => {
      const { url } = await reserveWyreOrder(
        params.amount,
        'ETH',
        accountAddress,
        network,
        'debit-card'
      );
      setUrl(url);
    };
    getReservationId();
  }, [accountAddress, network, params.amount]);

  const defaultInputWidth = params.amount?.toString().length > 2 ? 180 : 140;

  const { colors } = useTheme();

  return (
    <Container>
      {url ? (
        <StyledWebView
          injectedJavaScript={`
            document.getElementsByClassName('CloseBtn')[0].style.display = 'none';
            setTimeout(() => {
              document.getElementById('amount').style.width = '${defaultInputWidth}px';
              document.getElementsByName('termsAndConditions')[0].click();
            }, 500);
         `}
          injectedJavaScriptForMainFrameOnly={false}
          source={{ uri: url }}
        />
      ) : (
        <Centered flex={1}>
          <Spinner color={colors.appleBlue} size={30} />
        </Centered>
      )}
    </Container>
  );
}
