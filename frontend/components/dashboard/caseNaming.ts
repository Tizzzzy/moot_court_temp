interface CaseNamingInput {
  alias?: string | null;
  plaintiff?: string | null;
  defendant?: string | null;
  caseNumber?: string | null;
}

export function buildCasePartyName(
  plaintiff?: string | null,
  defendant?: string | null
): string | null {
  const normalizedPlaintiff = plaintiff?.trim() || "Unknown";
  const normalizedDefendant = defendant?.trim() || "Unknown";

  if (!plaintiff?.trim() && !defendant?.trim()) {
    return null;
  }

  return `${normalizedPlaintiff} vs ${normalizedDefendant}`;
}

export function resolveCaseDisplayName({
  alias,
  plaintiff,
  defendant,
  caseNumber,
}: CaseNamingInput): string {
  const normalizedAlias = alias?.trim();
  if (normalizedAlias) {
    return normalizedAlias;
  }

  const parties = buildCasePartyName(plaintiff, defendant);
  if (parties) {
    return parties;
  }

  return caseNumber?.trim() || "Unnamed";
}
