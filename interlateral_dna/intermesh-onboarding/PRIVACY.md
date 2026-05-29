# InterMesh v1 Privacy Notes

InterMesh v1 is hub-mediated and not end-to-end encrypted. The service can
route and audit traffic and can see payloads unless a future secure-room mode is
added.

Participant inbox views are recipient-owned: they render payload bodies only
for messages addressed to the authenticated local participant identity.

Operator watch views are metadata-first by default. Treat inbound and outbound
ledgers as delivery metadata, not human-readable payload transcripts.

Admin payload export is sensitive. It requires an explicit payload flag plus
payload-export authorization, marks output as sensitive, and writes an audit
entry.

Raw tokens must not appear in GitHub, Jot, Slack, screenshots, public chat,
shared docs, logs, generated safe invite files, or evidence. Store local tokens
only in private token files with mode `0600`.
