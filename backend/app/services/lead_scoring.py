def score_lead(text: str) -> float:
    """
    Calculates a lead score based on the user's input text.
    """
    # Placeholder for actual lead scoring logic
    text_lower = text.lower()
    score = 0.5 # Base score
    
    positive_keywords = ["buy", "interested", "tell me more", "price", "demo"]
    negative_keywords = ["not interested", "stop", "unsubscribe", "wrong number"]
    
    for word in positive_keywords:
        if word in text_lower:
            score += 0.2
            
    for word in negative_keywords:
        if word in text_lower:
            score -= 0.3
            
    # Keep score between 0.0 and 1.0
    return max(0.0, min(1.0, score))
