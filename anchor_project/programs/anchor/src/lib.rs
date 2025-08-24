use anchor_lang::prelude::*;


declare_id!("4iRSVdRWZBJiokynBtsReFyBZ8epDy2E8a9XRk3jEY1N");

#[program]
pub mod solana_twitter{

    use super::*;

    

    pub fn send_tweet(ctx: Context<SendTweet>, content: String) -> Result<()> {
        // Ensure the content length is less than 250 characters
        if content.chars().count() > 250 {
            return err!(Errors::ContentTooLong);
        }
    
        let my_tweet = &mut ctx.accounts.tweet_account;
        let signer = &ctx.accounts.sender;
        let clock = Clock::get().unwrap();
    
        // Set PDA data
        my_tweet.author = *signer.key;
        my_tweet.content = content;
        my_tweet.timestamp = clock.unix_timestamp;
        Ok(())
    }
    


    pub fn delete_tweet(_ctx: Context<DeleteTweet>) -> Result<()> {
        
        Ok(())
    }
    

}




#[error_code]
pub enum Errors {
    #[msg("The tweet is too long")]
    ContentTooLong,
}


#[derive(Accounts)]
pub struct DeleteTweet<'info> {
    #[account(
        mut, 
        close = sender, 
        seeds = [
            b"tweet",
            sender.key().as_ref(),
        ],
        bump
    )]
    pub tweet_account: Account<'info, Tweet>,
    
    #[account(mut)]
    pub sender: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct SendTweet<'info> {
    #[account(
        init, 
        payer = sender,
        space = Tweet::LEN,
        seeds = [
            b"tweet", // Seed for the PDA
            sender.key().as_ref(), // User's public key as a seed
        ],
        bump
    )]
    pub tweet_account: Account<'info, Tweet>,
    
    #[account(mut)]
    pub sender: Signer<'info>,

    pub system_program: Program<'info, System>,
}


#[account]
pub struct Tweet{
    pub author: Pubkey,
    pub content: String,
    pub timestamp: i64,
}



const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const PUBLIC_TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const MAX_CONTENT_LENGTH: usize = 250 * 4; // 250 chars max.

impl Tweet{
    const LEN: usize = 
    DISCRIMINATOR_LENGTH+
    PUBLIC_KEY_LENGTH+
    PUBLIC_TIMESTAMP_LENGTH+
    STRING_LENGTH_PREFIX+
    MAX_CONTENT_LENGTH;
}
