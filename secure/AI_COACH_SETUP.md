# ResearchLab AI Research Coach — administrator guide

## Feature
Students can request AI feedback on research questions, literature-search plans, methods and critical analysis within the secure course workspace. The AI does **not** conduct live scholarly searches or invent citations, and students remain responsible for validating results.

## Activation (administrator only)
The feature is installed but **off by default**. In Render, open the **researchlab-secure** web service → **Environment** and add:
- `OPENAI_API_KEY` = a confidential OpenAI API project key (never place it in GitHub, student HTML, screenshots or chat).
- `AI_COACH_ENABLED` = `true` **only after** an authorized institutional privacy/security assessment, provider contract review and API billing controls are in place.
- `AI_COACH_MODEL` = `gpt-4.1-mini` (or another approved, available model).

Save and redeploy. The student page displays **Available** when both settings are active. Otherwise, the panel explains that the feature is not configured.

## Safeguards
- Only authenticated students can access the AI endpoint.
- AI receives **only the question explicitly typed and submitted**; no saved group drafts, identities, email addresses or chat histories are automatically included.
- Consent checkbox before each use; advises not to share sensitive personal/company data.
- Server limits each student to **6 requests per 15 minutes** and **12 per calendar day**. The daily counter is persisted in Postgres. Questions/AI answers are not saved by ResearchLab.
- OpenAI API request includes `store: false`; this does not replace checking external provider data handling, residency and university obligations.
- The response is advisory, not a grade or evidence of research quality. Students should verify citations and results.

## Costs
OpenAI API usage is **separate** from ChatGPT subscriptions and from Render hosting. Check current API pricing and set project spending limits at https://platform.openai.com . The per-student request limits mitigate but do not guarantee a monthly budget cap.

## Testing
First sign in with an authorized test student account. Verify the status badge, make one non-sensitive test question, then test lecturer feedback and group autosave separately. Do not roll out to real student records before institutional approval.

## Availability
Render's free pilot database previously showed an expiry date of **20 December 2026**. Upgrade or migrate before reliance on the platform for assessed coursework.
