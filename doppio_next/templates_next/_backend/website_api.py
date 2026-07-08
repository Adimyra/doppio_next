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
        "top_bar_items": items(ws.top_bar_items),
        "footer_items": items(ws.footer_items),
    }


def _require_login():
    if frappe.session.user == "Guest":
        frappe.throw(_("Please log in first"), frappe.PermissionError)


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
def get_my_account():
    """Orders, invoices and issues of the logged-in portal user
    (empty lists when ERPNext / the doctype is not installed)."""
    _require_login()
    user = frappe.session.user
    out = {"orders": [], "invoices": [], "issues": []}

    customers = []
    try:
        from erpnext.controllers.website_list_for_contact import (
            get_customers_suppliers,
        )

        customers, _suppliers = get_customers_suppliers("Sales Order", user)
    except Exception:
        pass

    if customers and frappe.db.exists("DocType", "Sales Order"):
        out["orders"] = frappe.get_all(
            "Sales Order",
            filters={"customer": ["in", customers], "docstatus": 1},
            fields=["name", "transaction_date", "status", "grand_total", "currency"],
            order_by="transaction_date desc",
            limit=20,
        )
    if customers and frappe.db.exists("DocType", "Sales Invoice"):
        out["invoices"] = frappe.get_all(
            "Sales Invoice",
            filters={"customer": ["in", customers], "docstatus": 1},
            fields=["name", "posting_date", "status", "grand_total", "currency"],
            order_by="posting_date desc",
            limit=20,
        )
    if frappe.db.exists("DocType", "Issue"):
        out["issues"] = frappe.get_all(
            "Issue",
            filters={"raised_by": user},
            fields=["name", "subject", "status", "creation"],
            order_by="creation desc",
            limit=20,
        )
    return out


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
