import {
  VStack,
  Box,
  Text,
  Flex,
  Spinner,
  Button,
  useColorModeValue,
  Divider,
  Badge,
  Icon,
} from "@chakra-ui/react";
import { RefreshCw, MessageCircle, Users, TrendingUp } from "lucide-react";
import TweetCard from "./TweetCard";
import { useEffect, useState } from "react";
import { AnchorProvider, Idl, Program, web3 } from "@coral-xyz/anchor";
import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import idl from "../solana_twitter.json";

const Feed = () => {
  type SolanaWallet = WalletContextState & {
    publicKey: PublicKey;
    signTransaction(tx: web3.Transaction): Promise<web3.Transaction>;
    signAllTransactions(txs: web3.Transaction[]): Promise<web3.Transaction[]>;
  };

  const opts: web3.ConnectionConfig = { commitment: "processed" };
  const wallet = useWallet();
  const connection = new Connection(clusterApiUrl("devnet"), opts.commitment);
  const provider = new AnchorProvider(connection, wallet as SolanaWallet, {
    preflightCommitment: opts.commitment,
    commitment: opts.commitment,
  });

  const program = new Program<Idl>(idl as Idl, provider);
  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Color mode values
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const headerBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");

  // Helper function to derive PDA based on author (sender)
  const getTweetPDA = async (author: PublicKey) => {
    const [tweetPDA, _bump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("tweet"), author.toBuffer()],
      program.programId
    );
    return tweetPDA;
  };

  const fetchTweets = async () => {
    setLoading(true);
    try {
      const tweetsData = await program.account.tweet.all();

      // Iterate through the accounts and fetch PDAs for each tweet
      const tweetAccountsWithPDA = await Promise.all(
        tweetsData.map(async (tweetData: any) => {
          const author = tweetData.account.author;
          const tweetPDA = await getTweetPDA(author);
          return {
            ...tweetData,
            pda: tweetPDA.toBase58(),
          };
        })
      );

      // Sort by timestamp (newest first)
      tweetAccountsWithPDA.sort((a, b) => {
        const timestampA =
          typeof a.account.timestamp === "number"
            ? a.account.timestamp
            : a.account.timestamp.toNumber();
        const timestampB =
          typeof b.account.timestamp === "number"
            ? b.account.timestamp
            : b.account.timestamp.toNumber();
        return timestampB - timestampA;
      });

      setTweets(tweetAccountsWithPDA);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching tweets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  const getUniqueAuthors = () => {
    const authors = new Set(
      tweets.map((tweet) => tweet.account.author.toBase58())
    );
    return authors.size;
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return "";
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);

    if (diff < 60) return "Updated just now";
    if (diff < 3600) return `Updated ${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `Updated ${Math.floor(diff / 3600)}h ago`;
    return `Updated ${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <Box
      w={{ base: "100%", md: "85%" }}
      minH="100vh"
      bg={bgColor}
      position="relative"
    >
      {/* Header */}
      <Box
        position="sticky"
        top={0}
        zIndex={10}
        bg={headerBg}
        borderBottom="1px solid"
        borderColor={borderColor}
        backdropFilter="blur(10px)"
        backgroundColor={useColorModeValue(
          "rgba(255,255,255,0.8)",
          "rgba(26,32,44,0.8)"
        )}
      >
        <Flex
          align="center"
          justify="space-between"
          p={6}
          maxW="800px"
          mx="auto"
        >
          <Flex align="center" gap={4}>
            <Icon as={MessageCircle} boxSize={6} color="blue.500" />
            <Box>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                Twitter Feed
              </Text>
              <Text fontSize="sm" color={mutedTextColor}>
                {formatLastUpdated()}
              </Text>
            </Box>
          </Flex>

          <Button
            leftIcon={<Icon as={RefreshCw} />}
            onClick={fetchTweets}
            isLoading={loading}
            loadingText="Refreshing"
            colorScheme="blue"
            variant="outline"
            size="sm"
            _hover={{
              transform: "translateY(-1px)",
              shadow: "md",
            }}
            transition="all 0.2s"
          >
            Refresh
          </Button>
        </Flex>

        {/* Stats Bar */}
        <Box bg={useColorModeValue("gray.50", "gray.700")} px={6} py={3}>
          <Flex justify="center" gap={8} maxW="800px" mx="auto">
            <Flex align="center" gap={2}>
              <Icon as={MessageCircle} boxSize={4} color="blue.500" />
              <Text fontSize="sm" color={mutedTextColor}>
                <Badge colorScheme="blue" mr={1}>
                  {tweets.length}
                </Badge>
                Total Tweets
              </Text>
            </Flex>
            <Flex align="center" gap={2}>
              <Icon as={Users} boxSize={4} color="green.500" />
              <Text fontSize="sm" color={mutedTextColor}>
                <Badge colorScheme="green" mr={1}>
                  {getUniqueAuthors()}
                </Badge>
                Active Users
              </Text>
            </Flex>
            <Flex align="center" gap={2}>
              <Icon as={TrendingUp} boxSize={4} color="purple.500" />
              <Text fontSize="sm" color={mutedTextColor}>
                <Badge colorScheme="purple" mr={1}>
                  Live
                </Badge>
                Network
              </Text>
            </Flex>
          </Flex>
        </Box>
      </Box>

      {/* Content */}
      <Box p={6}>
        <VStack spacing={6} align="stretch" maxW="800px" mx="auto">
          {loading && tweets.length === 0 ? (
            <Box
              bg={cardBg}
              borderRadius="xl"
              p={12}
              border="1px solid"
              borderColor={borderColor}
              textAlign="center"
            >
              <Spinner size="lg" color="blue.500" mb={4} />
              <Text
                fontSize="lg"
                fontWeight="semibold"
                color={textColor}
                mb={2}
              >
                Loading tweets...
              </Text>
              <Text color={mutedTextColor}>
                Fetching the latest posts from the blockchain
              </Text>
            </Box>
          ) : tweets.length === 0 ? (
            <Box
              bg={cardBg}
              borderRadius="xl"
              p={12}
              border="1px solid"
              borderColor={borderColor}
              textAlign="center"
            >
              <Icon as={MessageCircle} boxSize={16} color="gray.400" mb={4} />
              <Text
                fontSize="xl"
                fontWeight="semibold"
                color={textColor}
                mb={2}
              >
                No tweets yet
              </Text>
              <Text color={mutedTextColor} mb={4}>
                Be the first to share something with the community!
              </Text>
              <Text fontSize="sm" color={mutedTextColor}>
                Program ID: {program.programId.toBase58().slice(0, 8)}...
              </Text>
            </Box>
          ) : (
            <>
              {tweets.map((tweetData, index) => (
                <Box
                  key={`${tweetData.pda}-${index}`}
                  transform="scale(1)"
                  transition="all 0.2s ease-in-out"
                  _hover={{
                    transform: "scale(1.02)",
                    shadow: "lg",
                  }}
                >
                  <TweetCard tweet={tweetData.account} pda={tweetData.pda} />
                  {index < tweets.length - 1 && (
                    <Divider mt={6} borderColor={borderColor} opacity={0.6} />
                  )}
                </Box>
              ))}

              {/* Load More Section */}
              <Box
                bg={cardBg}
                borderRadius="xl"
                p={6}
                border="1px solid"
                borderColor={borderColor}
                textAlign="center"
              >
                <Text color={mutedTextColor} fontSize="sm">
                  You've reached the end! 🎉
                </Text>
                <Text color={mutedTextColor} fontSize="xs" mt={1}>
                  Refresh to check for new tweets
                </Text>
              </Box>
            </>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default Feed;
