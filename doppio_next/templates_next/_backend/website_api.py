import frappe
from frappe import _
from frappe.utils import escape_html, random_string


@frappe.whitelist(allow_guest=True)
def get_website_settings():
    """Public subset of Website Settings for the __SPA__ SPA.

    Guests cannot read the Website Settings doc directly, so expose
    only the branding/navigation fields the frontend needs.
    """
    ws = frappe.get_cached_doc("Website Settings")

    def items(rows):
        return [
            {
                "label": row.label,
                "url": row.url,
                "parent_label": row.parent_label,
                "right": row.right,
                "open_in_new_tab": row.open_in_new_tab,
            }
            for row in rows
        ]

    return {
        "app_name": ws.app_name,
        "title_prefix": ws.get("title_prefix"),
        "banner_html": ws.get("banner_html"),
        "show_account_deletion_link": ws.get("show_account_deletion_link"),
        "app_logo": ws.app_logo,
        "banner_image": ws.banner_image,
        "favicon": ws.favicon,
        "disable_signup": ws.disable_signup,
        "hide_login": ws.hide_login,
        "show_footer_on_login": ws.show_footer_on_login,
        "hide_footer_signup": ws.hide_footer_signup,
        "navbar_search": ws.navbar_search,
        "copyright": ws.copyright,
        "address": ws.address,
        # not present on older Frappe versions
        "footer_logo": ws.get("footer_logo"),
        "footer_powered": ws.get("footer_powered"),
        # custom fields from the Adi Settings tab (may not exist yet)
        "default_website_theme": ws.get("default_website_theme"),
        "homepage_design": ws.get("homepage_design"),
        "homepage_title": ws.get("homepage_title"),
        "homepage_tagline": ws.get("homepage_tagline"),
        "homepage_cta_label": ws.get("homepage_cta_label"),
        "homepage_cta_url": ws.get("homepage_cta_url"),
        "call_to_action": ws.get("call_to_action"),
        "call_to_action_url": ws.get("call_to_action_url"),
        "navbar_style": ws.get("navbar_style"),
        "navbar_color": ws.get("navbar_color"),
        "navbar_gradient_from": ws.get("navbar_gradient_from"),
        "navbar_gradient_to": ws.get("navbar_gradient_to"),
        "navbar_text": ws.get("navbar_text"),
        "contact_email": ws.get("contact_email"),
        "footer_contact_text": ws.get("footer_contact_text"),
        "brand_primary_color": ws.get("brand_primary_color"),
        "brand_secondary_color": ws.get("brand_secondary_color"),
        "require_terms": ws.get("require_terms"),
        "terms_content": ws.get("terms_content"),
        "top_bar_items": items(ws.top_bar_items),
        "footer_items": items(ws.footer_items),
    }


@frappe.whitelist(allow_guest=True)
def get_about_settings():
    """Content for the /about page from Frappe's About Us Settings —
    returns None when empty/disabled so the SPA uses its built-in copy."""
    try:
        about = frappe.get_cached_doc("About Us Settings")
    except Exception:
        return None
    if about.get("is_disabled"):
        return None
    has_content = (
        about.get("page_title")
        or about.get("company_introduction")
        or about.company_history
        or about.team_members
    )
    if not has_content:
        return None
    return {
        "page_title": about.get("page_title"),
        "company_introduction": about.get("company_introduction"),
        "company_history_heading": about.get("company_history_heading"),
        "company_history": [
            {"year": row.year, "highlight": row.highlight}
            for row in about.company_history
        ],
        "team_members_heading": about.get("team_members_heading"),
        "team_members_subtitle": about.get("team_members_subtitle"),
        "team_members": [
            {
                "full_name": row.full_name,
                "image_link": row.get("image_link"),
                "bio": row.bio,
            }
            for row in about.team_members
        ],
        "footer": about.get("footer"),
    }


