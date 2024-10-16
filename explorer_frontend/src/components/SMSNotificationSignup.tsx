import React, { useState } from 'react';
import {
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Select,
    FormErrorMessage,
    VStack,
    useToast,
    Box,
} from '@chakra-ui/react';
import { useMutation, gql } from '@apollo/client';
import { motion, useAnimation } from 'framer-motion';

const ADD_TO_SMS_NOTIFICATION_LIST = gql`
  mutation AddToSMSNotificationList($phoneNumber: String!, $countryCode: String!, $pageUrl: String!) {
    addToSMSNotificationList(phoneNumber: $phoneNumber, countryCode: $countryCode, pageUrl: $pageUrl) {
      id
      phoneNumber
      countryCode
      pageUrl
    }
  }
`;

interface SMSNotificationSignupProps {
    buttonText?: string;
    buttonColorScheme?: string;
}

const SMSNotificationSignup: React.FC<SMSNotificationSignupProps> = ({
    buttonText = "Get SMS Notifications",
    buttonColorScheme = "green"
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState('+61');
    const [phoneError, setPhoneError] = useState('');
    const toast = useToast();

    const controls = useAnimation();

    React.useEffect(() => {
        controls.start({
            y: [0, -10, 0],
            transition: {
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
            }
        });
    }, [controls]);

    const [addToSMSNotificationList] = useMutation(ADD_TO_SMS_NOTIFICATION_LIST);

    const validatePhoneNumber = (number: string) => {
        const phoneRegex = /^\d{9,10}$/;
        if (!phoneRegex.test(number)) {
            setPhoneError('Please enter a valid phone number (9-10 digits)');
        } else {
            setPhoneError('');
        }
    };

    const formatPhoneNumber = (countryCode: string, phoneNumber: string): string => {
        const trimmedNumber = phoneNumber.replace(/^0+/, '');
        return `${countryCode}${trimmedNumber}`;
    };

    const handleNotificationSubmit = async () => {
        if (phoneError) return;

        const formattedPhoneNumber = formatPhoneNumber(countryCode, phoneNumber);
        try {
            await addToSMSNotificationList({
                variables: {
                    phoneNumber: formattedPhoneNumber,
                    countryCode,
                    pageUrl: window.location.href,
                },
            });
            toast({
                title: 'Success',
                description: 'You have been added to the SMS notification list.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            setIsModalOpen(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to add you to the SMS notification list. Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <>
            <Box position="relative" width="full">
                <motion.div
                    animate={controls}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Button
                        colorScheme={buttonColorScheme}
                        size="lg"
                        onClick={() => setIsModalOpen(true)}
                        width="full"
                        boxShadow="md"
                        _hover={{ boxShadow: 'lg' }}
                        transition="all 0.2s"
                        position="relative"
                        overflow="hidden"
                    >
                        {buttonText}
                    </Button>
                </motion.div>
                <motion.div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)',
                        pointerEvents: 'none',
                    }}
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                />
            </Box>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <ModalOverlay />
                <ModalContent
                    as={motion.div}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: "0.3s" }}
                >
                    <ModalHeader>Sign up for SMS Notifications</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>Country</FormLabel>
                                <Select
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                >
                                    <option value="+61">Australia (+61)</option>
                                    <option value="+64">New Zealand (+64)</option>
                                    {/* Add more country options as needed */}
                                </Select>
                            </FormControl>
                            <FormControl isInvalid={!!phoneError}>
                                <FormLabel>Phone Number</FormLabel>
                                <Input
                                    type="tel"
                                    placeholder="Enter your phone number"
                                    value={phoneNumber}
                                    onChange={(e) => {
                                        setPhoneNumber(e.target.value);
                                        validatePhoneNumber(e.target.value);
                                    }}
                                />
                                <FormErrorMessage>{phoneError}</FormErrorMessage>
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                colorScheme="blue"
                                mr={3}
                                onClick={handleNotificationSubmit}
                                isDisabled={!!phoneError}
                            >
                                Submit
                            </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                variant="ghost"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </Button>
                        </motion.div>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );

};
export default SMSNotificationSignup;