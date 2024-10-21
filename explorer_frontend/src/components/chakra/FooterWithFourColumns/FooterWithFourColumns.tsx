import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Container,
  Divider,
  IconButton,
  SimpleGrid,
  Stack,
  Text,
  Image,
  Center,
} from "@chakra-ui/react";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";
import { Logo } from "../../Logo";
// import { links } from './_data'

export const FooterWithFourColumns = () => {
  const links = [
    {
      // title: 'Company',
      links: [
        { label: "", href: "start" },
        { label: "", href: "/restaurants" },
        // ...(user ? [{ label: 'Marketplace', href: '/marketplace' }] : []),
        // ...(user ? [{ label: 'My Purchases', href: '/mybtcpurchases' }] : []),
        // ...(user ? [{ label: 'View Trial Membership', href: '/trialmembership' }] : []),
        // ...(user ? [{ label: 'Add Product', href: '/addproduct' }] : []),
        // { label: 'Careers', href: '#' },
        // { label: 'Press', href: '#' },
        // { label: 'FAQs', href: '/earn' },
      ],
    },
    {
      // title: 'Product',
      links: [
        // { label: 'How it Works', href: '/earn' },
        { label: "", href: "/restaurants" },
        { label: "", href: "/our-reko-model" },
        // ...(user ? [{ label: 'How it Works', href: '/earn' }] : []),
        // ...(user ? [{ label: 'Our Locations', href: '/our-location-hubs' }] : []),
        // ...(user ? [{ label: 'Our Producers', href: '/producers' }] : []),
        // ...(user ? [{ label: 'Our Impact', href: '/farm-sales-dashboard' }] : []),
        // ...(user ? [{ label: 'Earn With Us', href: '/earn' }] : []),
        // { label: '', href: '/cultivating-resilience-infographic' },
        // ...(user ? [{ label: 'Our Impact', href: '/farm-sales-dashboard' }] : []),
        // { label: 'Get Started', href: 'start' },
        // { label: 'Use Cases', href: '/earn' },
        // { label: 'Integrations', href: '#' },
        // { label: 'SAML SSO', href: '#' },
      ],
    },
    {
      title: "Resources",
      links: [
        // ...(user ? [{ label: 'News', href: '/news' }] : []),
        // ...(user ? [{ label: 'My Purchases', href: '/mybtcpurchases' }] : []),
        // ...(user ? [{ label: 'SATS=>AUD', href: 'https://coincodex.com/convert/satoshi-sats/aud/1000/' }] : []),
        // { label: 'Case studies', href: '#' },
        // { label: 'Media Assets', href: '#' },
      ],
    },
    {
      title: "Admin",
      links: [
        // ...(user?.permissions?.includes('admin') ? [{ label: 'BTCPay Invoices', href: '/btcpayinvoices' }] : []),
        // ...(user?.permissions?.includes('admin') ? [{ label: 'All Orders', href: '/allorders' }] : []),
        // { label: 'Privacy Policy', href: '#' },
        // { label: 'Offer terms', href: '#' },
        // { label: 'License', href: '#' },
      ],
    },
  ];

  return (
    <>
      <Box bg="bg.surface" m={4}>
        {/* <InviteLink /> */}
        <Container as="footer" role="contentinfo" maxW="6xl">
          <Stack
            justify="space-between"
            align="start"
            direction={{ base: "column", lg: "row" }}
            py={{ base: "12", md: "16" }}
            spacing="4"
          >
            <Stack spacing={{ base: "3", md: "8" }} align="start">
              <Logo />
              <Box maxW="60%">
                <Text
                  fontSize="xl"
                  fontWeight="bold"
                  mb={6}
                  color="black.100"
                  pl={"10px"}
                >
                  Exploring blocks made simple
                </Text>
              </Box>
            </Stack>
            <SimpleGrid
              columns={{ base: 2, md: 4 }}
              gap="8"
              width={{ base: "full", lg: "auto" }}
            >
              {links.map((group, idx) => (
                <Stack key={idx} spacing="4" minW={{ lg: "40" }}>
                  <Stack spacing="3" shouldWrapChildren>
                    {group.links.map((link, idx, title) => (
                      <>
                        <Button
                          key={idx}
                          as="a"
                          variant="text"
                          colorScheme="gray"
                          href={link.href}
                          size="sm"
                        >
                          {link.label}
                        </Button>
                      </>
                    ))}
                  </Stack>
                </Stack>
              ))}
            </SimpleGrid>
          </Stack>
          <Divider />
          <Stack
            pt="8"
            pb="12"
            justify="space-between"
            direction={{ base: "column-reverse", md: "row" }}
            align="center"
          >
            <Box maxW="600px">
              {/* <Box mb={10}>
              <Text fontSize="sm" fontWeight="bold" mb={2}>
                Our Partners
              </Text>
              <a href="https://getpaidinbitcoin.com.au/" target="_blank" rel="noopener noreferrer">
                <Image
                  src="/getpaidinbtc.png"
                  alt="Get paid in Bitcoin"
                  height="100px"
                  objectFit="contain"
                />
              </a>
            </Box> */}

              <Text fontSize="sm" textAlign="center" mb={2}>
                {/* <Badge colorScheme='blue' mb={1}>Experimental Project</Badge> */}
              </Text>
              {/* <Text fontSize="xs" textAlign="center">
              This is an experimental platform designed to study the impact of community-driven economic systems.
              We aim to gather insights on how these systems might contribute to community and family stability.
              Participants acknowledge that no products or services are provided, and this experiment will not
              transition to a production environment. All activities are part of our research study.
            </Text> */}
              <Center>
                <Text fontSize="sm" color="fg.subtle">
                  &copy; {new Date().getFullYear()} block52.xyz All rights
                  reserved.
                </Text>
              </Center>
            </Box>
            <ButtonGroup variant="tertiary">
              <IconButton
                as="a"
                href="#"
                aria-label="Twitter"
                icon={<FaTwitter />}
              />
            </ButtonGroup>
          </Stack>
        </Container>
      </Box>
    </>
  );
};
