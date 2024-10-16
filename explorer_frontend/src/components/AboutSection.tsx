//src/components/AboutSection.tsx

import { Box, Container, Flex, Heading, Button, Spacer, VStack, List, ListItem, ListIcon, Image, Text, useColorModeValue, Link as ChakraLink } from '@chakra-ui/react';
import React from 'react';
import { FaUsers, FaShoppingCart, FaBitcoin, FaLock } from 'react-icons/fa';


// a component that can be imported and used in other componetes called AboutSection.

export const AboutSection = () => {
    const bgColor = useColorModeValue('gray.50', 'gray.900');
    const textColor = useColorModeValue('gray.800', 'gray.100');
    return (
        <div className="about-section">

            <Box bg={bgColor} py={10} >
                <Container maxW="container.xl">
                    <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="center">
                        <Box flex={1} mr={{ base: 0, md: 8 }} mb={{ base: 8, md: 0 }}>
                            <Image src="/logo.png" alt="Pledgeby Logo" maxW="300px" mb={6} />
                            <Heading as="h1" size="2xl" mb={4} color={textColor}>
                                Pledgebuy.shop
                            </Heading>
                            <Text fontSize="xl" fontWeight="bold" mb={6} color="blue.500">
                                Together, We Pledge.

                                Together, We Buy.

                                Together, We Thrive.
                            </Text>
                            <Text fontSize="lg" mb={6} color={textColor}>
                                Join the revolution in demand aggregation and private community shopping!
                            </Text>
                            <ChakraLink href='/login' _hover={{ textDecoration: 'none' }} >
                                <Button colorScheme="blue" size="lg" leftIcon={<FaUsers />} >
                                    Join the Community
                                </Button>


                            </ChakraLink>

                        </Box>
                        <Spacer />
                        <VStack spacing={6} align="flex-start" flex={2}>
                            <Heading as="h2" size="xl" mb={4} color={textColor}>
                                What is Pledgebuy?
                            </Heading>
                            <List spacing={3}>
                                <ListItem>
                                    <ListIcon as={FaShoppingCart} color="green.500" />
                                    Demand aggregation for cheaper prices
                                </ListItem>
                                <ListItem>
                                    <ListIcon as={FaBitcoin} color="orange.500" />
                                    Private transactions using Bitcoin Lightning
                                </ListItem>
                                <ListItem>
                                    <ListIcon as={FaUsers} color="purple.500" />
                                    Building digital and private communities
                                </ListItem>
                                <ListItem>
                                    <ListIcon as={FaLock} color="red.500" />
                                    Sourcing commodities and food with optional tracking
                                </ListItem>
                            </List>
                            <Text fontSize="md" fontStyle="italic" mt={4} color={textColor}>
                                It's like Groupon, but with a focus on privacy and community!
                            </Text>
                        </VStack>
                    </Flex>


                </Container>
            </Box>
        </div>
    );
};

