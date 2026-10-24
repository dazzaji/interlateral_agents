# Provenance and adaptation boundary

Derived from controller tooling used in the 2026-10-22 accountable-agent framework fix sprint.
The original run accepted execution bundle core-05 and publication bundle pub-05. Those verdicts
covered exact historical tool hashes and assumptions, not this portable adaptation.

Retained: execution/capture separation, trusted Node test-event reporter, exact input/test pins,
STOP/deadline control, clean export, outgoing-history scan, publisher lease and candidate/tool
gates, lost-response reconciliation and exact PR readback.

Changed: repository, run identity, deadline, publisher, branch prefix, base branch, visibility and
private-term settings are explicit pinned policy; the old simulator and private machine paths
are removed; the hook uses the selected runtime. No original private run records or exception
allowlists are copied. Baseline template exceptions still require exact reviewed path/blob/base
and do not permit credentials.

New local tests exercise actual command capture and synthetic publication with no external
mutation. They include missing capture, failed tests, source/policy identity, STOP/deadline,
deleted-at-tip private history, wrong destinations, branch restrictions and restart reconciliation.
They are development regression evidence, not independent acceptance of every future use.

Source attribution/license is retained in SOURCE-LICENSE.txt. The original private manifest and
gate artifacts remain with their owning run; local program planning records their exact paths.
