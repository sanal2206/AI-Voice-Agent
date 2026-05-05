def handle_objection(text: str) -> bool:
    """
    Analyzes the text for common sales objections.
    Returns True if an objection is detected, False otherwise.
    """
    objections = ["too expensive", "not interested", "call later", "no time", "send me an email"]
    text_lower = text.lower()
    for obj in objections:
        if obj in text_lower:
            return True
    return False
