```rust
use anchor_lang::prelude::*;
use crate::errors::ZentroError;

#[account]
pub struct LiquidityPool {
    pub authority: Pubkey,
    pub market: Pubkey,
    pub token_mint: Pubkey,
    pub token_vault: Pubkey,
    pub yes_token_mint: Pubkey,
    pub no_token_mint: Pubkey,
    pub yes_token_vault: Pubkey,
    pub no_token_vault: Pubkey,
    pub total_liquidity: u64,
    pub yes_reserves: u64,
    pub no_reserves: u64,
    pub fee_rate: u16, // basis points (e.g., 100 = 1%)
    pub accumulated_fees: u64,
    pub is_active: bool,
    pub created_at: i64,
    pub bump: u8,
}

impl LiquidityPool {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // market
        32 + // token_mint
        32 + // token_vault
        32 + // yes_token_mint
        32 + // no_token_mint
        32 + // yes_token_vault
        32 + // no_token_vault
        8 + // total_liquidity
        8 + // yes_reserves
        8 + // no_reserves
        2 + // fee_rate
        8 + // accumulated_fees
        1 + // is_active
        8 + // created_at
        1; // bump

    pub fn initialize(
        &mut self,
        authority: Pubkey,
        market: Pubkey,
        token_mint: Pubkey,
        token_vault: Pubkey,
        yes_token_mint: Pubkey,
        no_token_mint: Pubkey,
        yes_token_vault: Pubkey,
        no_token_vault: Pubkey,
        fee_rate: u16,
        bump: u8,
    ) -> Result<()> {
        require!(fee_rate <= 1000, ZentroError::InvalidFeeRate); // Max 10%
        
        self.authority = authority;
        self.market = market;
        self.token_mint = token_mint;
        self.token_vault = token_vault;
        self.yes_token_mint = yes_token_mint;
        self.no_token_mint = no_token_mint;
        self.yes_token_vault = yes_token_vault;
        self.no_token_vault = no_token_vault;
        self.total_liquidity = 0;
        self.yes_reserves = 0;
        self.no_reserves = 0;
        self.fee_rate = fee_rate;
        self.accumulated_fees = 0;
        self.is_active = true;
        self.created_at = Clock::get()?.unix_timestamp;
        self.bump = bump;

        Ok(())
    }

    pub fn add_liquidity(&mut self, amount: u64) -> Result<u64> {
        require!(self.is_active, ZentroError::PoolInactive);
        require!(amount > 0, ZentroError::InvalidAmount);

        let liquidity_tokens = if self.total_liquidity == 0 {
            // Initial liquidity provision
            amount
        } else {
            // Calculate proportional liquidity tokens
            let total_reserves = self.yes_reserves.checked_add(self.no_reserves)
                .ok_or(ZentroError::MathOverflow)?;
            
            if total_reserves == 0 {
                amount
            } else {
                amount.checked_mul(self.total_liquidity)
                    .ok_or(ZentroError::MathOverflow)?
                    .checked_div(total_reserves)
                    .ok_or(ZentroError::MathOverflow)?
            }
        };

        // Add equal amounts to both reserves initially
        let half_amount = amount.checked_div(2).ok_or(ZentroError::MathOverflow)?;
        
        self.yes_reserves = self.yes_reserves.checked_add(half_amount)
            .ok_or(ZentroError::MathOverflow)?;
        self.no_reserves = self.no_reserves.checked_add(half_amount)
            .ok_or(ZentroError::MathOverflow)?;
        
        self.total_liquidity = self.total_liquidity.checked_add(liquidity_tokens)
            .ok_or(ZentroError::MathOverflow)?;

        Ok(liquidity_tokens)
    }

    pub fn remove_liquidity(&mut self, liquidity_tokens: u64) -> Result<(u64, u64)> {
        require!(self.is_active, ZentroError::PoolInactive);
        require!(liquidity_tokens > 0, ZentroError::InvalidAmount);
        require!(liquidity_tokens <= self.total_liquidity, ZentroError::InsufficientLiquidity);

        let yes_amount = self.yes_reserves.checked_mul(liquidity_tokens)
            .ok_or(ZentroError::MathOverflow)?
            .checked_div(self.total_liquidity)
            .ok_or(ZentroError::MathOverflow)?;

        let no_amount = self.no_reserves.checked_mul(liquidity_tokens)
            .ok_or(ZentroError::MathOverflow)?
            .checked_div(self.total_liquidity)
            .ok_or(ZentroError::MathOverflow)?;

        self.yes_reserves = self.yes_reserves.checked_sub(yes_amount)
            .ok_or(ZentroError::MathOverflow)?;
        self.no_reserves = self.no_reserves.checked_sub(no_amount)
            .ok_or(ZentroError::MathOverflow)?;
        
        self.total_liquidity = self.total_liquidity.checked_sub(liquidity_tokens)
            .ok_or(ZentroError::MathOverflow)?;

        Ok((yes_amount, no_amount))
    }

    pub fn get_swap_amount_out(&self, amount_in: u64, is_yes_to_no: bool) -> Result<u64> {
        require!(self.is_active, ZentroError::PoolInactive);
        require!(amount_in > 0, ZentroError::InvalidAmount);

        let (reserve_in, reserve_out) = if is_yes_to_no {
            (self.yes_reserves, self.no_reserves)
        } else {
            (self.no_reserves, self.yes_reserves)
        };

        require!(reserve_in > 0 && reserve_out > 0, ZentroError::InsufficientLiquidity);

        // Apply fee
        let fee_amount = amount_in.checked_mul(self.fee_rate as u64)
            .ok_or(ZentroError::MathOverflow)?
            .checked_div(10000)
            .ok_or(ZentroError::MathOverflow)?;

        let amount_in_after_fee = amount_in.checked_sub(fee_amount)
            .ok_or(ZentroError::MathOverflow)?;

        // Constant product formula: x * y = k
        // amount_out = (amount_in_after_fee * reserve_out) / (reserve_in + amount_in_after_fee)
        let numerator = amount_in_after_fee.checked_mul(reserve_out)
            .ok_or(ZentroError::MathOverflow)?;
        let denominator = reserve_in.checked_add(amount_in_after_fee)
            .ok_or(ZentroError::MathOverflow)?;

        let amount_out = numerator.checked_div(denominator)
            .ok_or(ZentroError::MathOverflow)?;

        require!(amount_out < reserve_out, ZentroError::InsufficientLiquidity);

        Ok(amount_out)
    }

    pub fn execute_swap(&mut self, amount_in: u64, amount_out: u64, is_yes_to_no: bool) -> Result<()> {
        require!(self.is_active, ZentroError::PoolInactive);
        require!(amount_in > 0 && amount_out > 0, ZentroError::InvalidAmount);

        let fee_amount = amount_in.checked_mul(self.fee_rate as u64)
            .ok_or(ZentroError::MathOverflow)?
            .checked_div(10000)
            .ok_or(ZentroError::MathOverflow)?;

        self.accumulated_fees = self.accumulated_fees.checked_add(fee_amount)
            .ok_or(ZentroError::MathOverflow)?;

        if is_yes_to_no {
            self.yes_reserves = self.yes_reserves.checked_add(amount_in)
                .ok_or(ZentroError::MathOverflow)?;
            self.no_reserves = self.no_reserves.checked_sub(amount_out)
                .ok_or(ZentroError::MathOverflow)?;
        } else {
            self.no_reserves = self.no_reserves.checked_add(amount_in)
                .ok_or(ZentroError::MathOverflow)?;
            self.yes_reserves = self.yes_reserves.checked_sub(amount_out)
                .ok_or(ZentroError::MathOverflow)?;
        }

        Ok(())
    }

    pub fn get_current_price(&self) -> Result<u64> {
        require!(self.yes_reserves > 0 && self.no_reserves > 0, ZentroError::InsufficientLiquidity);

        // Price as ratio scaled by 10^6 for precision
        let price = self.no_reserves.checked_mul(1_000_000)
            .ok_or(ZentroError::MathOverflow)?
            .checked_div(self.yes_reserves.checked_add(self.no_reserves)
                .ok_or(ZentroError::MathOverflow)?)
            .ok_or(ZentroError::MathOverflow)?;

        Ok(price)
    }

    pub fn deactivate(&mut self) -> Result<()> {
        self.is_active = false;
        Ok(())
    }

    pub fn collect_fees(&mut self) -> Result<u64> {
        let fees = self.accumulated_fees;
        self.accumulated_fees = 0;
        Ok(fees)
    }
}
```