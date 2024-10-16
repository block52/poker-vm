import { HTMLChakraProps, chakra } from '@chakra-ui/react';
import { Image, Text } from '@chakra-ui/react';

export const Logo = (props: HTMLChakraProps<'img'>) => (
  // Use the logo from /logo.png
  <>
    <Text fontSize="2xl" fontWeight="bold">Block52/Explorer</Text>
    {/* <Image
      src="/logo.png"
      alt="Logo"
      height="50px"
      width="auto"
      {...props}
    /> */}

  </>
);

export default Logo;
