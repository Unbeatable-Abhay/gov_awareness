from typing import List, Optional

from pydantic import BaseModel, Field


class HowToApply(BaseModel):
    mode: str = Field(description="One of: online, offline, both")
    steps: List[str] = Field(description="Ordered, concrete steps to apply for the scheme")


class SchemeItem(BaseModel):
    scheme_name: str
    description: str = Field(description="2-4 sentence plain-language summary of the scheme")
    category: str = Field(description="e.g. Housing, Education, Health, Agriculture, Employment")
    ministry: str = Field(description="Government ministry/department running the scheme")
    eligibility: List[str]
    benefits: List[str]
    how_to_apply: HowToApply
    documents_required: List[str]
    official_link: str = Field(description="Official government portal URL for this scheme")
    application_link: Optional[str] = Field(
        default="",
        description="Direct application/form URL if different from official_link",
    )


class SchemeResponse(BaseModel):
    schemes: List[SchemeItem] = Field(description="One entry per relevant scheme found")
    disclaimer: str = Field(
        default="This information is for awareness purposes only. Please verify through official government portals before applying."
    )


class LegalResponse(BaseModel):
    topic: str = Field(description="Short label for what the query is about")
    explanation: str = Field(description="Plain-language explanation of the citizen's rights/situation")
    relevant_provisions: List[str] = Field(
        default_factory=list, description="Relevant acts/sections/laws if available"
    )
    citizen_rights: List[str] = Field(description="Concrete rights the citizen has in this situation")
    authority_limits: List[str] = Field(
        default_factory=list,
        description="Limits on police/government authority relevant to the query",
    )
    sources: List[str] = Field(default_factory=list, description="Official/legal source links used")
    disclaimer: str = Field(
        default="This information is for awareness purposes only. This is not legal advice. Please consult a qualified lawyer before taking legal action."
    )
