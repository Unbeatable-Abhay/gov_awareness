from typing import List, Optional

from pydantic import BaseModel, Field


class HowToApply(BaseModel):
    mode: str = Field(description="One of: online, offline, both")
    steps: List[str] = Field(
        description=(
            "Ordered, concrete steps to apply for the scheme. Each step should be a "
            "full sentence explaining what to do and why, not a short fragment — e.g. "
            "'Visit the official CSC portal and register using your Aadhaar number, "
            "which will be used to verify your identity and pre-fill your details.'"
        )
    )


class SchemeItem(BaseModel):
    scheme_name: str
    description: str = Field(
        description=(
            "A detailed, in-depth explanation of the scheme — at least 6-10 sentences. "
            "Cover what the scheme is, which problem it was created to solve, who launched "
            "it and when if known, how it works in practice, and why it matters for the "
            "citizen. Write for someone who has never heard of this scheme before."
        )
    )
    category: str = Field(description="e.g. Housing, Education, Health, Agriculture, Employment")
    ministry: str = Field(description="Government ministry/department running the scheme")
    eligibility: List[str] = Field(
        description=(
            "Detailed eligibility criteria. Each item should fully explain one criterion "
            "in plain language (not a short fragment) — e.g. 'Applicant's family annual "
            "income must be below Rs 2.5 lakh, as verified through income certificate "
            "issued by the local tehsildar or equivalent authority.'"
        )
    )
    benefits: List[str] = Field(
        description=(
            "Detailed list of benefits. Each item should explain the benefit concretely, "
            "including amounts, frequency, or scope where known — e.g. 'Monthly pension of "
            "Rs 3,000 credited directly to the beneficiary's bank account via DBT, starting "
            "from the month following application approval.'"
        )
    )
    how_to_apply: HowToApply
    documents_required: List[str]
    official_link: str = Field(description="Official government portal URL for this scheme")
    application_link: Optional[str] = Field(
        default="",
        description="Direct application/form URL if different from official_link",
    )
    financial_benefits: str = Field(
        default="",
        description=(
            "A clear paragraph laying out the exact financial details of the scheme — "
            "amounts, subsidy percentages, loan limits, payout frequency, and any caps or "
            "conditions on the money involved. Leave empty if the scheme has no direct "
            "financial component."
        ),
    )
    deadline: str = Field(
        default="",
        description=(
            "When applications are accepted — e.g. 'Ongoing/rolling, accepted year-round' "
            "or 'Seasonal window, typically open March to June each year.' State clearly "
            "if it's unknown rather than guessing."
        ),
    )
    rejection_reasons: List[str] = Field(
        default_factory=list,
        description=(
            "Common, concrete reasons applications for this scheme get rejected or "
            "delayed, so the applicant can avoid them — e.g. 'Mismatch between Aadhaar "
            "name and bank account name', 'Missing income certificate.'"
        ),
    )
    helpline_contact: str = Field(
        default="",
        description=(
            "Official helpline phone number and/or email for questions or grievances "
            "related to this scheme, if found via search. Leave empty if not found."
        ),
    )


class SchemeResponse(BaseModel):
    schemes: List[SchemeItem] = Field(
        description="Up to 4 of the most relevant schemes found, ranked by relevance to the query."
    )
    disclaimer: str = Field(
        default="This information is for awareness purposes only. Please verify through official government portals before applying."
    )


class LegalResponse(BaseModel):
    topic: str = Field(description="Short label for what the query is about")
    explanation: str = Field(
        description=(
            "A thorough, in-depth explanation of the citizen's rights and situation — "
            "at least 8-12 sentences. Analyze the specific scenario described by the user "
            "carefully: explain the relevant legal context, how the law applies to their "
            "exact situation, what typically happens in practice, and any nuances or "
            "exceptions that matter. Write like you're helping someone genuinely understand "
            "their situation deeply, not just stating a fact."
        )
    )
    relevant_provisions: List[str] = Field(
        default_factory=list,
        description=(
            "Relevant acts/sections/laws, each explained in a full sentence covering what "
            "the provision says and how it applies here — not just a bare citation."
        ),
    )
    citizen_rights: List[str] = Field(
        description=(
            "Concrete rights the citizen has in this situation, each explained fully "
            "with practical context on how to exercise or invoke that right."
        )
    )
    authority_limits: List[str] = Field(
        default_factory=list,
        description=(
            "Limits on police/government authority relevant to the query, explained "
            "concretely — what they can and cannot legally do in this scenario."
        ),
    )
    sources: List[str] = Field(
        default_factory=list,
        description=(
            "Actual clickable URLs to the official/legal sources used (e.g. "
            "'https://www.ugc.gov.in/...', not just the organization's name). "
            "Only include a URL if you actually found and verified it via "
            "search — never guess or construct a plausible-looking URL."
        ),
    )
    disclaimer: str = Field(
        default="This information is for awareness purposes only. This is not legal advice. Please consult a qualified lawyer before taking legal action."
    )


class SchemeListItem(BaseModel):
    scheme_name: str
    category: str = Field(description="e.g. Housing, Education, Health, Agriculture, Employment")
    ministry: str = Field(description="Government ministry/department running the scheme")
    financial_benefits: str = Field(
        default="",
        description=(
            "A short one-line hook on the money involved — e.g. 'Up to Rs 6,000/year' "
            "or 'Loan up to Rs 10 lakh, no collateral'. Keep it brief, this is a preview "
            "for a list view, not the full detail."
        ),
    )


class SchemeListResponse(BaseModel):
    schemes: List[SchemeListItem] = Field(
        description="Up to 8 of the most relevant schemes found, ranked by relevance to the query."
    )
    disclaimer: str = Field(
        default="This information is for awareness purposes only. Please verify through official government portals before applying."
    )