@frappe.whitelist(allow_guest=True)
def get_contact_settings():
    """Content for the /contact page from Frappe's Contact Us Settings —
    None when empty/disabled so the SPA uses its built-in copy. The form
    submits through frappe.www.contact.send_message (forwards to
    forward_to_email)."""
    try:
        contact = frappe.get_cached_doc("Contact Us Settings")
    except Exception:
        return None
    if contact.get("is_disabled"):
        return None
    if not (
        contact.get("heading")
        or contact.get("email_id")
        or contact.get("phone")
        or contact.get("address_line1")
    ):
        return None
    address_lines = [
        line.strip(" ,")
        for line in (
            contact.get("address_title"),
            contact.get("address_line1"),
            contact.get("address_line2"),
        )
        if line and line.strip(" ,")
    ]
    locality = " ".join(
        part
        for part in (
            contact.get("city"),
            contact.get("state"),
            contact.get("pincode"),
        )
        if part
    )
    if locality:
        address_lines.append(locality)
    if contact.get("country"):
        address_lines.append(contact.get("country"))
    return {
        "heading": contact.get("heading"),
        "introduction": contact.get("introduction"),
        "query_options": [
            option.strip()
            for option in (contact.get("query_options") or "").split("\n")
            if option.strip()
        ],
        "address_lines": address_lines,
        "phone": contact.get("phone"),
        "email_id": contact.get("email_id"),
    }


@frappe.whitelist(allow_guest=True)
def get_social_logins(redirect_to="/"):
    """Enabled Social Login Keys with ready-to-use authorize URLs for
    the SPA login page (same providers Frappe's own login shows)."""
    from frappe.utils.oauth import get_oauth2_authorize_url

    providers = []
    for key in frappe.get_all(
        "Social Login Key",
        filters={"enable_social_login": 1},
        fields=["name", "provider_name", "icon"],
    ):
        try:
            providers.append(
                {
                    "name": key.name,
                    "provider_name": key.provider_name,
                    "icon": key.icon,
                    "auth_url": get_oauth2_authorize_url(
                        key.name, redirect_to
                    ),
                }
            )
        except Exception:
            # misconfigured provider — skip rather than break login
            continue
    return providers


def _require_login():
    if frappe.session.user == "Guest":
        frappe.throw(_("Please log in first"), frappe.PermissionError)


HOMEPAGE_DESIGNS = (
    "classic",
    "ecommerce",
    "portal",
    "personal",
    "erpnext",
    "custom",
)


@frappe.whitelist()
def set_homepage_design(design):
    """Switch the homepage design (the 'Use this' button on /demos
    pages). Needs write access to Website Settings."""
    _require_login()
    if not frappe.has_permission("Website Settings", "write"):
        frappe.throw(_("Not permitted"), frappe.PermissionError)
    if design not in HOMEPAGE_DESIGNS:
        frappe.throw(_("Unknown homepage design: {0}").format(design))
    frappe.db.set_single_value("Website Settings", "homepage_design", design)
    frappe.db.commit()
    frappe.clear_cache()
    return {"homepage_design": design}


@frappe.whitelist()
def get_session_user():
    """Profile of the logged-in user for the navbar avatar and
    the My Account page."""
    _require_login()
    user = frappe.get_doc("User", frappe.session.user)
    return {
        "user": user.name,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": user.full_name,
        "user_image": user.user_image,
        "mobile_no": user.mobile_no,
        "phone": user.phone,
        # "System User" == desk access (shows the Desk link)
        "desk_access": user.user_type == "System User",
    }


@frappe.whitelist()
def update_my_profile(
    first_name=None, last_name=None, mobile_no=None, phone=None
):
    """Let the logged-in user edit their own basic profile fields."""
    _require_login()
    user = frappe.get_doc("User", frappe.session.user)
    for field, value in {
        "first_name": first_name,
        "last_name": last_name,
        "mobile_no": mobile_no,
        "phone": phone,
    }.items():
        if value is not None:
            user.set(field, value)
    user.flags.ignore_permissions = True
    user.save()
    frappe.db.commit()
    return get_session_user()


@frappe.whitelist()
def get_portal_sections():
    """My Account sections from Portal Settings: enabled menu items
    whose role the logged-in user has (no role = everyone)."""
    _require_login()
    user_roles = set(frappe.get_roles())
    sections = []
    try:
        portal = frappe.get_cached_doc("Portal Settings")
    except Exception:
        return sections
    for item in portal.menu:
        if not item.enabled:
            continue
        if item.role and item.role not in user_roles:
            continue
        if not item.reference_doctype or not frappe.db.exists(
            "DocType", item.reference_doctype
        ):
            continue
        sections.append(
            {"title": item.title, "doctype": item.reference_doctype}
        )
    return sections


