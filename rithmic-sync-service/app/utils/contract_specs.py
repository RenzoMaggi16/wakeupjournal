# Dictionary mapping Rithmic security codes to their point values.
# Add or modify values according to typical futures contracts traded.
CONTRACT_MULTIPLIERS = {
    # Equity Indices
    "ES": 50.0,
    "MES": 5.0,
    "NQ": 20.0,
    "MNQ": 2.0,
    "YM": 5.0,
    "MYM": 0.5,
    "RTY": 50.0,
    "M2K": 5.0,
    
    # Energies
    "CL": 1000.0,
    "MCL": 100.0,
    "NG": 10000.0,
    "QG": 2500.0,

    # Metals
    "GC": 100.0,
    "MGC": 10.0,
    "SI": 5000.0,
    "SIL": 1000.0,
    "HG": 25000.0,
    
    # Treasuries
    "ZB": 1000.0,
    "ZN": 1000.0,
    "ZF": 1000.0,
    "ZT": 2000.0,
    
    # Currencies
    "6E": 125000.0,
    "6B": 62500.0,
    "6J": 12500000.0,
}

def get_point_value(symbol: str) -> float:
    """
    Extracts the base symbol (e.g., 'ESM4' -> 'ES') and returns the multiplier.
    Defaults to 1.0 if unknown.
    """
    # Simple heuristic: extract alpha prefix.
    base_symbol = ''.join(filter(str.isalpha, symbol.split('.')[0])) # Rithmic format often has exchange suffix, e.g. ESM4.CME
    
    # Handle cases where year/month letter might be part of the extracted string.
    # Usually futures symbols are 2-3 letters. Let's just do a prefix match.
    for key in sorted(CONTRACT_MULTIPLIERS.keys(), key=len, reverse=True):
        if base_symbol.startswith(key):
            return CONTRACT_MULTIPLIERS[key]
            
    return 1.0 # Default if not found
