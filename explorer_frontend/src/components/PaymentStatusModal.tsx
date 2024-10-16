import React, { useEffect } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, Text, VStack, HStack, Badge, useToast, Progress, Link
} from '@chakra-ui/react';
import { CheckIcon, WarningIcon, InfoIcon } from '@chakra-ui/icons';
import { useQuery, gql } from '@apollo/client';

const GET_BTCPAY_INVOICE = gql`
    query GetBTCPayInvoice($invoiceId: String!) {
        getBTCPayInvoice(invoiceId: $invoiceId) {
            id
            status
            amount
            currency
        }
    }
`;


export const PaymentStatusModal = ({ isOpen, onClose, invoiceId, checkoutLink }: any) => {
    const toast = useToast();
    const { data, loading, error, startPolling, stopPolling } = useQuery(GET_BTCPAY_INVOICE, {
        variables: { invoiceId },
        skip: !invoiceId,
        fetchPolicy: 'network-only',
    });


    const invoiceStatus = data?.getBTCPayInvoice?.status || 'Processing';
    const invoiceAmount = data?.getBTCPayInvoice?.amount;
    const invoiceCurrency = data?.getBTCPayInvoice?.currency;

    useEffect(() => {
        if (isOpen && invoiceId) {
            startPolling(5000); // Poll every 5 seconds
        }
        return () => stopPolling();
    }, [isOpen, invoiceId, startPolling, stopPolling]);



    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
            case 'confirmed':
            case 'settled':
                return 'green';
            case 'expired':
            case 'invalid':
                return 'red';
            default:
                return 'yellow';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
            case 'confirmed':
            case 'settled':
                return <CheckIcon />;
            case 'expired':
            case 'invalid':
                return <WarningIcon />;
            default:
                return <InfoIcon />;
        }
    };

    const handlePayNow = () => {
        window.open(checkoutLink, '_blank');
        toast({
            title: "Payment page opened",
            description: "Complete your payment in the new tab.",
            status: "info",
            duration: 5000,
            isClosable: true,
        });
    };

    const getStatusMessage = (status: string) => {
        switch (status.toLowerCase()) {
            case 'new':
            case 'unpaid':
                return "Please complete your payment to confirm your pledge.";
            case 'paid':
            case 'confirmed':
            case 'settled':
                return "Thank you for your payment! Your pledge has been recorded.";
            case 'expired':
                return "This invoice has expired. Please create a new pledge.";
            case 'invalid':
                return "There was an issue with this invoice. Please contact support.";
            default:
                return "The status of your payment is being processed. Please check back later for updates.";
        }
    };

    if (loading) return <Progress size="sm" isIndeterminate colorScheme="blue" />;
    if (error) return <Text color="red.500">Error loading invoice status. Please try again.</Text>;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Invoice Status</ModalHeader>
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <HStack justify="space-between">
                            <Text fontWeight="bold">Status:</Text>
                            <Badge colorScheme={getStatusColor(invoiceStatus)} fontSize="1em" p={2} borderRadius="md">
                                <HStack spacing={2}>
                                    {getStatusIcon(invoiceStatus)}
                                    <Text>{invoiceStatus}</Text>
                                </HStack>
                            </Badge>
                        </HStack>
                        <Text><strong>Invoice ID:</strong> {invoiceId}</Text>
                        {['new', 'unpaid'].includes(invoiceStatus.toLowerCase()) && (
                            <Progress size="sm" isIndeterminate colorScheme="blue" />
                        )}
                        {invoiceAmount && invoiceCurrency && (
                            <Text><strong>Amount:</strong> {invoiceAmount} {invoiceCurrency}</Text>
                        )}
                        <Text color={getStatusColor(invoiceStatus)}>
                            {getStatusMessage(invoiceStatus)}
                        </Text>
                        {checkoutLink && ['new', 'unpaid'].includes(invoiceStatus.toLowerCase()) && (
                            <Link href={checkoutLink} isExternal color="blue.500">
                                Complete payment on BTCPay Server
                            </Link>
                        )}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    {['new', 'unpaid'].includes(invoiceStatus.toLowerCase()) && (
                        <Button colorScheme="blue" mr={3} onClick={handlePayNow}>
                            Pay Now
                        </Button>
                    )}
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};