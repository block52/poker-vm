// components/chakra/NavbarWithCallToAction/NavbarWithCallToAction.tsx

import {
  Box,
  Button,
  ButtonGroup,
  Container,
  HStack,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react';
import { Logo } from '../../Logo';
import { MobileDrawer } from './MobileNavbar';
import { ToggleButton } from './ToggleButton';

import { useNavigate } from 'react-router-dom';

export const NavbarWithCallToAction = () => {
  const isDesktop = useBreakpointValue({ base: false, lg: true });
  const mobileNavbar = useDisclosure();
  // const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleBuyBitcoinClick = () => {
    // navigate(user ? '/buybitcoin' : '/login');
  };

  const handleProfileClick = () => {
    // navigate(user ? '/profiledetails' : '/login');
  };

  const handleMarketPlaceClick = () => {
    // navigate(user ? '/blocks' : '/blocks');
  };

  const handleAuthAction = async () => {
    // if (user) {
    //   await logout();
    //   navigate('/');
    // } else {
    //   navigate('/');
    // }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleEarnClick = () => {
    // navigate(user ? '/earn' : '/earn');
  };

  const handleWalletClick = () => {
    // navigate(user ? '/wallet' : '/login');
  };

  return (
    <Box>
      <Box borderBottomWidth="1px" bg="bg.surface" position="relative" zIndex="tooltip">
        <Container py="4" maxW="6xl">
          <HStack justify="space-between">
            <Box onClick={handleLogoClick} cursor="pointer">
              <Logo />
            </Box>
            {isDesktop ? (
              <HStack spacing="8">
                <ButtonGroup size="lg" variant="text" colorScheme="gray" spacing="8">
                  {/* {user && <Button onClick={handleBuyBitcoinClick}>Buy Bitcoin</Button>} */}
                  {/* <Button onClick={handleMarketPlaceClick}>Explorer</Button> */}
                  {/* <Button onClick={handleEarnClick}>Earn</Button> */}
                  {/* <Button onClick={handleProfileClick}>Profile</Button> */}
                  {/* {user && <Button onClick={handleWalletClick}>Wallet</Button>} */}
                </ButtonGroup>
                {/* <Button
                  onClick={handleAuthAction}
                  bg="blue.500"
                  color="white"
                  _hover={{ bg: "blue.600" }}
                >
                  {user ? 'View Explorer' : 'View Explorer'}
                </Button> */}
              </HStack>
            ) : (
              <>
                <ToggleButton
                  onClick={mobileNavbar.onToggle}
                  isOpen={mobileNavbar.isOpen}
                  aria-label="Open Menu"
                />
                <MobileDrawer isOpen={mobileNavbar.isOpen} onClose={mobileNavbar.onClose} />
              </>
            )}
          </HStack>
        </Container>
      </Box>
    </Box>
  );
};