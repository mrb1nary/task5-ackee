import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";

describe("solana-twitter", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;

  const program = anchor.workspace.SolanaTwitter as Program<any>;

  const findTweetPda = (sender: PublicKey) =>
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("tweet"), sender.toBuffer()],
      program.programId
    );

  const newFundedUser = async (lamports = 2 * anchor.web3.LAMPORTS_PER_SOL) => {
    const kp = Keypair.generate();
    const sig = await connection.requestAirdrop(kp.publicKey, lamports);

    const latest = await connection.getLatestBlockhash();
    await connection.confirmTransaction(
      { signature: sig, ...latest },
      "confirmed"
    );
    return kp;
  };

  it("Can send a tweet", async () => {
    const sender = await newFundedUser();
    const [tweetPda] = findTweetPda(sender.publicKey);

    const content = "Hello, Solana!";

    await program.methods
      .sendTweet(content)
      .accounts({
        tweetAccount: tweetPda,
        sender: sender.publicKey,
        systemProgram: SystemProgram.programId,
      })

      .signers([sender])
      .rpc();

    const account = await program.account.tweet.fetch(tweetPda);
    expect(account.content).to.equal(content);
    expect(account.author.toBase58()).to.equal(sender.publicKey.toBase58());
    expect(account.timestamp.toNumber()).to.be.a("number");
  });

  it("Fails when tweet is too long", async () => {
    const sender = await newFundedUser();
    const [tweetPda] = findTweetPda(sender.publicKey);

    const content = "x".repeat(251); // 251 chars (program limit is 250)

    try {
      await program.methods
        .sendTweet(content)
        .accounts({
          tweetAccount: tweetPda,
          sender: sender.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([sender])
        .rpc();

      throw new Error("Should have failed");
    } catch (err: any) {
      expect(err.toString()).to.include("The tweet is too long");
    }
  });

  it("Can delete a tweet", async () => {
    const sender = await newFundedUser();
    const [tweetPda] = findTweetPda(sender.publicKey);

    const content = "Delete me!";

    await program.methods
      .sendTweet(content)
      .accounts({
        tweetAccount: tweetPda,
        sender: sender.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([sender])
      .rpc();

    await program.methods
      .deleteTweet()
      .accounts({
        tweetAccount: tweetPda,
        sender: sender.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([sender])
      .rpc();

    try {
      await program.account.tweet.fetch(tweetPda);
      throw new Error("Should have failed");
    } catch (err: any) {
      expect(err.toString()).to.include("Account does not exist");
    }
  });
});
