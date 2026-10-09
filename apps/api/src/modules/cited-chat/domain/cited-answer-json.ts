export interface CitedClaimJson {
  text: string;
  source: string;
  quote: string;
}

export interface CitedAnswerJson {
  claims: CitedClaimJson[];
}
