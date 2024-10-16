import React, { useEffect, useState } from "react";
import {
    Box,
    Container,
    Heading,
    Text,
    Button,
    Image,
    SimpleGrid,
    VStack,
    HStack,
    Flex,
    Grid,
    Icon,
    FormControl,
    Input,
    Center,
    useToast,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    useColorModeValue,
} from "@chakra-ui/react";
import { NavbarWithCallToAction } from "../components/chakra/NavbarWithCallToAction/NavbarWithCallToAction";
import { FooterWithFourColumns } from "../components/chakra/FooterWithFourColumns/FooterWithFourColumns";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaCube, FaExchangeAlt, FaUserCircle } from 'react-icons/fa';



const mockBlockData = [
    { index: 52000, hash: '0x1a2b3c...', txCount: 150, validator: 'Validator1', date: '2024-10-16 14:30:00' },
    { index: 51999, hash: '0x4d5e6f...', txCount: 132, validator: 'Validator2', date: '2024-10-16 14:29:45' },
    { index: 51998, hash: '0x7g8h9i...', txCount: 145, validator: 'Validator3', date: '2024-10-16 14:29:30' },
    { index: 51997, hash: '0xj0k1l2...', txCount: 128, validator: 'Validator1', date: '2024-10-16 14:29:15' },
    { index: 51996, hash: '0xm3n4o5...', txCount: 139, validator: 'Validator4', date: '2024-10-16 14:29:00' },
    { index: 51995, hash: '0xp6q7r8...', txCount: 147, validator: 'Validator2', date: '2024-10-16 14:28:45' },
    { index: 51994, hash: '0xs9t0u1...', txCount: 136, validator: 'Validator5', date: '2024-10-16 14:28:30' },
    { index: 51993, hash: '0xv2w3x4...', txCount: 142, validator: 'Validator3', date: '2024-10-16 14:28:15' },
    { index: 51992, hash: '0xy5z6a7...', txCount: 131, validator: 'Validator1', date: '2024-10-16 14:28:00' },
    { index: 51991, hash: '0xb8c9d0...', txCount: 144, validator: 'Validator4', date: '2024-10-16 14:27:45' },
];


const BlockExplorerTable = () => {
  
    return (
        <Box overflowX="auto">
            <Heading as="h2" size="lg" mb={4}>
                Recent Blocks
            </Heading>
            <Table variant="simple">
                <Thead>
                    <Tr>
                        <Th>Index</Th>
                        <Th>Hash</Th>
                        <Th>Tx Count</Th>
                        <Th>Validator</Th>
                        <Th>Date</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {mockBlockData.map((block) => (
                        <Tr key={block.index}>
                            <Td>{block.index}</Td>
                            <Td>{block.hash}</Td>
                            <Td>{block.txCount}</Td>
                            <Td>{block.validator}</Td>
                            <Td>{block.date}</Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
    );
};


const SearchForm = ({ onSearch }: { onSearch: (query: string) => void }) => {
    const [query, setQuery] = useState("");
    const navigate = useNavigate();
    const toast = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query) {
            onSearch(query);
            navigate("/search-results");
        } else {
            toast({
                title: "Error",
                description: "Please enter a search query",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <FormControl>
                <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by block, transaction, or address"
                />
            </FormControl>
            <Center mt={4}>
                <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    fontSize="xl"
                    py={6}
                    px={10}
                    bg="blue.500"
                    color="white"
                    _hover={{ bg: "blue.600" }}
                >
                    Search
                </Button>
            </Center>
        </form>
    );
};

const FeatureCard = ({ icon, title }: any) => (
    <VStack
        bg="white"
        p={4}
        borderRadius="md"
        boxShadow="md"
        align="center"
        spacing={3}
    >
        <Icon as={icon} boxSize={10} color="blue.500" />
        <Text fontWeight="bold">{title}</Text>
    </VStack>
);

export const Home = () => {

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const handleSearch = (query: string) => {
        console.log("Searching for:", query);
        // Implement search logic here
    };

    return (
        <Flex direction="column" minHeight="100vh">
            <NavbarWithCallToAction />

            <Container maxW="container.xl" flex="1">
                <VStack spacing={12} align="stretch">
                    {/* Hero Section */}
                    <Box textAlign="center" py={20}>
                        <Heading as="h1" size="2xl" mb={6}>
                            Block 52 Explorer
                        </Heading>
                        <Text fontSize="xl" mb={8}>
                            Explore blocks, transactions, and addresses on the Block 52 network.
                        </Text>
                        <Center>
                            <Box width={500}>
                                <SearchForm onSearch={handleSearch} />
                            </Box>
                        </Center>
                    </Box>

                    {/* Features Section */}
                    {/* <Box>
                        <Heading as="h2" size="xl" mb={6}>
                            Explorer Features
                        </Heading>
                        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
                            <FeatureCard icon={FaSearch} title="Search" />
                            <FeatureCard icon={FaCube} title="Block Info" />
                            <FeatureCard icon={FaExchangeAlt} title="Transaction Details" />
                            <FeatureCard icon={FaUserCircle} title="Address Lookup" />
                        </SimpleGrid>
                    </Box> */}

                    {/* How It Works Section */}
                    {/* <Box>
                        <Heading as="h2" size="xl" mb={6}>
                            How It Works
                        </Heading>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                            <VStack>
                                <Heading size="md">1. Enter Search Query</Heading>
                                <Text>Input a block number, transaction hash, or address</Text>
                            </VStack>
                            <VStack>
                                <Heading size="md">2. Explore Details</Heading>
                                <Text>View comprehensive information about the queried item</Text>
                            </VStack>
                            <VStack>
                                <Heading size="md">3. Analyze Data</Heading>
                                <Text>Gain insights from the presented blockchain data</Text>
                            </VStack>
                        </SimpleGrid>
                    </Box> */}






                    {/* Block Explorer Table */}
                    <Box
                        bg={bgColor}
                        boxShadow="xl"
                        borderRadius="lg"
                        p={6}
                        borderWidth={1}
                        borderColor={borderColor}
                    >
                        <BlockExplorerTable />
                    </Box>
                </VStack>
            </Container>

            {/* <FooterWithFourColumns /> */}
        </Flex>
    );
};

export default Home;