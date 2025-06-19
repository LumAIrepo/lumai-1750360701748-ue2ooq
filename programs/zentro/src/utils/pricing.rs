```rust
use anchor_lang::prelude::*;
use std::cmp;

#[derive(Debug, Clone, Copy)]
pub struct PricingParams {
    pub base_price: u64,
    pub volatility_factor: u64,
    pub liquidity_depth: u64,
    pub time_decay_factor: u64,
}

impl Default for PricingParams {
    fn default() -> Self {
        Self {
            base_price: 5000, // 50.00% in basis points
            volatility_factor: 100,
            liquidity_depth: 1000000, // 1M lamports
            time_decay_factor: 50,
        }
    }
}

pub fn calculate_market_price(
    yes_shares: u64,
    no_shares: u64,
    total_liquidity: u64,
    params: &PricingParams,
) -> Result<u64> {
    if yes_shares == 0 && no_shares == 0 {
        return Ok(params.base_price);
    }

    let total_shares = yes_shares.saturating_add(no_shares);
    if total_shares == 0 {
        return Ok(params.base_price);
    }

    // Calculate probability based on share distribution
    let yes_probability = (yes_shares as u128)
        .saturating_mul(10000)
        .saturating_div(total_shares as u128) as u64;

    // Apply liquidity adjustment
    let liquidity_factor = calculate_liquidity_factor(total_liquidity, params.liquidity_depth);
    let adjusted_probability = apply_liquidity_adjustment(yes_probability, liquidity_factor);

    // Apply volatility factor
    let final_price = apply_volatility_adjustment(adjusted_probability, params.volatility_factor);

    Ok(cmp::min(final_price, 9900)) // Cap at 99%
}

pub fn calculate_share_price(
    market_price: u64,
    share_amount: u64,
    is_yes_share: bool,
    total_liquidity: u64,
) -> Result<u64> {
    let base_price = if is_yes_share {
        market_price
    } else {
        10000_u64.saturating_sub(market_price)
    };

    // Calculate price impact based on share amount and liquidity
    let price_impact = calculate_price_impact(share_amount, total_liquidity);
    let adjusted_price = if is_yes_share {
        base_price.saturating_add(price_impact)
    } else {
        base_price.saturating_add(price_impact)
    };

    // Calculate total cost
    let total_cost = (adjusted_price as u128)
        .saturating_mul(share_amount as u128)
        .saturating_div(10000) as u64;

    Ok(total_cost)
}

pub fn calculate_payout(
    shares_owned: u64,
    market_outcome: bool,
    is_yes_share: bool,
) -> Result<u64> {
    if (market_outcome && is_yes_share) || (!market_outcome && !is_yes_share) {
        Ok(shares_owned) // 1:1 payout for winning shares
    } else {
        Ok(0) // No payout for losing shares
    }
}

pub fn calculate_liquidity_factor(current_liquidity: u64, target_liquidity: u64) -> u64 {
    if target_liquidity == 0 {
        return 100;
    }

    let ratio = (current_liquidity as u128)
        .saturating_mul(100)
        .saturating_div(target_liquidity as u128) as u64;

    cmp::min(ratio, 200) // Cap at 2x
}

pub fn apply_liquidity_adjustment(base_price: u64, liquidity_factor: u64) -> u64 {
    if liquidity_factor >= 100 {
        return base_price;
    }

    // Reduce price stability when liquidity is low
    let adjustment = (100_u64.saturating_sub(liquidity_factor))
        .saturating_mul(base_price)
        .saturating_div(1000);

    if base_price > 5000 {
        base_price.saturating_add(adjustment)
    } else {
        base_price.saturating_sub(adjustment)
    }
}

pub fn apply_volatility_adjustment(base_price: u64, volatility_factor: u64) -> u64 {
    let volatility_adjustment = volatility_factor
        .saturating_mul(base_price)
        .saturating_div(10000);

    base_price.saturating_add(volatility_adjustment)
}

pub fn calculate_price_impact(share_amount: u64, total_liquidity: u64) -> u64 {
    if total_liquidity == 0 {
        return 500; // 5% default impact
    }

    let impact_ratio = (share_amount as u128)
        .saturating_mul(10000)
        .saturating_div(total_liquidity as u128) as u64;

    // Square root approximation for diminishing returns
    let sqrt_impact = integer_sqrt(impact_ratio);
    cmp::min(sqrt_impact, 1000) // Cap at 10%
}

pub fn calculate_time_decay(
    base_price: u64,
    time_remaining: i64,
    total_duration: i64,
    decay_factor: u64,
) -> Result<u64> {
    if total_duration <= 0 || time_remaining <= 0 {
        return Ok(base_price);
    }

    let time_ratio = (time_remaining as u128)
        .saturating_mul(100)
        .saturating_div(total_duration as u128) as u64;

    let decay_adjustment = decay_factor
        .saturating_mul(100_u64.saturating_sub(time_ratio))
        .saturating_div(10000);

    if base_price > 5000 {
        Ok(base_price.saturating_sub(decay_adjustment))
    } else {
        Ok(base_price.saturating_add(decay_adjustment))
    }
}

pub fn calculate_arbitrage_opportunity(
    market_a_price: u64,
    market_b_price: u64,
    threshold: u64,
) -> Option<(bool, u64)> {
    let price_diff = if market_a_price > market_b_price {
        market_a_price.saturating_sub(market_b_price)
    } else {
        market_b_price.saturating_sub(market_a_price)
    };

    if price_diff > threshold {
        Some((market_a_price > market_b_price, price_diff))
    } else {
        None
    }
}

fn integer_sqrt(n: u64) -> u64 {
    if n == 0 {
        return 0;
    }
    
    let mut x = n;
    let mut y = (x + 1) / 2;
    
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    
    x
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_market_price() {
        let params = PricingParams::default();
        let price = calculate_market_price(100, 100, 1000000, &params).unwrap();
        assert_eq!(price, params.base_price);
    }

    #[test]
    fn test_calculate_share_price() {
        let price = calculate_share_price(5000, 100, true, 1000000).unwrap();
        assert!(price > 0);
    }

    #[test]
    fn test_calculate_payout() {
        let payout = calculate_payout(100, true, true).unwrap();
        assert_eq!(payout, 100);
        
        let no_payout = calculate_payout(100, true, false).unwrap();
        assert_eq!(no_payout, 0);
    }

    #[test]
    fn test_price_impact() {
        let impact = calculate_price_impact(1000, 100000);
        assert!(impact > 0);
        assert!(impact <= 1000);
    }

    #[test]
    fn test_integer_sqrt() {
        assert_eq!(integer_sqrt(0), 0);
        assert_eq!(integer_sqrt(1), 1);
        assert_eq!(integer_sqrt(4), 2);
        assert_eq!(integer_sqrt(9), 3);
        assert_eq!(integer_sqrt(16), 4);
    }
}
```