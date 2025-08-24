import { Box, Text, HStack, VStack, Avatar, Divider, Button } from "@chakra-ui/react";
import moment from "moment";
import { clusterApiUrl, Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { AnchorProvider, Idl, Program, web3} from "@coral-xyz/anchor";
import idl from '../solana_twitter.json'; // Import your program's IDL

const TweetCard = ({ tweet, pda }: { tweet: any, pda: string }) => {

  type SolanaWallet = WalletContextState & {
    publicKey: PublicKey;
    signTransaction(tx: web3.Transaction): Promise<web3.Transaction>;
    signAllTransactions(txs: web3.Transaction[]): Promise<web3.Transaction[]>;
  };
  
  const wallet = tweet.author.toBase58(); // Convert Pubkey to string
  const content = tweet.content;
  const currentWallet = useWallet().publicKey?.toBase58(); // Get the current wallet's public key

  const truncatePublicKey = (key: string) => {
    if (key.length > 10) {
      return `${key.slice(0, 6)}...${key.slice(-4)}`;
    }
    return key;
  };

  const walletConnection = useWallet();
  const connection = new Connection(clusterApiUrl('devnet'));
  const provider = new AnchorProvider(connection, walletConnection as SolanaWallet, { preflightCommitment: 'processed' });
  const program = new Program<Idl>(idl as Idl, provider);

  // Function to handle tweet deletion based on PDA
  const handleDeleteTweet = async () => {
    if (!currentWallet) return;

    try {
      // Derive the PDA from the parent component (passed as props)
      const tweetPDA = new PublicKey(pda);

      console.log("Deleting tweet with PDA:", tweetPDA.toBase58());

      await program.methods
        .deleteTweet()
        .accounts({
          tweetAccount: tweetPDA, // PDA of the tweet account
          sender: walletConnection.publicKey, // Current wallet
          systemProgram: SystemProgram.programId
        })
        .rpc();

      console.log("Tweet deleted");
      // You might want to refresh the feed or handle the UI update here
    } catch (error) {
      console.error("Error deleting tweet:", error);
    }
  };

  const tweetTimestamp = new Date(tweet.timestamp * 1000); // Convert from seconds to milliseconds
  const timeAgo = moment(tweetTimestamp).fromNow();

  return (
    <Box
      w="full"
      p={6} // Increased padding for a larger card
      bg="white"
      borderRadius="lg"  // Rounded edges
      shadow="md"       // Subtle shadow
      border="1px solid #E2E8F0"
      _hover={{ 
        shadow: "lg",    // Stronger shadow on hover
        transform: "scale(1.02)", // Slightly larger on hover
        transition: "all 0.2s ease-in-out" // Smooth transition
      }}
      mb={4}
      maxW="2xl" // Make the card a bit larger
      mx="auto" // Center the card horizontally
    >
      <VStack align="start" spacing={4}>
        {/* Header Section: Avatar, Wallet (Username) and Timestamp */}
        <HStack spacing={4} w="full">
          <Avatar size="lg" name={wallet} /> {/* Larger avatar */}
          <VStack align="start" spacing={1} maxW="full">
            <Text fontWeight="bold" fontSize="lg" isTruncated>
              {truncatePublicKey(wallet)} {/* Truncated public key */}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {timeAgo}
            </Text>
          </VStack>
        </HStack>

        {/* Content Section: Tweet text */}
        <Text fontSize="md" color="gray.700">
          {content}
        </Text>
        
        <Divider />

        {/* Delete Button */}
        {currentWallet === wallet && (
          <Button
            mt={2}
            colorScheme="red"
            onClick={handleDeleteTweet}
          >
            Delete
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default TweetCard;
