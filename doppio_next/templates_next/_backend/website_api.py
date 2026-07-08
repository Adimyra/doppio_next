import frappe


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