def _party_filters(meta, user):
    """Restrict a portal list to the logged-in user: linked
    customer/supplier when ERPNext linkage exists, else own docs."""
    try:
        from erpnext.controllers.website_list_for_contact import (
            get_customers_suppliers,
        )

        customers, suppliers = get_customers_suppliers(meta.name, user)
        if customers and meta.has_field("customer"):
            return {"customer": ["in", customers]}
        if suppliers and meta.has_field("supplier"):
            return {"supplier": ["in", suppliers]}
    except Exception:
        pass
    if meta.has_field("raised_by"):
        return {"raised_by": user}
    return {"owner": user}


@frappe.whitelist()
def get_portal_list(doctype, limit=20):
    """Rows for one My Account section (doctype must be granted by
    Portal Settings for this user)."""
    _require_login()
    allowed = {s["doctype"] for s in get_portal_sections()}
    if doctype not in allowed:
        frappe.throw(_("Not permitted"), frappe.PermissionError)

    user = frappe.session.user
    meta = frappe.get_meta(doctype)
    filters = _party_filters(meta, user)
    if meta.is_submittable:
        filters["docstatus"] = ["<", 2]

    date_field = next(
        (
            f
            for f in ("transaction_date", "posting_date", "date")
            if meta.has_field(f)
        ),
        None,
    )
    subject_field = next(
        (
            f
            for f in ("subject", "title", "project_name", "item_name")
            if meta.has_field(f)
        ),
        None,
    )
    has_status = bool(meta.has_field("status"))
    has_total = bool(meta.has_field("grand_total"))

    fields = ["name", "creation"]
    if date_field:
        fields.append(date_field)
    if subject_field:
        fields.append(subject_field)
    if has_status:
        fields.append("status")
    if has_total:
        fields.append("grand_total")
        if meta.has_field("currency"):
            fields.append("currency")

    rows = frappe.get_all(
        doctype,
        filters=filters,
        fields=fields,
        order_by="creation desc",
        limit=min(int(limit), 50),
    )
    return {
        "has_status": has_status,
        "has_total": has_total,
        "has_subject": bool(subject_field),
        "rows": [
            {
                "name": row.name,
                "date": str(row.get(date_field) or row.creation)[:10],
                "subject": row.get(subject_field),
                "status": row.get("status"),
                "total": row.get("grand_total"),
                "currency": row.get("currency"),
            }
            for row in rows
        ],
    }


@frappe.whitelist()
def raise_issue(subject, description=None):
    """Create a support Issue raised by the logged-in user."""
    _require_login()
    if not frappe.db.exists("DocType", "Issue"):
        frappe.throw(_("Support issues are not enabled on this site"))
    doc = frappe.get_doc(
        {
            "doctype": "Issue",
            "subject": escape_html(subject),
            "description": description,
            "raised_by": frappe.session.user,
        }
    )
    doc.flags.ignore_permissions = True
    doc.insert()
    frappe.db.commit()
    return {"name": doc.name}


@frappe.whitelist(allow_guest=True)
def subscribe(email):
    """Footer newsletter signup — stores the address in the 'Website'
    Email Group (shown when Website Settings hide_footer_signup is off)."""
    from frappe.utils import validate_email_address

    validate_email_address(email, throw=True)
    if frappe.db.get_creation_count("Email Group Member", 60) > 300:
        frappe.throw(_("Too many signups right now, please try again later"))

    group = "Website"
    if not frappe.db.exists("Email Group", group):
        frappe.get_doc({"doctype": "Email Group", "title": group}).insert(
            ignore_permissions=True
        )
    if frappe.db.exists(
        "Email Group Member", {"email": email, "email_group": group}
    ):
        return _("You are already subscribed")
    frappe.get_doc(
        {
            "doctype": "Email Group Member",
            "email": email,
            "email_group": group,
            "unsubscribed": 0,
        }
    ).insert(ignore_permissions=True)
    frappe.db.commit()
    return _("Subscribed — thank you!")


