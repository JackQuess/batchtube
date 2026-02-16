class ProviderError extends Error {
  constructor(code, message, hint) {
    super(message);
    this.name = 'ProviderError';
    this.code = code || 'UNKNOWN';
    this.hint = hint;
  }
}

function mapCommonProviderError(error, fallbackCode) {
  const text = String(error?.message || error || '');
  const lower = text.toLowerCase();

  if (
    lower.includes("confirm you're not a bot")
    || lower.includes('confirm you are not a bot')
    || lower.includes('confirm you’re not a bot')
  ) {
    return new ProviderError(
      'NEEDS_VERIFICATION',
      text || 'Verification required',
      'Retry later or use a different source URL.'
    );
  }

  if (lower.includes('confirm your age')) {
    return new ProviderError(
      'RESTRICTED',
      text || 'Age-restricted content',
      'This content cannot be downloaded without account verification.'
    );
  }

  if (lower.includes('403') || lower.includes('forbidden')) {
    return new ProviderError(
      'FORBIDDEN',
      text || 'Forbidden',
      'The source rejected access to this media.'
    );
  }

  if (error instanceof ProviderError) {
    return error;
  }

  return new ProviderError(fallbackCode || 'UNKNOWN', text || 'Unknown provider error');
}

module.exports = {
  ProviderError,
  mapCommonProviderError
};
