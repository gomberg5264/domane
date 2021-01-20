import theme from '@/theme';
import { ChakraProvider, Container, cookieStorageManager, localStorageManager } from '@chakra-ui/react';
import { GetServerSidePropsContext } from 'next';
import { ReactNode } from 'react';

type WrapperProps = {
  cookies?: string;
  children: ReactNode;
};

export default function Wrapper({ cookies, children }: WrapperProps) {
  const colorModeManager = typeof cookies === 'string' ? cookieStorageManager(cookies) : localStorageManager;

  return (
    <ChakraProvider resetCSS theme={theme} colorModeManager={colorModeManager}>
      <Container>{children}</Container>
    </ChakraProvider>
  );
}

export function getServerSideProps({ req }: GetServerSidePropsContext) {
  return {
    props: {
      cookies: req.headers.cookie ?? '',
    },
  };
}