@frappe.whitelist(allow_guest=True)
def sign_up(email, full_name, mobile_no=None, redirect_to=None):
    """Frappe's standard sign-up flow plus a mobile number.

    Mirrors frappe.core.doctype.user.user.sign_up (same return codes,
    same disable_signup enforcement) so the SPA can collect a phone
    number during registration.
    """
    from frappe.website.utils import is_signup_disabled

    if is_signup_disabled():
        frappe.throw(_("Sign Up is disabled"), _("Not Allowed"))

    user = frappe.db.get("User", {"email": email})
    if user:
        if user.enabled:
            return 0, _("Already Registered")
        return 0, _("Registered but disabled")

    if frappe.db.get_creation_count("User", 60) > 300:
        frappe.throw(
            _("Too many users signed up recently, please try again later")
        )

    user = frappe.get_doc(
        {
            "doctype": "User",
            "email": email,
            "first_name": escape_html(full_name),
            "mobile_no": mobile_no,
            "enabled": 1,
            "new_password": random_string(10),
            "user_type": "Website User",
        }
    )
    user.flags.ignore_permissions = True
    user.flags.ignore_password_policy = True
    user.insert()

    # default signup role, same as frappe's own sign_up
    default_role = frappe.db.get_single_value("Portal Settings", "default_role")
    if default_role:
        user.add_roles(default_role)

    if redirect_to:
        frappe.cache.hset("redirect_after_login", user.name, redirect_to)

    if user.flags.email_sent:
        return 1, _("Please check your email for verification")
    return 2, _("Please ask your administrator to verify your sign-up")


# ------------------------------------------------------------------ #
# Site setup (runs on app install and from `bench add-next-spa`)     #
# ------------------------------------------------------------------ #

