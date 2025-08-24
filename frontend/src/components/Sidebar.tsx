import {
  VStack,
  HStack,
  IconButton,
  Text,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
  useBreakpointValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  useMediaQuery,
  Input,
} from "@chakra-ui/react";
import { FiHome, FiHash, FiMail, FiEdit } from "react-icons/fi";
import { useState } from "react";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { AnchorProvider, Idl, Program, web3 } from "@coral-xyz/anchor";
import idl from "../solana_twitter.json";

const Sidebar = () => {
  type SolanaWallet = WalletContextState & {
    publicKey: PublicKey;
    signTransaction(tx: web3.Transaction): Promise<web3.Transaction>;
    signAllTransactions(txs: web3.Transaction[]): Promise<web3.Transaction[]>;
  };

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isSearchOpen,
    onOpen: onSearchOpen,
    onClose: onSearchClose,
  } = useDisclosure();
  const [tweetContent, setTweetContent] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const characterLimit = 250;
  const wallet = useWallet();
  const opts: web3.ConnectionConfig = { commitment: "processed" };

  // const connection = new Connection("http://localhost:8899");
  const connection = new Connection(clusterApiUrl("devnet"), opts.commitment);
  const provider = new AnchorProvider(connection, wallet as SolanaWallet, {
    preflightCommitment: opts.commitment,
    commitment: opts.commitment,
  });
  const program = new Program<Idl>(idl as Idl, provider);

  // Handle tweet content change
  const handleTweetChange = (e: any) => {
    if (e.target.value.length <= characterLimit) {
      setTweetContent(e.target.value);
    }
  };

  // Function to generate a PDA for a new tweet
  const getTweetPDA = async (authorPublicKey: PublicKey) => {
    const [tweetPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("tweet"), // Seed for PDA
        authorPublicKey.toBuffer(),
      ],
      program.programId
    );
    return tweetPDA;
  };

  // Function to handle sending the transaction to Solana
  const handlePostTweet = async () => {
    if (!tweetContent.trim()) return;

    try {
      // Generate PDA for the new tweet
      const tweetPDA = await getTweetPDA(wallet.publicKey!);

      // Send the transaction
      await program.methods
        .sendTweet(tweetContent)
        .accounts({
          tweetAccount: tweetPDA, // Use PDA for the tweet
          sender: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Tweet posted:", tweetContent);
      setTweetContent(""); // Reset textarea after posting
      onClose(); // Close the modal
    } catch (error) {
      console.error("Error posting tweet:", error);
    }
  };

  // Function to render a sidebar item
  const renderSidebarItem = (
    icon: any,
    label: string,
    ariaLabel: string,
    showLabel: boolean,
    onClick?: () => void
  ) => (
    <HStack
      w="full"
      spacing={showLabel ? 4 : 0}
      alignItems="center"
      onClick={onClick}
    >
      <IconButton
        icon={icon}
        aria-label={ariaLabel}
        size="lg"
        variant="solid"
        bg="gray.700"
        color="white"
        _hover={{ bg: "black" }}
        borderRadius="full"
      />
      {showLabel && (
        <Text color="white" fontSize="lg">
          {label}
        </Text>
      )}
    </HStack>
  );

  // Mobile responsive logic
  const showLabel = useBreakpointValue({ base: false, md: true });
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isLargerThan768] = useMediaQuery("(min-width: 768px)");

  return (
    <>
      {isMobile ? (
        <>
          <IconButton
            aria-label="Open menu"
            icon={<FiEdit />}
            size="lg"
            colorScheme="blue"
            onClick={() => setDrawerOpen(true)}
            position="fixed"
            bottom={4}
            right={4}
            zIndex={1000}
          />

          <Drawer
            isOpen={isDrawerOpen}
            placement="left"
            onClose={() => setDrawerOpen(false)}
          >
            <DrawerOverlay />
            <DrawerContent bg="gray.800" color="white">
              <DrawerCloseButton />
              <DrawerHeader>Menu</DrawerHeader>

              <DrawerBody>
                <VStack align="start" spacing={8}>
                  {renderSidebarItem(<FiHome />, "Home", "Home", showLabel)}
                  {renderSidebarItem(
                    <FiHash />,
                    "Search",
                    "Search",
                    showLabel,
                    onSearchOpen
                  )}
                  {renderSidebarItem(
                    <FiMail />,
                    "Messages",
                    "Messages",
                    showLabel
                  )}
                  <Button
                    leftIcon={<FiEdit />}
                    size="lg"
                    bg="blue.500"
                    color="white"
                    _hover={{ bg: "blue.600" }}
                    borderRadius="full"
                    w="full"
                    onClick={onOpen}
                  >
                    New Tweet
                  </Button>
                </VStack>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        <VStack
          align="start"
          p={4}
          spacing={8}
          h="100vh"
          w="15%"
          bg="gray.800"
          borderRight="1px solid #E2E8F0"
          position="sticky"
          top={0}
        >
          {renderSidebarItem(<FiHome />, "Home", "Home", showLabel)}
          {renderSidebarItem(
            <FiHash />,
            "Search",
            "Search",
            showLabel,
            onSearchOpen
          )}
          {renderSidebarItem(<FiMail />, "Messages", "Messages", showLabel)}

          {/* New Tweet Button */}
          <Button
            leftIcon={<FiEdit />}
            size="lg"
            bg="blue.500"
            color="white"
            _hover={{ bg: "blue.600" }}
            borderRadius="full"
            w="full"
            onClick={onOpen}
          >
            New Tweet
          </Button>
        </VStack>
      )}

      {/* Modal for New Tweet */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create a New Tweet</ModalHeader>
          <ModalBody>
            <Textarea
              placeholder="What's happening?"
              value={tweetContent}
              onChange={handleTweetChange}
              size="md"
              resize="none"
              maxLength={characterLimit}
            />
            <Text mt={2} fontSize="sm" color="gray.500">
              {tweetContent.length}/{characterLimit} characters
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handlePostTweet}
              isDisabled={!tweetContent.trim()} // Disable button if tweet is empty
            >
              Post
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal for Search */}
      <Modal isOpen={isSearchOpen} onClose={onSearchClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Search Tweets by Public Key</ModalHeader>
          <ModalBody>
            <Input
              placeholder="Enter Public Key"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3}>
              Search
            </Button>
            <Button variant="ghost" onClick={onSearchClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default Sidebar;
