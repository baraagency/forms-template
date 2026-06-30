#!/usr/bin/env bun

import {
  buildSignedFubContext,
  decodeBase64Url,
  verifyFubContextSignature,
} from "../../app/forms/_core/fubContextVerify";
import {
  MOCK_AGENT_ID,
  MOCK_PERSON_ID,
} from "../../app/api/_fixtures/constants";

const secret = process.env.FUB_SECRET_KEY ?? "dev-secret-for-local-testing";

const payload = {
  clientName: "Jane Client",
  fubUserId: MOCK_AGENT_ID,
  fubUserName: "Alex Agent",
  fubPersonId: MOCK_PERSON_ID,
  accountId: 1,
  person: {
    id: MOCK_PERSON_ID,
    firstName: "Jane",
    lastName: "Client",
  },
  user: {
    id: MOCK_AGENT_ID,
    name: "Alex Agent",
  },
};

const { context, signature } = buildSignedFubContext(payload, secret);

console.log("FUB embedded context test URL params:\n");
console.log(`context=${encodeURIComponent(context)}`);
console.log(`signature=${signature}\n`);
console.log("Full /forms URL:");
console.log(
  `http://localhost:3000/forms?context=${encodeURIComponent(context)}&signature=${signature}`,
);
console.log("\nVerification check:", verifyFubContextSignature(context, signature));
console.log("Decoded payload:", JSON.stringify(JSON.parse(decodeBase64Url(context)), null, 2));