ADI_SETTINGS_FIELDS = [
    {
        "fieldname": "adi_settings_tab",
        "fieldtype": "Tab Break",
        "label": "Adi Settings",
    },
    {
        "fieldname": "default_website_theme",
        "fieldtype": "Select",
        "label": "Default Website Theme",
        "options": "Light\nDark",
        "default": "Light",
        "insert_after": "adi_settings_tab",
        "description": "Theme the website opens in. Visitors can still "
        "switch with the sun/moon toggle.",
    },
    {
        "fieldname": "homepage_design",
        "fieldtype": "Select",
        "label": "Homepage Design",
        "options": "classic\necommerce\nportal\npersonal\nerpnext\ncustom",
        "default": "classic",
        "insert_after": "default_website_theme",
        "description": "Design the homepage renders with. Preview them "
        "under /demos on the site.",
    },
    {
        "fieldname": "homepage_content_section",
        "fieldtype": "Section Break",
        "label": "Homepage Content",
        "insert_after": "homepage_design",
    },
    {
        "fieldname": "homepage_title",
        "fieldtype": "Data",
        "label": "Homepage Title",
        "insert_after": "homepage_content_section",
        "description": "Hero heading. Leave blank for the design default.",
    },
    {
        "fieldname": "homepage_tagline",
        "fieldtype": "Small Text",
        "label": "Homepage Tagline",
        "insert_after": "homepage_title",
        "description": "One or two lines under the heading.",
    },
    {
        "fieldname": "homepage_cta_label",
        "fieldtype": "Data",
        "label": "CTA Label",
        "insert_after": "homepage_tagline",
        "description": "Main button text, e.g. Shop now.",
    },
    {
        "fieldname": "homepage_cta_url",
        "fieldtype": "Data",
        "label": "CTA URL",
        "insert_after": "homepage_cta_label",
        "description": "Where the main button goes, e.g. /login or https://...",
    },
    {
        "fieldname": "navbar_footer_section",
        "fieldtype": "Section Break",
        "label": "Navbar & Footer",
        "insert_after": "homepage_cta_url",
    },
    {
        "fieldname": "navbar_style",
        "fieldtype": "Select",
        "label": "Navbar Style",
        "options": "Default\nPlain\nGradient",
        "default": "Default",
        "insert_after": "navbar_footer_section",
        "description": "Default follows the theme. Plain uses Navbar "
        "Color; Gradient blends From/To.",
    },
    {
        "fieldname": "navbar_color",
        "fieldtype": "Color",
        "label": "Navbar Color",
        "insert_after": "navbar_style",
        "depends_on": "eval:doc.navbar_style=='Plain'",
    },
    {
        "fieldname": "navbar_gradient_from",
        "fieldtype": "Color",
        "label": "Navbar Gradient From",
        "insert_after": "navbar_color",
        "depends_on": "eval:doc.navbar_style=='Gradient'",
    },
    {
        "fieldname": "navbar_gradient_to",
        "fieldtype": "Color",
        "label": "Navbar Gradient To",
        "insert_after": "navbar_gradient_from",
        "depends_on": "eval:doc.navbar_style=='Gradient'",
    },
    {
        "fieldname": "navbar_text",
        "fieldtype": "Select",
        "label": "Navbar Text",
        "options": "Light\nDark",
        "default": "Light",
        "insert_after": "navbar_gradient_to",
        "depends_on": "eval:doc.navbar_style!='Default'",
        "description": "Text color on the custom navbar background.",
    },
    {
        "fieldname": "contact_email",
        "fieldtype": "Data",
        "label": "Footer Contact Email",
        "insert_after": "navbar_text",
        "description": "Shown in the footer Get in touch column.",
    },
    {
        "fieldname": "footer_contact_text",
        "fieldtype": "Small Text",
        "label": "Footer Contact Text",
        "insert_after": "contact_email",
        "description": "Short line above the contact email in the footer.",
    },
    {
        "fieldname": "brand_colors_section",
        "fieldtype": "Section Break",
        "label": "Brand Colors",
        "insert_after": "footer_contact_text",
    },
    {
        "fieldname": "brand_primary_color",
        "fieldtype": "Color",
        "label": "Brand Primary Color",
        "insert_after": "brand_colors_section",
        "description": "Deep/dark brand color (default #112921). Drives "
        "buttons, gradients and dark surfaces everywhere.",
    },
    {
        "fieldname": "brand_secondary_color",
        "fieldtype": "Color",
        "label": "Brand Secondary Color",
        "insert_after": "brand_primary_color",
        "description": "Lighter brand accent (default #4D6443). Both "
        "colors together re-theme the whole site.",
    },
    {
        "fieldname": "signup_terms_section",
        "fieldtype": "Section Break",
        "label": "Signup Terms",
        "insert_after": "brand_secondary_color",
    },
    {
        "fieldname": "require_terms",
        "fieldtype": "Check",
        "label": "Require Terms on Signup",
        "default": "0",
        "insert_after": "signup_terms_section",
        "description": 'Show an "I agree to the Terms & Conditions" '
        "checkbox on the signup form.",
    },
    {
        "fieldname": "terms_content",
        "fieldtype": "Text Editor",
        "label": "Terms & Conditions Content",
        "insert_after": "require_terms",
        "depends_on": "eval:doc.require_terms",
        "description": "Shown in the modal when a visitor clicks Terms & "
        "Conditions on signup.",
    },
]


def setup_website_defaults():
    """Create the Adi Settings custom fields and point the website
    home page at the SPA (only when home_page is unset, so an existing
    homepage is never stolen)."""
    from frappe.custom.doctype.custom_field.custom_field import (
        create_custom_fields,
    )

    fields = [dict(field) for field in ADI_SETTINGS_FIELDS]
    if not frappe.get_meta("Website Settings").has_field("adi_settings_tab"):
        fields[0]["insert_after"] = frappe.get_meta(
            "Website Settings"
        ).fields[-1].fieldname
    create_custom_fields({"Website Settings": fields})

    if not frappe.db.get_single_value("Website Settings", "home_page"):
        frappe.db.set_single_value("Website Settings", "home_page", "__SPA__")
    frappe.clear_cache()


def on_app_install():
    """after_install hook — configure whichever site the app is being
    installed on. Never blocks the install."""
    try:
        setup_website_defaults()
    except Exception:
        frappe.log_error(
            frappe.get_traceback(), "__APP__ SPA website setup failed"
        )
