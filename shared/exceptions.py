"""Common exceptions for FinCoach modules."""


class FinCoachError(Exception):
    """Base exception for FinCoach."""


class MarketDataError(FinCoachError):
    """Market data fetch or parse failure (은서 영역)."""


class PortfolioValidationError(FinCoachError):
    """Invalid portfolio input (현태 영역)."""


class ChatContextError(FinCoachError):
    """Chat context build failure (수빈 영역)."""
