import React from 'react';
import { Button, Drawer, DrawerBody, DrawerContent, DrawerProps, Spacer, Stack } from '@chakra-ui/react';

import { useNavigate } from 'react-router-dom';

export const MobileDrawer = (props: Omit<DrawerProps, 'children'>) => {

  const navigate = useNavigate();






  const handleAuthAction = async () => {
    // if (user) {
    //   await logout();
    //   navigate('/blocks');
    // } else {
    //   navigate('/blocks');
    // }
    // props.onClose();
  };


  return (
    <Drawer placement="top" {...props}>
      <DrawerContent>
        <DrawerBody mt="16">
          <Stack spacing="6" align="stretch">
            <Spacer></Spacer>
            <Spacer></Spacer>

            {/* {user && <Button onClick={handleBuyBitcoinClick} size="lg" variant="text" colorScheme="gray">
              Buy Bitcoin
            </Button>} */}
{/* 
            <Button onClick={handleMarketPlaceClick} size="lg" variant="text" colorScheme="gray">
              Restaurants
            </Button> */}

            {/* <Button onClick={handleEarnClick} size="lg" variant="text" colorScheme="gray">
              Earn
            </Button> */}

            {/* <Button onClick={handleProfileClick} size="lg" variant="text" colorScheme="gray">
              Profile
            </Button> */}

            {/* {user && <Button onClick={handleWalletClick} size="lg" variant="text" colorScheme="gray">
              Wallet
            </Button>} */}

            {/* <Button
              onClick={handleAuthAction}
              bg="bitcoin.500"
              color="white"
              _hover={{ bg: "orange.600" }}
            >
              {user ? 'View Explorer' : 'View Explorer'}
            </Button> */}
          </Stack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};