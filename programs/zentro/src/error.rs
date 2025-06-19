```rust
use anchor_lang::prelude::*;

#[error_code]
pub enum ZentroError {
    #[msg("Market is not active")]
    MarketNotActive,
    
    #[msg("Market has already been resolved")]
    MarketAlreadyResolved,
    
    #[msg("Insufficient funds for prediction")]
    InsufficientFunds,
    
    #[msg("Invalid prediction amount")]
    InvalidPredictionAmount,
    
    #[msg("Market resolution time has not passed")]
    ResolutionTimeNotReached,
    
    #[msg("Only market creator can resolve")]
    UnauthorizedResolution,
    
    #[msg("Invalid outcome provided")]
    InvalidOutcome,
    
    #[msg("User has no position in this market")]
    NoPositionFound,
    
    #[msg("Cannot claim winnings from losing position")]
    CannotClaimLosingPosition,
    
    #[msg("Winnings already claimed")]
    WinningsAlreadyClaimed,
    
    #[msg("Market creation fee insufficient")]
    InsufficientCreationFee,
    
    #[msg("Invalid market duration")]
    InvalidMarketDuration,
    
    #[msg("Market title too long")]
    MarketTitleTooLong,
    
    #[msg("Market description too long")]
    MarketDescriptionTooLong,
    
    #[msg("Invalid oracle authority")]
    InvalidOracleAuthority,
    
    #[msg("Oracle has not provided resolution")]
    OracleResolutionPending,
    
    #[msg("Prediction deadline has passed")]
    PredictionDeadlinePassed,
    
    #[msg("Cannot cancel resolved market")]
    CannotCancelResolvedMarket,
    
    #[msg("Only market creator can cancel")]
    UnauthorizedCancellation,
    
    #[msg("Market has active predictions")]
    MarketHasActivePredictions,
}
```