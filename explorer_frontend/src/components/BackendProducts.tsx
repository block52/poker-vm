import React from 'react';
import { useQuery, gql } from '@apollo/client';
import {
    Box,
    SimpleGrid,
    Image,
    Heading,
    Text,
    Button,
    VStack,
    Tag,
    Spinner,
    useToast,
} from '@chakra-ui/react';

const GET_ALL_PRODUCTS = gql`
  query GetAllProducts {
    getAllProducts {
      id
      name
      description
      price
      category
      image
      brand {
        name
      }
    }
  }
`;

const BackendProducts = () => {
    const { loading, error, data } = useQuery(GET_ALL_PRODUCTS);
    const toast = useToast();

    if (loading) return <Spinner />;
    if (error) {
        console.error('Error fetching products:', error);
        return <Text>Error loading products. Please try again later.</Text>;
    }

    const handleShare = (product: any) => {
        // Implement share functionality here
        toast({
            title: 'Share Link Copied!',
            description: 'Your unique share link has been copied to clipboard.',
            status: 'success',
            duration: 3000,
            isClosable: true,
        });
    };

    return (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
            {data.getAllProducts.map((product: any) => (
                <Box key={product.id} borderWidth={1} borderRadius="lg" overflow="hidden">
                    <Image src={product.image} alt={product.name} />
                    <Box p={6}>
                        <VStack align="start" spacing={2}>
                            <Tag borderRadius="full" px={2} colorScheme="teal">
                                {product.category}
                            </Tag>
                            <Heading as="h3" size="md">
                                {product.name}
                            </Heading>
                            <Text>{product.description}</Text>
                            <Text fontWeight="bold">
                                {product.price} sats (≈ AUD ${(product.price * 0.0005).toFixed(2)})
                            </Text>
                            {product.brand && <Text>Brand: {product.brand.name}</Text>}
                        </VStack>
                    </Box>
                    <Box p={6} pt={0}>
                        <Button
                            colorScheme="blue"
                            mt={4}
                            onClick={() => handleShare(product)}
                            width="100%"
                        >
                            View
                        </Button>
                    </Box>
                </Box>
            ))}
        </SimpleGrid>
    );
};

export default BackendProducts;