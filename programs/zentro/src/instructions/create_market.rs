```rust
use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(market_id: String)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = Market::LEN,
        seeds = [b"market", market_id.as_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn create_market(
    ctx: Context<CreateMarket>,
    market_id: String,
    title: String,
    description: String,
    end_time: i64,
    category: String,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let clock = Clock::get()?;
    
    require!(
        end_time > clock.unix_timestamp,
        ZentroError::InvalidEndTime
    );
    
    require!(
        title.len() <= 200,
        ZentroError::TitleTooLong
    );
    
    require!(
        description.len() <= 1000,
        ZentroError::DescriptionTooLong
    );
    
    require!(
        market_id.len() <= 50,
        ZentroError::MarketIdTooLong
    );
    
    market.authority = ctx.accounts.authority.key();
    market.market_id = market_id;
    market.title = title;
    market.description = description;
    market.category = category;
    market.end_time = end_time;
    market.created_at = clock.unix_timestamp;
    market.is_resolved = false;
    market.resolution_outcome = None;
    market.total_yes_amount = 0;
    market.total_no_amount = 0;
    market.bump = ctx.bumps.market;
    
    emit!(MarketCreated {
        market: market.key(),
        authority: market.authority,
        market_id: market.market_id.clone(),
        title: market.title.clone(),
        end_time: market.end_time,
        created_at: market.created_at,
    });
    
    Ok(())
}

#[event]
pub struct MarketCreated {
    pub market: Pubkey,
    pub authority: Pubkey,
    pub market_id: String,
    pub title: String,
    pub end_time: i64,
    pub created_at: i64,
}
```